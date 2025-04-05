import { NextResponse } from "next/server";
import JournalEntry from "@/lib/models/JournalEntry";
import Account from "@/lib/models/Account";
import { Op } from "sequelize";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Date range is required" },
        { status: 400 }
      );
    }

    // Define account types
    const revenueAccounts = ["Sales Revenue", "Service Revenue"];
    const expenseAccounts = [
      "Utilities Expense",
      "Salaries Expense",
      "Rent Expense",
    ];
    const cogsAccounts = ["Cost of Goods Sold"];

    // Fetch journal entries within date range
    const journalEntries = await JournalEntry.findAll({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
      },
      include: [{ model: Account, attributes: ["name"] }],
      raw: true,
    });

    // Initialize totals
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalCOGS = 0;

    // Aggregate values
    journalEntries.forEach((entry: any) => {
      const accountName = entry["Account.name"];
      const amount = parseFloat(entry.amount);

      if (revenueAccounts.includes(accountName) && entry.type === "Credit") {
        totalRevenue += amount;
      } else if (
        expenseAccounts.includes(accountName) &&
        entry.type === "Debit"
      ) {
        totalExpenses += amount;
      } else if (cogsAccounts.includes(accountName) && entry.type === "Debit") {
        totalCOGS += amount;
      }
    });

    // Calculate Profit & Loss
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    return NextResponse.json({
      totalRevenue,
      totalCOGS,
      grossProfit,
      totalExpenses,
      netProfit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error generating Income Statement: " + error },
      { status: 500 }
    );
  }
}
