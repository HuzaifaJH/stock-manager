import { NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import SalesReturnItem from "@/lib/models/SalesReturnItem";
import Product from "@/lib/models/Product";
import SalesReturn from "@/lib/models/SalesReturn";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";

interface SalesReturnItem {
  productId: number;
  quantity: number;
  returnPrice: number;
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  const transaction = await sequelize.transaction();
  try {
    const salesReturnId = Number(id);
    const { items, date, customerName, isPaymentMethodCash, reason } =
      await req.json();

    const salesReturn = await SalesReturn.findByPk(salesReturnId, {
      include: [SalesReturnItem],
      transaction,
    });

    if (!salesReturn) {
      await transaction.rollback();
      throw new Error("Sales return not found");
    }

    const oldItems = await SalesReturnItem.findAll({
      where: { salesReturnId },
      transaction,
    });

    for (const item of oldItems) {
      await Product.decrement("stock", {
        by: item.getDataValue("quantity"),
        where: { id: item.getDataValue("productId") },
        transaction,
      });
    }

    // Delete old items
    await SalesReturnItem.destroy({
      where: { salesReturnId },
      transaction,
    });

    // Update main sales return
    await salesReturn.update(
      { date, customerName, reason, isPaymentMethodCash },
      { transaction }
    );

    // Recalculate and add new items
    let totalAmount = 0;
    // const salesReturnItems = await Promise.all(
    items.map(async (item: SalesReturnItem) => {
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product) {
        await transaction.rollback();
        throw new Error("Product not found");
      }

      const returnItem = await SalesReturnItem.create(
        {
          salesReturnId,
          productId: item.productId,
          quantity: item.quantity,
          returnPrice: item.returnPrice,
        },
        { transaction }
      );

      await Product.increment("stock", {
        by: item.quantity,
        where: { id: item.productId },
        transaction,
      });

      totalAmount += item.quantity * item.returnPrice;
      return returnItem;
    });
    // );

    // Update transaction
    const transactionRecord = await Transaction.findOne({
      where: {
        referenceId: "SR#" + salesReturnId,
        type: "Sales Return",
      },
      transaction,
    });

    if (transactionRecord) {
      await transactionRecord.update({ date, totalAmount }, { transaction });

      await JournalEntry.destroy({
        where: { transactionId: transactionRecord.getDataValue("id") },
        transaction,
      });

      const journalEntries = [
        {
          ledgerId: 2,
          description: `Sales return from ${customerName}`,
          amount: totalAmount,
          type: "Debit",
          transactionId: transactionRecord.getDataValue("id"),
        },
        {
          ledgerId: isPaymentMethodCash === true ? 7 : 5,
          description: `Refund to ${customerName}`,
          amount: totalAmount,
          type: "Credit",
          transactionId: transactionRecord.getDataValue("id"),
        },
      ];

      await JournalEntry.bulkCreate(journalEntries, { transaction });
    }

    await transaction.commit();
    return NextResponse.json({ updated: true });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Failed to update sales return: " + error },
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
    const salesReturnId = Number(id);

    const salesReturn = await SalesReturn.findByPk(salesReturnId, {
      include: [SalesReturnItem],
      transaction,
    });

    if (!salesReturn) {
      await transaction.rollback();
      throw new Error("Sales return not found");
    }

    // Decrease stock for each item
    const oldItems = await SalesReturnItem.findAll({
      where: { salesReturnId },
      transaction,
    });

    for (const item of oldItems) {
      await Product.decrement("stock", {
        by: item.getDataValue("quantity"),
        where: { id: item.getDataValue("productId") },
        transaction,
      });
    }

    // Delete SalesReturnItems
    await SalesReturnItem.destroy({
      where: { salesReturnId },
      transaction,
    });

    // Delete Journal Entries
    const transactionRecord = await Transaction.findOne({
      where: {
        referenceId: "SR#" + salesReturnId,
        type: "Sales Return",
      },
      transaction,
    });

    if (transactionRecord) {
      await JournalEntry.destroy({
        where: { transactionId: transactionRecord.getDataValue("id") },
        transaction,
      });

      await transactionRecord.destroy({ transaction });
    }

    // Delete SalesReturn
    await salesReturn.destroy({ transaction });

    await transaction.commit();
    return NextResponse.json({ deleted: true });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Failed to delete sales return: " + error },
      { status: 500 }
    );
  }
}
