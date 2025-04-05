import { NextResponse } from "next/server";
import JournalEntry from "@/lib/models/JournalEntry";
import Account from "@/lib/models/Account";
import { Op } from "sequelize";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const type = searchParams.get("type");

    const whereClause: any = {};

    if (accountId) whereClause.accountId = accountId;
    if (dateFrom && dateTo) {
      whereClause.createdAt = {
        [Op.between]: [dateFrom, dateTo],
      };
    }
    if (type) whereClause.type = type;

    const ledgerEntries = await JournalEntry.findAll({
      where: whereClause,
      include: [
        {
          model: Account,
          attributes: ["name"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return NextResponse.json(ledgerEntries);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch ledger entries: " + error },
      { status: 500 }
    );
  }
}
