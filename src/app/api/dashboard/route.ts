import { Op, Sequelize } from "sequelize";
import {
  Sales,
  Product,
  JournalEntry,
  Account,
  PurchaseItem,
  SalesItem,
  Purchase,
} from "@/lib/models";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD' format
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .split("T")[0];
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
      .toISOString()
      .split("T")[0];

    // Fetch sales items with joined sales data
    // const salesToday = await SalesItem.findAll({
    //   attributes: ["price"],
    //   include: [
    //     {
    //       model: Sales,
    //       attributes: [],
    //       where: { date: today }, // Ensure today is formatted as 'YYYY-MM-DD'
    //     },
    //   ],
    //   raw: true,
    // });

    // const salesThisMonth = await SalesItem.findAll({
    //   attributes: ["price"],
    //   include: [
    //     {
    //       model: Sales,
    //       attributes: [],
    //       where: { date: { [Op.gte]: startOfMonth } },
    //     },
    //   ],
    //   raw: true,
    // });

    // const salesYTD = await SalesItem.findAll({
    //   attributes: ["price"],
    //   include: [
    //     {
    //       model: Sales,
    //       attributes: [],
    //       where: { date: { [Op.gte]: startOfYear } },
    //     },
    //   ],
    //   raw: true,
    // });

    // // Sum up the total prices manually
    // const totalSalesToday = salesToday.reduce(
    //   (sum, item: any) => sum + item.price,
    //   0
    // );
    // const totalSalesThisMonth = salesThisMonth.reduce(
    //   (sum, item: any) => sum + item.price,
    //   0
    // );
    // const totalSalesYTD = salesYTD.reduce(
    //   (sum, item: any) => sum + item.price,
    //   0
    // );

    // console.log({ totalSalesToday, totalSalesThisMonth, totalSalesYTD });

    // Sales Stats
    const totalSalesToday = await SalesItem.sum("price", {
      where: {
        salesId: {
          [Op.in]: Sequelize.literal(
            `(SELECT id FROM Sales WHERE date = '${today}')`
          ),
        },
      },
    });
    const totalSalesThisMonth = await SalesItem.sum("price", {
      where: {
        salesId: {
          [Op.in]: Sequelize.literal(
            `(SELECT id FROM Sales WHERE date >= '${startOfMonth}')`
          ),
        },
      },
    });
    const totalSalesYTD = await SalesItem.sum("price", {
      where: {
        salesId: {
          [Op.in]: Sequelize.literal(
            `(SELECT id FROM Sales WHERE date >= '${startOfYear}')`
          ),
        },
      },
    });

    // Fetch purchase items with joined purchase data
    // const purchasesToday = await PurchaseItem.findAll({
    //   attributes: ["purchasePrice"],
    //   include: [
    //     {
    //       model: Purchase,
    //       attributes: [],
    //       where: { date: today }, // Ensure today is formatted as 'YYYY-MM-DD'
    //     },
    //   ],
    //   raw: true,
    // });

    // const purchasesThisMonth = await PurchaseItem.findAll({
    //   attributes: ["purchasePrice"],
    //   include: [
    //     {
    //       model: Purchase,
    //       attributes: [],
    //       where: { date: { [Op.gte]: startOfMonth } },
    //     },
    //   ],
    //   raw: true,
    // });

    // const purchasesYTD = await PurchaseItem.findAll({
    //   attributes: ["purchasePrice"],
    //   include: [
    //     {
    //       model: Purchase,
    //       attributes: [],
    //       where: { date: { [Op.gte]: startOfYear } },
    //     },
    //   ],
    //   raw: true,
    // });

    // // Sum up the total purchase prices manually
    // const totalPurchasesToday = purchasesToday.reduce(
    //   (sum, item: any) => sum + item.purchasePrice,
    //   0
    // );
    // const totalPurchasesThisMonth = purchasesThisMonth.reduce(
    //   (sum, item: any) => sum + item.purchasePrice,
    //   0
    // );
    // const totalPurchasesYTD = purchasesYTD.reduce(
    //   (sum, item: any) => sum + item.purchasePrice,
    //   0
    // );

    // console.log({
    //   totalPurchasesToday,
    //   totalPurchasesThisMonth,
    //   totalPurchasesYTD,
    // });

    const totalPurchasesToday = await PurchaseItem.sum("purchasePrice", {
      where: {
        purchaseId: {
          [Op.in]: Sequelize.literal(
            `(SELECT id FROM Purchases WHERE date = '${today}')`
          ),
        },
      },
    });
    const totalPurchasesThisMonth = await PurchaseItem.sum("purchasePrice", {
      where: {
        purchaseId: {
          [Op.in]: Sequelize.literal(
            `(SELECT id FROM Purchases WHERE date >= '${startOfMonth}')`
          ),
        },
      },
    });
    const totalPurchasesYTD = await PurchaseItem.sum("purchasePrice", {
      where: {
        purchaseId: {
          [Op.in]: Sequelize.literal(
            `(SELECT id FROM Purchases WHERE date >= '${startOfYear}')`
          ),
        },
      },
    });

    // Stock Balance
    const stockBalance = (await Product.findAll({
      attributes: [
        [
          Sequelize.literal(`
          SUM(Product.stock * (
            SELECT purchasePrice 
            FROM PurchaseItems 
            WHERE PurchaseItems.productId = Product.id 
            ORDER BY PurchaseItems.createdAt DESC 
            LIMIT 1
          ))`),
          "totalStockValue",
        ],
      ],
      raw: true,
    })) as unknown as {
      totalStockValue: string;
    }[];

    // Revenue vs Expenses
    const totalRevenue = await JournalEntry.sum("amount", {
      where: { type: "Credit" },
    });
    const totalExpenses = await JournalEntry.sum("amount", {
      where: { type: "Debit" },
    });

    // Profit & Loss Summary
    const profitLoss = totalRevenue - totalExpenses;

    // Top Selling Products
    const topProducts = await SalesItem.findAll({
      attributes: [
        "productId",
        [Sequelize.literal("SUM(quantity)"), "totalSold"],
      ],
      group: ["productId"],
      order: [[Sequelize.literal("totalSold"), "DESC"]],
      limit: 5,
      raw: true,
    });

    // Low Stock Alerts
    const lowStockProducts = await Product.findAll({
      where: { stock: { [Op.lt]: 5 } },
      attributes: ["id", "name", "stock"],
      raw: true,
    });

    // Outstanding Payables & Receivables
    const outstandingPayables = await Account.sum("balance", {
      where: { type: "Liability" },
    });
    const outstandingReceivables = await Account.sum("balance", {
      where: { type: "Asset" },
    });

    return NextResponse.json({
      sales: { totalSalesToday, totalSalesThisMonth, totalSalesYTD },
      purchases: {
        totalPurchasesToday,
        totalPurchasesThisMonth,
        totalPurchasesYTD,
      },
      stockBalance: stockBalance[0]?.totalStockValue || 0,
      revenueVsExpenses: { totalRevenue, totalExpenses },
      profitLoss,
      topProducts,
      lowStockProducts,
      outstanding: {
        payables: outstandingPayables,
        receivables: outstandingReceivables,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats : " + error },
      { status: 500 }
    );
  }
}
