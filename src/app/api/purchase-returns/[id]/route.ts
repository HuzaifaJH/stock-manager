import { NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import Product from "@/lib/models/Product";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";
import PurchaseReturn from "@/lib/models/PurchaseReturn";
import PurchaseReturnItem from "@/lib/models/PurchaseReturnItem";

interface PurchaseReturnItem {
  productId: number;
  quantity: number;
  purchaseReturnPrice: number;
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  const transaction = await sequelize.transaction();
  try {
    const purchaseReturnId = Number(id);
    const { supplierId, date, items, isPaymentMethodCash, reason } = await req.json();

    const existingPurchaseReturn = await PurchaseReturn.findByPk(
      purchaseReturnId,
      {
        include: [PurchaseReturnItem],
        transaction,
      }
    );

    if (!existingPurchaseReturn) {
      await transaction.rollback();
      throw new Error("Purchase return not found");
    }

    const oldItems = await PurchaseReturnItem.findAll({
      where: { purchaseReturnId },
      transaction,
    });

    // Restore previous stock
    for (const item of oldItems) {
      await Product.increment("stock", {
        by: item.getDataValue("quantity"),
        where: { id: item.getDataValue("productId") },
        transaction,
      });
    }

    // Delete old return items
    await PurchaseReturnItem.destroy({
      where: { purchaseReturnId },
      transaction,
    });

    // Update purchase return record
    await existingPurchaseReturn.update(
      { supplierId, date, reason, isPaymentMethodCash },
      { transaction }
    );

    // Recalculate total
    const totalAmount = items.reduce(
      (sum: number, item: { purchaseReturnPrice: number; quantity: number }) =>
        sum + item.purchaseReturnPrice * item.quantity,
      0
    );

    // Add new return items
    items.map(async (item: PurchaseReturnItem) => {
      const product = await Product.findByPk(item.productId, { transaction });
      // const product = await Product.findOne({
      //   where: { id: item.productId },
      //   transaction,
      //   lock: transaction.LOCK.UPDATE,
      // });
      if (!product) {
        await transaction.rollback();
        throw new Error("Product not found");
      } else if (product.getDataValue("stock") < item.quantity) {
        await transaction.rollback();
        throw new Error("Insufficient stock");
      }

      const newItem = await PurchaseReturnItem.create(
        {
          purchaseReturnId,
          productId: item.productId,
          quantity: item.quantity,
          purchaseReturnPrice: item.purchaseReturnPrice,
        },
        { transaction }
      );

      await Product.decrement("stock", {
        by: item.quantity,
        where: { id: item.productId },
        transaction,
      });

      return newItem;
    });

    const oldTransaction = await Transaction.findOne({
      where: { referenceId: purchaseReturnId, type: "Purchase Return" },
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
        type: "Purchase Return",
        referenceId: purchaseReturnId,
        totalAmount,
      },
      { transaction }
    );

    const paymentAccountId = isPaymentMethodCash === true ? 7 : 6;

    const journalEntries = [
      {
        transactionId: newTransaction.getDataValue("id"),
        ledgerId: paymentAccountId,
        description: "Refund from Purchase Return",
        amount: totalAmount,
        type: "Debit",
      },
      {
        transactionId: newTransaction.getDataValue("id"),
        ledgerId: 4,
        description: "Inventory Returned",
        amount: totalAmount,
        type: "Credit",
      },
    ];

    await JournalEntry.bulkCreate(journalEntries, { transaction });

    await transaction.commit();

    return NextResponse.json({
      message: "Purchase Return updated successfully",
    });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Failed to update purchase return: " + error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  const transaction = await sequelize.transaction();
  try {
    const purchaseReturnId = Number(id);
    const purchaseReturn = await PurchaseReturn.findByPk(purchaseReturnId, {
      include: [PurchaseReturnItem],
      transaction,
    });

    if (!purchaseReturn) {
      await transaction.rollback();
      throw new Error("Purchase return not found");
    }

    const oldItems = await PurchaseReturnItem.findAll({
      where: { purchaseReturnId },
      transaction,
    });

    // Restore previous stock
    for (const item of oldItems) {
      await Product.increment("stock", {
        by: item.getDataValue("quantity"),
        where: { id: item.getDataValue("productId") },
        transaction,
      });
    }

    // Delete purchase return items
    await PurchaseReturnItem.destroy({
      where: { purchaseReturnId },
      transaction,
    });

    // Delete journal entries and transaction
    const existingTransaction = await Transaction.findOne({
      where: { type: "Purchase Return", referenceId: purchaseReturnId },
      transaction,
    });

    if (existingTransaction) {
      await JournalEntry.destroy({
        where: { transactionId: existingTransaction.getDataValue("id") },
        transaction,
      });

      await existingTransaction.destroy({ transaction });
    }

    // Delete the main purchase return record
    await purchaseReturn.destroy({ transaction });

    await transaction.commit();

    return NextResponse.json({
      message: "Purchase return deleted successfully.",
    });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Failed to delete purchase return: " + error },
      { status: 500 }
    );
  }
}
