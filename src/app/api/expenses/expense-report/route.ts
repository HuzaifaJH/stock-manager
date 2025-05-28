import { Op } from "sequelize";
import ExpenseModel from "@/lib/models/Expense";
import LedgerAccount from "@/lib/models/LedgerAccount";
import { Expense } from "@/app/utils/interfaces";

export async function POST(req: Request) {
  try {
    const { range } = await req.json();
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "daily":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "weekly":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = new Date(startOfWeek.setHours(0, 0, 0, 0));
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid range provided" }),
          { status: 400 }
        );
    }

    const expenses = (await ExpenseModel.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      include: [
        {
          model: LedgerAccount,
          attributes: ["id", "name"],
        },
      ],
    })) as unknown as Expense[];

    const summaryMap: Record<
      number,
      { id: number; name: string; total: number }
    > = {};

    for (const exp of expenses) {
      if (!exp.LedgerAccount) continue;

      const ledgerId = exp.LedgerAccount.id;
      const ledgerName = exp.LedgerAccount.name;
      const amount = exp.amount;

      if (!summaryMap[ledgerId]) {
        summaryMap[ledgerId] = {
          id: ledgerId,
          name: ledgerName,
          total: 0,
        };
      }

      summaryMap[ledgerId].total += amount;
    }

    const summary = Object.values(summaryMap);

    return Response.json(summary);
  } catch (error) {
    console.error("Error generating expense report:", error);
    return Response.json(
      { error: "Failed to generate expense report." },
      { status: 500 }
    );
  }
}
