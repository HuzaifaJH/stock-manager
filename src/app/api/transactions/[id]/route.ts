import { NextResponse } from "next/server";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";
import updateAccountBalances from "@/app/api/update-account-balances";

// Update a transaction
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  if (!id || id.length === 0) {
    return NextResponse.json(
      { error: "Invalid transaction ID" },
      { status: 400 }
    );
  }
  try {
    const { date, type, referenceId, totalAmount, journalEntries } =
      await req.json();

    const transaction = await Transaction.findByPk(Number(id));
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Fetch existing journal entries for balance reversal
    const oldJournalEntries = await JournalEntry.findAll({
      where: { transactionId: id },
    });

    // Reverse the effect of old journal entries
    await updateAccountBalances(
      oldJournalEntries.map((entry: any) => ({
        ...entry.toJSON(),
        amount: -entry.amount, // Reversing previous effect
      }))
    );

    await JournalEntry.destroy({ where: { transactionId: id } });
    if (journalEntries && journalEntries.length > 0) {
      for (const entry of journalEntries) {
        await JournalEntry.create({
          date,
          description: entry.description,
          amount: entry.amount,
          type: entry.type,
          accountId: entry.accountId,
          transactionId: id,
        });
      }
    }

    // Apply the effect of new journal entries
    await updateAccountBalances(journalEntries);

    // Update transaction details
    await transaction.update({ date, type, referenceId, totalAmount });

    return NextResponse.json(transaction);

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// Delete a transaction
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  if (!id || id.length === 0) {
    return NextResponse.json(
      { error: "Invalid transaction ID" },
      { status: 400 }
    );
  }
  try {
    const transaction = await Transaction.findByPk(Number(id));
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    await JournalEntry.destroy({ where: { transactionId: id } });
    await transaction.destroy();

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
