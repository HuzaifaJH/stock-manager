import { NextResponse } from "next/server";
import JournalEntry from "@/lib/models/JournalEntry";
import LedgerAccount from "@/lib/models/LedgerAccount";
import { Op } from "sequelize";
import Transaction from "@/lib/models/Transaction";
import PurchaseModel from "@/lib/models/Purchase";
import Supplier from "@/lib/models/Supplier";
import AccountGroup from "@/lib/models/AccountGroup";
import { LedgerEntries, Purchase } from "@/app/utils/interfaces";

// interface JournalEntryWithRelations extends Model {
//   Transaction?: typeof Transaction & {
//     dataValues: Record<string, any>;
//     type: string;
//     referenceId: string;
//     refId: number;
//   };
//   LedgerAccount?: typeof LedgerAccount;
// }

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    // const type = searchParams.get("type");

    const whereClause: Partial<{ ledgerId: string }> = {};

    if (accountId) whereClause.ledgerId = accountId;

    const where = {
      date: {
        ...(dateFrom && { [Op.gte]: new Date(dateFrom) }),
        ...(dateTo && {
          [Op.lte]: new Date(new Date(dateTo).setHours(23, 59, 59, 999)),
        }),
      },
    };

    const ledgerEntries = (await JournalEntry.findAll({
      where: whereClause,
      include: [
        {
          model: LedgerAccount,
          attributes: ["id", "name"],
          include: [
            {
              model: AccountGroup,
              attributes: ["id", "name", "accountType"],
            },
          ],
        },
        {
          model: Transaction,
          where,
        },
      ],
      order: [["createdAt", "DESC"]],
    })) as unknown as LedgerEntries[];

    ledgerEntries.forEach((x) => {
      if (x?.Transaction?.referenceId) {
        x.Transaction.refId = Number(
          x.Transaction.referenceId.replace(/^[A-Z]+#/, "")
        );
      }
    });

    const purchaseIds = ledgerEntries
      .filter(
        (e: LedgerEntries) =>
          e.Transaction?.type === "Purchase" ||
          e.Transaction?.type === "Purchase Return"
      )
      .map((e: LedgerEntries) => e.Transaction.refId);

    const purchases = (await PurchaseModel.findAll({
      where: { id: purchaseIds },
      include: { model: Supplier, attributes: ["id", "name"] },
    })) as unknown as Purchase[];

    const purchaseMap = Object.fromEntries(purchases.map((p) => [p.id, p]));

    for (const entry of ledgerEntries) {
      const tx = entry.Transaction;
      if (tx?.type === "Purchase" || tx?.type === "Purchase Return") {
        if (tx && tx.dataValues && tx.refId) {
          tx.dataValues.purchaseDetails = purchaseMap[tx.refId];
        }
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
