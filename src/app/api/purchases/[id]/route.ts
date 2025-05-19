import { NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import Product from "@/lib/models/Product";
import Purchase from "@/lib/models/Purchase";
import Supplier from "@/lib/models/Supplier";
import PurchaseItem from "@/lib/models/PurchaseItem";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";

// GET: Fetch a single purchase by ID
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
  }

  try {
    const purchase = await Purchase.findByPk(Number(id), {
      include: [
        {
          model: Supplier,
          attributes: ["name"],
        },
        {
          model: PurchaseItem,
          include: [
            {
              model: Product,
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    const purchaseJSON = purchase.toJSON();

    let totalPrice = 0;

    const updatedPurchaseItems = purchaseJSON.PurchaseItems.map(
      (item: { purchasePrice: number; quantity: number }) => {
        const totalPurchasePrice = item.purchasePrice * item.quantity;
        totalPrice += totalPurchasePrice;
        return { ...item, totalPurchasePrice };
      }
    );

    return NextResponse.json({
      ...purchaseJSON,
      PurchaseItems: updatedPurchaseItems,
      totalPrice,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch purchase: " + error },
      { status: 500 }
    );
  }
}

// PUT: Update a purchase
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  const transaction = await sequelize.transaction();

  if (!id) {
    return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
  }

  try {
    const purchaseId = Number(id);
    const { supplierId, date, items, isPaymentMethodCash, discount } =
      await req.json();

    // Calculate total purchase amount
    let totalAmount = items.reduce(
      (sum: number, item: { purchasePrice: number; quantity: number }) =>
        sum + item.purchasePrice * item.quantity,
      0
    );

    totalAmount -= discount;

    const existingPurchase = await Purchase.findByPk(purchaseId, {
      include: [{ model: PurchaseItem }],
      transaction,
    });

    if (!existingPurchase) {
      await transaction.rollback();
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    const oldItems = await PurchaseItem.findAll({
      where: { purchaseId },
      transaction,
    });

    let oldTotalAmount = 0;
    for (const item of oldItems) {
      const product = await Product.findByPk(item.getDataValue("productId"), {
        transaction,
      });
      if (!product) throw new Error("Product not found");

      const currentStock = product.getDataValue("stock") ?? 0;
      const currentPrice = product.getDataValue("price") ?? 0;

      const reverseQty = item.getDataValue("quantity");
      const reverseCost = item.getDataValue("purchasePrice");

      const remainingQty = currentStock - reverseQty;
      const remainingTotalCost =
        currentStock * currentPrice - reverseQty * reverseCost;

      const adjustedPrice =
        remainingQty > 0 ? Math.round(remainingTotalCost / remainingQty) : 0;

      await product.update(
        {
          stock: remainingQty,
          price: adjustedPrice,
        },
        { transaction }
      );

      oldTotalAmount +=
        item.getDataValue("quantity") * item.getDataValue("purchasePrice");
    }

    oldTotalAmount -= existingPurchase.getDataValue("discount");

    // Delete old PurchaseItems
    await PurchaseItem.destroy({ where: { purchaseId }, transaction });

    if (!existingPurchase.getDataValue("isPaymentMethodCash")) {
      await Supplier.decrement("payableAmount", {
        by: oldTotalAmount,
        where: { id: supplierId },
        transaction,
      });
    }

    // Create new PurchaseItems and update stock
    // let totalAmount = 0;
    for (const item of items) {
      await PurchaseItem.create(
        {
          purchaseId,
          productId: item.productId,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
        },
        { transaction }
      );

      // totalAmount += item.quantity * item.purchasePrice;

      // await Product.increment("stock", {
      //   by: item.quantity,
      //   where: { id: item.productId },
      //   transaction,
      // });

      const product = await Product.findByPk(item.productId, { transaction });
      if (!product) throw new Error("Product not found");

      const currentStock = product.getDataValue("stock") ?? 0;
      const currentPrice = product.getDataValue("price") ?? 0;

      const newQty = item.quantity ?? 0;
      const newPrice = item.purchasePrice ?? 0;

      const totalQty = currentStock + newQty;
      const totalCost = currentStock * currentPrice + newQty * newPrice;
      const weightedAvgCost =
        totalQty > 0 ? Math.round(totalCost / totalQty) : Math.round(newPrice);

      await product.update(
        {
          stock: totalQty,
          price: weightedAvgCost,
        },
        { transaction }
      );
    }

    // Update the main Purchase record
    await existingPurchase.update(
      { supplierId, date, isPaymentMethodCash, discount },
      { transaction }
    );

    if (!isPaymentMethodCash) {
      await Supplier.increment("payableAmount", {
        by: totalAmount,
        where: { id: supplierId },
        transaction,
      });
    }

    // Delete old transaction and journal entries
    const oldTransaction = await Transaction.findOne({
      where: { referenceId: "P#" + purchaseId, type: "Purchase" },
      transaction,
    });

    if (oldTransaction) {
      await JournalEntry.destroy({
        where: { transactionId: oldTransaction.getDataValue("id") },
        transaction,
      });
      await oldTransaction.destroy({ transaction });
    }

    // Create new transaction and journal entries
    const newTransaction = await Transaction.create(
      {
        date,
        type: "Purchase",
        referenceId: "P#" + purchaseId,
        totalAmount,
      },
      { transaction }
    );

    const paymentAccountId = isPaymentMethodCash === true ? 7 : 6;

    const journalEntries = [
      {
        transactionId: newTransaction.getDataValue("id"),
        ledgerId: 3,
        description: "Purchase Inventory",
        amount: totalAmount,
        type: "Debit",
      },
      {
        transactionId: newTransaction.getDataValue("id"),
        ledgerId: paymentAccountId,
        description: "Payment for Purchase",
        amount: totalAmount,
        type: "Credit",
      },
    ];

    await JournalEntry.bulkCreate(journalEntries, { transaction });

    await transaction.commit();

    return NextResponse.json({ message: "Purchase updated successfully" });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Failed to update purchase: " + error },
      { status: 500 }
    );
  }
}

// DELETE: Remove a purchase
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  const transaction = await sequelize.transaction();

  try {
    const purchaseId = Number(id);

    const purchase = await Purchase.findByPk(purchaseId, { transaction });

    if (!purchase) {
      await transaction.rollback();
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    const purchaseItems = await PurchaseItem.findAll({
      where: { purchaseId },
      transaction,
    });

    for (const item of purchaseItems) {
      // await Product.increment("stock", {
      //   by: -item.getDataValue("quantity"),
      //   where: { id: item.getDataValue("productId") },
      //   transaction,
      // });

      const product = await Product.findByPk(item.getDataValue("productId"), {
        transaction,
      });
      if (!product) throw new Error("Product not found");

      const currentStock = product.getDataValue("stock") ?? 0;
      const currentPrice = product.getDataValue("price") ?? 0;

      const reverseQty = item.getDataValue("quantity");
      const reverseCost = item.getDataValue("purchasePrice");

      const remainingQty = currentStock - reverseQty;
      const remainingTotalCost =
        currentStock * currentPrice - reverseQty * reverseCost;

      const adjustedPrice =
        remainingQty > 0 ? Math.round(remainingTotalCost / remainingQty) : 0;

      await product.update(
        {
          stock: remainingQty,
          price: adjustedPrice,
        },
        { transaction }
      );
    }

    await PurchaseItem.destroy({ where: { purchaseId }, transaction });
    await Purchase.destroy({ where: { id: purchaseId }, transaction });

    const relatedTransaction = await Transaction.findOne({
      where: { referenceId: "P#" + purchaseId, type: "Purchase" },
      transaction,
    });

    if (relatedTransaction) {
      await JournalEntry.destroy({
        where: { transactionId: relatedTransaction.getDataValue("id") },
        transaction,
      });

      await Transaction.destroy({
        where: { id: relatedTransaction.getDataValue("id") },
        transaction,
      });
    }

    await transaction.commit();

    return NextResponse.json({ message: "Purchase deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Failed to delete purchase: " + error },
      { status: 500 }
    );
  }
}
