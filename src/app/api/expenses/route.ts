import { NextRequest, NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import Expense from "@/lib/models/Expense";
import LedgerAccount from "@/lib/models/LedgerAccount";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";

// GET All Expenses
export async function GET() {
  try {
    const expenses = await Expense.findAll({
      include: [
        {
          model: LedgerAccount,
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch expenses: " + error },
      { status: 500 }
    );
  }
}

// POST - Create Expense
export async function POST(req: NextRequest) {
  const transaction = await sequelize.transaction();
  try {
    const { expenseLedgerAccount, date, amount, description } =
      await req.json();

    const expense = await Expense.create(
      {
        expenseLedgerAccount,
        date,
        amount,
        description,
      },
      { transaction }
    );

    // Create Transaction record
    const newTransaction = await Transaction.create(
      {
        date,
        type: "Expense",
        referenceId: "Exp#" + expense.getDataValue("id"),
        totalAmount: amount,
      },
      { transaction }
    );

    // Create Journal Entries
    const journalEntries = [
      {
        transactionId: newTransaction.getDataValue("id"),
        ledgerId: expenseLedgerAccount, // Expense Account
        description,
        amount,
        type: "Debit",
      },
      {
        transactionId: newTransaction.getDataValue("id"),
        ledgerId: 7, // Cash
        description,
        amount,
        type: "Credit",
      },
    ];

    // Save Journal Entries
    await JournalEntry.bulkCreate(journalEntries, { transaction });

    await transaction.commit();

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Error creating expense: " + error },
      { status: 500 }
    );
  }
}

// PUT - Edit Expense
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const transaction = await sequelize.transaction();
  try {
    const { expenseLedgerAccount, date, amount, description } =
      await req.json();

    // Update the Expense
    await Expense.update(
      {
        expenseLedgerAccount,
        date,
        amount,
        description,
      },
      {
        where: { id },
        transaction,
      }
    );

    // Find and update the linked Transaction
    const referenceId = "Exp#" + id;
    const existingTransaction = await Transaction.findOne({
      where: { referenceId },
      transaction,
    });

    if (!existingTransaction) {
      throw new Error("Transaction not found");
    }

    await Transaction.update(
      {
        date,
        totalAmount: amount,
      },
      {
        where: { id: existingTransaction.getDataValue("id") },
        transaction,
      }
    );

    // Remove old Journal Entries
    await JournalEntry.destroy({
      where: { transactionId: existingTransaction.getDataValue("id") },
      transaction,
    });

    // Create updated Journal Entries
    const updatedJournalEntries = [
      {
        transactionId: existingTransaction.getDataValue("id"),
        ledgerId: expenseLedgerAccount,
        description,
        amount,
        type: "Debit",
      },
      {
        transactionId: existingTransaction.getDataValue("id"),
        ledgerId: 7, // Cash
        description,
        amount,
        type: "Credit",
      },
    ];

    await JournalEntry.bulkCreate(updatedJournalEntries, { transaction });

    await transaction.commit();

    return NextResponse.json(
      { message: "Expense updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Error updating expense: " + error },
      { status: 500 }
    );
  }
}

// DELETE - Delete Expense
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const transaction = await sequelize.transaction();
  try {
    const referenceId = "Exp#" + id;

    // Find the related Transaction
    const existingTransaction = await Transaction.findOne({
      where: { referenceId },
      transaction,
    });

    if (!existingTransaction) {
      throw new Error("Transaction not found");
    }

    const transactionId = existingTransaction.getDataValue("id");

    // Delete Journal Entries
    await JournalEntry.destroy({
      where: { transactionId },
      transaction,
    });

    // Delete Transaction
    await Transaction.destroy({
      where: { id: transactionId },
      transaction,
    });

    // Delete Expense
    await Expense.destroy({
      where: { id },
      transaction,
    });

    await transaction.commit();

    return NextResponse.json(
      { message: "Expense deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Error deleting expense: " + error },
      { status: 500 }
    );
  }
}
