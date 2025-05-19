import { NextResponse } from "next/server";
import SalesItem from "@/lib/models/SalesItem";
import Product from "@/lib/models/Product";
import Sales from "@/lib/models/Sales";
import { sequelize } from "@/lib/sequelize";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";
import { _SalesItem } from "@/app/utils/interfaces";

// GET a single sales by ID
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  try {
    const sales = await Sales.findByPk(Number(id), {
      include: [
        {
          model: SalesItem,
          include: [{ model: Product, attributes: ["name"] }],
        },
      ],
    });

    if (!sales) {
      return NextResponse.json({ error: "Sales not found" }, { status: 404 });
    }

    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching sales: " + error },
      { status: 500 }
    );
  }
}

// PUT update a sales
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  const transaction = await sequelize.transaction();

  try {
    const salesId = Number(id);
    const { items, date, customerName, isPaymentMethodCash, discount } =
      await req.json();

    const existingSale = await Sales.findByPk(salesId, {
      include: [SalesItem],
      transaction,
    });
    if (!existingSale) {
      await transaction.rollback();
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const oldItems = await SalesItem.findAll({
      where: { salesId },
      transaction,
    });

    let oldTotalAmount = 0;
    for (const item of oldItems) {
      await Product.increment("stock", {
        by: item.getDataValue("quantity"),
        where: { id: item.getDataValue("productId") },
        transaction,
      });
      oldTotalAmount +=
        item.getDataValue("quantity") * item.getDataValue("sellingPrice");
    }

    oldTotalAmount -= existingSale.getDataValue("discount");

    // Delete old sales items
    await SalesItem.destroy({ where: { salesId }, transaction });

    if (!existingSale.getDataValue("isPaymentMethodCash")) {
      await existingSale.decrement("payableAmount", {
        by: oldTotalAmount,
        transaction,
      });
    }

    // Recreate sales items
    let totalAmount = 0;
    const newSalesItems = await Promise.all(
      items.map(async (item: _SalesItem) => {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) {
          await transaction.rollback();
          throw new Error("Product not found");
        }
        if (product.getDataValue("stock") < item.quantity) {
          await transaction.rollback();
          throw new Error("Insufficient stock");
        }

        const salesItem = await SalesItem.create(
          {
            salesId,
            productId: item.productId,
            quantity: item.quantity,
            sellingPrice: item.sellingPrice,
            costPrice: item.costPrice,
          },
          { transaction }
        );

        // Deduct new stock
        await product.update(
          { stock: product.getDataValue("stock") - item.quantity },
          { transaction }
        );

        totalAmount += item.quantity * item.sellingPrice;
        return salesItem;
      })
    );

    totalAmount -= discount;

    // Update sale info
    await existingSale.update(
      { date, customerName, isPaymentMethodCash, discount },
      { transaction }
    );

    if (!isPaymentMethodCash) {
      await existingSale.increment("payableAmount", {
        by: totalAmount,
        transaction,
      });
    }

    // Delete old transaction and journal entries
    const oldTransaction = await Transaction.findOne({
      where: { referenceId: "S#" + salesId, type: "Sale" },
      transaction,
    });

    if (oldTransaction) {
      await JournalEntry.destroy({
        where: { transactionId: oldTransaction.getDataValue("id") },
        transaction,
      });
      await oldTransaction.destroy({ transaction });
    }

    const newTransaction = await Transaction.create(
      {
        date,
        type: "Sale",
        referenceId: "S#" + salesId,
        totalAmount,
      },
      { transaction }
    );

    const journalEntries = [
      {
        ledgerId: isPaymentMethodCash === true ? 7 : 5,
        description: `Updated sale to ${customerName}`,
        amount: totalAmount,
        type: "Debit",
        transactionId: newTransaction.getDataValue("id"),
      },
      {
        ledgerId: 1,
        description: `Updated revenue from sale to ${customerName}`,
        amount: totalAmount,
        type: "Credit",
        transactionId: newTransaction.getDataValue("id"),
      },
    ];

    await JournalEntry.bulkCreate(journalEntries, { transaction });

    await transaction.commit();
    return NextResponse.json({ sale: existingSale, items: newSalesItems });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Error updating sale: " + error },
      { status: 500 }
    );
  }
}

// // Update transaction record
// const existingTransaction = await Transaction.findOne({
//   where: { referenceId: id, type: "Sale" },
//   transaction,
// });

// if (existingTransaction) {
//   await JournalEntry.destroy({
//     where: { transactionId: existingTransaction.id },
//     transaction,
//   });

//   await existingTransaction.update({ date, totalAmount }, { transaction });

//   const journalEntries = [
//     {
//       ledgerId: paymentMethod === "Cash" ? 7 : 5,
//       description: `Updated sale to ${customerName}`,
//       amount: totalAmount,
//       type: "Debit",
//       transactionId: existingTransaction.id,
//     },
//     {
//       ledgerId: 1,
//       description: `Updated revenue from sale to ${customerName}`,
//       amount: totalAmount,
//       type: "Credit",
//       transactionId: existingTransaction.id,
//     },
//   ];

//   await JournalEntry.bulkCreate(journalEntries, { transaction });
// }

// DELETE a sales
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  const transaction = await sequelize.transaction();

  try {
    const salesId = Number(id);
    const existingSale = await Sales.findByPk(salesId, {
      include: [SalesItem],
      transaction,
    });

    if (!existingSale) {
      await transaction.rollback();
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const salesItems = await SalesItem.findAll({
      where: { salesId },
      transaction,
    });

    // Restore stock for each sale item
    let oldTotalAmount = 0;
    for (const item of salesItems) {
      await Product.increment("stock", {
        by: item.getDataValue("quantity"),
        where: { id: item.getDataValue("productId") },
        transaction,
      });
      oldTotalAmount +=
        item.getDataValue("quantity") * item.getDataValue("sellingPrice");
    }

    oldTotalAmount -= existingSale.getDataValue("discount");

    // Delete old sales items
    await SalesItem.destroy({ where: { salesId }, transaction });

    if (!existingSale.getDataValue("isPaymentMethodCash")) {
      await existingSale.decrement("payableAmount", {
        by: oldTotalAmount,
        transaction,
      });
    }

    await Sales.destroy({ where: { id: salesId }, transaction });

    // Delete associated journal entries
    const saleTransaction = await Transaction.findOne({
      where: { referenceId: "S#" + salesId, type: "Sale" },
      transaction,
    });

    if (saleTransaction) {
      await JournalEntry.destroy({
        where: { transactionId: saleTransaction.getDataValue("id") },
        transaction,
      });

      await saleTransaction.destroy({ transaction });
    }

    await transaction.commit();
    return NextResponse.json({ message: "Sale deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Failed to delete sale: " + error },
      { status: 500 }
    );
  }
}
