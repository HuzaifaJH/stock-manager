// app/api/manual-supplier-payment/route.ts

import { NextRequest, NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import Supplier from "@/lib/models/Supplier";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";

export async function POST(req: NextRequest) {
  const transaction = await sequelize.transaction();
  try {
    const { accountLedgerId, amount, supplierId } = await req.json();

    // Update supplier's payable amount
    await Supplier.decrement("payableAmount", {
      by: amount,
      where: { id: supplierId },
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
        ledgerId: 6,
        description: "Payment to Supplier",
        amount: amount,
        type: "Debit",
      },
      {
        transactionId: newTransaction.getDataValue("id"),
        ledgerId: accountLedgerId,
        description: "Payment to Supplier",
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
      { error: "Error processing supplier payment", details: error },
      { status: 500 }
    );
  }
}
