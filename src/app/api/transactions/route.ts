import { NextResponse } from "next/server";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";
import updateAccountBalances from "@/app/api/update-account-balances";

// Get all transactions
export async function GET() {
  try {
    const transactions = await Transaction.findAll({ include: JournalEntry });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions: " + error },
      { status: 500 }
    );
  }
}

// Create a new transaction
export async function POST(req: Request) {
  try {
    const { date, type, referenceId, totalAmount, journalEntries } =
      await req.json();

    const transaction = await Transaction.create({
      date,
      type,
      referenceId,
      totalAmount,
    });

    if (journalEntries && journalEntries.length > 0) {
      for (const entry of journalEntries) {
        await JournalEntry.create({
          date,
          description: entry.description,
          amount: entry.amount,
          type: entry.type,
          accountId: entry.accountId,
          transactionId: transaction.getDataValue("id"),
        });
      }
    }

    // Update account balances
    await updateAccountBalances(journalEntries);

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create transaction:" + error },
      { status: 500 }
    );
  }
}