import { NextResponse } from "next/server";
import { Op } from "sequelize";
import JournalEntry from "@/lib/models/JournalEntry";
import Account from "@/lib/models/Account";

export async function GET(req: Request) {
  try {
    // Fetch all journal entries and group by account
    const journalEntries = (await JournalEntry.findAll({
      attributes: ["accountId", "type", ["amount", "totalAmount"]],
      raw: true,
    })) as unknown as {
      accountId: number;
      type: string;
      totalAmount: string;
    }[];

    // Aggregate total debits and credits per account
    const trialBalance: any = {};
    journalEntries.forEach(({ accountId, type, totalAmount }) => {
      if (!trialBalance[accountId]) {
        trialBalance[accountId] = { accountId, totalDebit: 0, totalCredit: 0 };
      }
      if (type === "Debit") {
        trialBalance[accountId].totalDebit += parseFloat(totalAmount);
      } else {
        trialBalance[accountId].totalCredit += parseFloat(totalAmount);
      }
    });

    // Fetch account names
    const accounts = await Account.findAll({
      attributes: ["id", "name"],
      raw: true,
    });
    const accountMap = Object.fromEntries(
      accounts.map((acc: any) => [acc.id, acc.name])
    );

    // Convert to array and include account names
    const result = Object.values(trialBalance).map((entry: any) => ({
      ...entry,
      accountName: accountMap[entry.accountId] || "Unknown",
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch trial balance: " + error },
      { status: 500 }
    );
  }
}
