import { NextRequest, NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import Sales from "@/lib/models/Sales";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";

export async function GET() {
  try {
    const creditSales = await Sales.findAll({
      where: { isPaymentMethodCash: false },
      attributes: ["id", "date", "customerName", "payableAmount"],
      order: [["date", "DESC"]],
    });

    return NextResponse.json(creditSales);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch credit sales: " + error },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const transaction = await sequelize.transaction();
  try {
    const { amount, id, customerName } = await req.json();

    await Sales.decrement("payableAmount", {
      by: amount,
      where: { id },
      transaction,
    });

    // Create transaction
    const newTransaction = await Transaction.create(
      {
        date: new Date(),
        type: "Manual Entry",
        totalAmount: amount,
      },
      { transaction }
    );

    await newTransaction.update(
      { referenceId: "ME#" + newTransaction.getDataValue("id") },
      { transaction }
    );

    // Create journal entries
    const journalEntries = [
      {
        transactionId: newTransaction.getDataValue("id"),
        ledgerId: 7,
        description: "Payment from " + customerName,
        amount: amount,
        type: "Debit",
      },
      {
        transactionId: newTransaction.getDataValue("id"),
        ledgerId: 5,
        description: "Payment from " + customerName,
        amount: amount,
        type: "Credit",
      },
    ];

    await JournalEntry.bulkCreate(journalEntries, { transaction });

    await transaction.commit();
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Error processing customer payment", details: error },
      { status: 500 }
    );
  }
}
