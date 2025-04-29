import { NextResponse } from "next/server";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";
import { sequelize } from "@/lib/sequelize";
// import updateAccountBalances from "@/app/utils/update-account-balances";

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

  const T = await sequelize.transaction();

  try {
    const { date, type, referenceId, totalAmount, journalEntries } =
      await req.json();

    const transaction = await Transaction.findByPk(Number(id), {
      transaction: T,
    });
    if (!transaction) {
      await T.rollback();
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    await JournalEntry.destroy({
      where: { transactionId: id },
      transaction: T,
    });

    if (journalEntries && journalEntries.length > 0) {
      for (const entry of journalEntries) {
        await JournalEntry.create(
          {
            date,
            description: entry.description,
            amount: entry.amount,
            type: entry.type,
            ledgerId: entry.ledgerId,
            transactionId: id,
          },
          { transaction: T }
        );
      }
    }

    await transaction.update(
      { date, type, referenceId, totalAmount },
      { transaction: T }
    );

    await T.commit();
    return NextResponse.json(transaction);
  } catch (error) {
    await T.rollback();
    return NextResponse.json(
      { error: "Failed to update transaction: " + error },
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

  const T = await sequelize.transaction();

  try {
    const transaction = await Transaction.findByPk(Number(id), {
      transaction: T,
    });
    if (!transaction) {
      await T.rollback();
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    await JournalEntry.destroy({
      where: { transactionId: id },
      transaction: T,
    });
    await transaction.destroy({ transaction: T });

    await T.commit();

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    await T.rollback();
    return NextResponse.json(
      { error: "Failed to delete transaction: " + error },
      { status: 500 }
    );
  }
}
