import { NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";
// import updateAccountBalances from "@/app/utils/update-account-balances";
import LedgerAccount from "@/lib/models/LedgerAccount";
import { AccountGroup } from "@/lib/models";

// Get all transactions
export async function GET() {
  try {
    const transactions = await Transaction.findAll({
      include: [
        {
          model: JournalEntry,
          include: [
            {
              model: LedgerAccount,
              include: [
                {
                  model: AccountGroup,
                },
              ],
              attributes: ["id", "name", "accountGroup"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const result = transactions.map((transactions) => {
      const plainTransactions = transactions.get({ plain: true });

      plainTransactions.JournalEntries = plainTransactions.JournalEntries.map(
        (item: {
          LedgerAccount: {
            AccountGroup: { accountType: number };
            accountGroup: number;
          };
        }) => {
          const { accountGroup } = item.LedgerAccount;
          const { accountType } = item.LedgerAccount.AccountGroup;
          return {
            ...item,
            accountGroup,
            accountType,
          };
        }
      );

      return plainTransactions;
    });

    const sortedTransactions = result.map((txn) => {
      // const txnJSON = txn.toJSON();
      txn.JournalEntries = txn.JournalEntries.sort((a: { type: string }) =>
        a.type === "Debit" ? -1 : 1
      );
      return txn;
    });

    return NextResponse.json(sortedTransactions);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions: " + error },
      { status: 500 }
    );
  }
}

// Create a new transaction
export async function POST(req: Request) {
  const transaction = await sequelize.transaction();
  try {
    const { date, type, totalAmount, journalEntries } =
      await req.json();

    const newTransaction = await Transaction.create(
      {
        date,
        type,
        // referenceId,
        totalAmount,
      },
      { transaction }
    );

    await newTransaction.update(
      { referenceId: "ME#" + newTransaction.getDataValue("id") },
      { transaction }
    );

    if (journalEntries && journalEntries.length > 0) {
      for (const entry of journalEntries) {
        await JournalEntry.create(
          {
            date,
            description: entry.description,
            amount: entry.amount,
            type: entry.type,
            ledgerId: entry.ledgerId,
            transactionId: newTransaction.getDataValue("id"),
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Failed to create transaction:" + error },
      { status: 500 }
    );
  }
}
