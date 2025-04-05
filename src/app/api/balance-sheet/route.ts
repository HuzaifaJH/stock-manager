import { NextResponse } from "next/server";
import Account from "@/lib/models/Account";
import { Op } from "sequelize";

export async function GET() {
  try {
    // Fetch all accounts categorized as Assets, Liabilities, or Equity
    // const assets = await Account.findAll({ where: { type: "Asset" }, raw: true });
    // const liabilities = await Account.findAll({ where: { type: "Liability" }, raw: true });
    // const equity = await Account.findAll({ where: { type: "Equity" }, raw: true });

    const accounts = await Account.findAll({ raw: true });

    // Separate into categories
    const assets = accounts.filter((acc: any) => acc.type === "Asset");
    const liabilities = accounts.filter((acc: any) => acc.type === "Liability");
    const equity = accounts.filter((acc: any) => acc.type === "Equity");

    // Sum balances for each category
    const totalAssets = assets.reduce(
      (sum, acc: any) => sum + parseFloat(acc.balance),
      0
    );
    const totalLiabilities = liabilities.reduce(
      (sum, acc: any) => sum + parseFloat(acc.balance),
      0
    );
    const totalEquity = equity.reduce(
      (sum, acc: any) => sum + parseFloat(acc.balance),
      0
    );

    return NextResponse.json({
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Balance Sheet data: " + error },
      { status: 500 }
    );
  }
}
