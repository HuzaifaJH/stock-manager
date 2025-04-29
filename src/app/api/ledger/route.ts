/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import JournalEntry from "@/lib/models/JournalEntry";
import LedgerAccounts from "@/lib/models/LedgerAccount";
import { Model, Op } from "sequelize";
import Transaction from "@/lib/models/Transaction";
import Purchase from "@/lib/models/Purchase";
import Supplier from "@/lib/models/Supplier";
interface JournalEntryWithRelations extends Model {
  Transaction?: typeof Transaction & {
    dataValues: Record<string, any>;
    type: string;
    referenceId: string;
  };
  LedgerAccount?: typeof LedgerAccounts;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    // const type = searchParams.get("type");

    const whereClause: any = {};

    if (accountId) whereClause.ledgerId = accountId;
    if (dateFrom && dateTo) {
      whereClause.createdAt = {
        [Op.between]: [dateFrom, dateTo],
      };
    }
    // if (type) whereClause.type = type;

    const ledgerEntries = (await JournalEntry.findAll({
      where: whereClause,
      include: [
        {
          model: LedgerAccounts,
          attributes: ["name"],
        },
        {
          model: Transaction,
        },
      ],
      order: [["createdAt", "ASC"]],
    })) as JournalEntryWithRelations[];

    const purchaseIds = ledgerEntries
      .filter(
        (e: any) =>
          e.Transaction?.type === "Purchase" ||
          e.Transaction?.type === "Purchase Return"
      )
      .map((e: any) => e.Transaction.referenceId);

    const purchases = await Purchase.findAll({
      where: { id: purchaseIds },
      include: { model: Supplier, attributes: ["name"] },
    });
    const purchaseMap = Object.fromEntries(
      purchases.map((p: any) => [p.id, p])
    );

    for (const entry of ledgerEntries) {
      const tx = entry.Transaction;
      if (tx?.type === "Purchase" || tx?.type === "Purchase Return") {
        tx.dataValues.purchaseDetails = purchaseMap[tx.referenceId];
      }
    }

    return NextResponse.json(ledgerEntries);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch ledger entries: " + error },
      { status: 500 }
    );
  }
}
