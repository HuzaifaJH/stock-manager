import { Op, Sequelize } from "sequelize";
import {
  Sales,
  SubCategory,
  Product,
  SalesItem,
  SalesReturn,
  SalesReturnItem,
} from "@/lib/models";
import { NextResponse } from "next/server";
import dayjs from "dayjs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupBy = searchParams.get("groupBy");

    const now = dayjs();
    let startDate: dayjs.Dayjs;
    const date = new Date();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    let dateFormat: string;

    switch (groupBy) {
      case "day":
        startDate = now.startOf("day");
        dateFormat = "%Y-%m-%d %H:00"; // group by hour
        break;
      case "week":
        startDate = now.startOf("week");
        dateFormat = "%Y-%m-%d"; // group by day
        break;
      case "month":
        startDate = now.startOf("month");
        dateFormat = "%Y-%m-%d"; // group by day
        break;
      case "year":
        startDate = now.startOf("year");
        dateFormat = "%Y-%m"; // group by month
        break;
      default:
        return NextResponse.json({ error: "Invalid groupBy value" });
    }

    // Top selling items in the current Month
    const topSellingProducts = await SalesItem.findAll({
      where: { createdAt: { [Op.gte]: firstDayOfMonth } },
      attributes: [
        "productId",
        [Sequelize.fn("SUM", Sequelize.col("quantity")), "totalSold"],
      ],
      group: ["productId"],
      order: [[Sequelize.fn("SUM", Sequelize.col("quantity")), "DESC"]],
      limit: 10,
      include: [{ model: Product, attributes: ["name"] }],
    });

    // Low on Stock Products
    const lowStockProducts = await Product.findAll({
      where: { stock: { [Op.lt]: 5 } },
      attributes: ["id", "name", "stock"],
      include: [{ model: SubCategory, attributes: ["id", "name"] }],
    });

    // Total Sales in the current Month
    const salesData = (await Sales.findAll({
      include: [
        {
          model: SalesItem,
          attributes: ["sellingPrice", "quantity", "costPrice"],
        },
      ],
      where: { date: { [Op.gte]: firstDayOfMonth } },
      attributes: ["discount", "date"],
    })) as unknown as {
      discount: number;
      date: string;
      SalesItems: {
        quantity: number;
        sellingPrice: number;
        costPrice: number;
      }[];
    }[];

    let totalSales = 0;
    let totalProfit = 0;

    for (const sale of salesData) {
      const itemTotal = sale.SalesItems.reduce(
        (sum, item) => sum + item.sellingPrice * item.quantity,
        0
      );
      const itemProfit = sale.SalesItems.reduce(
        (sum, item) =>
          sum + (item.sellingPrice - item.costPrice) * item.quantity,
        0
      );

      const discount = sale.discount || 0;
      totalSales += itemTotal - discount;
      totalProfit += itemProfit - discount;
    }

    const salesReturns = (await SalesReturn.findAll({
      include: [
        {
          model: SalesReturnItem,
          attributes: ["returnPrice", "quantity"],
        },
      ],
      where: { date: { [Op.gte]: firstDayOfMonth } },
    })) as unknown as {
      SalesReturnItems: {
        quantity: number;
        returnPrice: number;
      }[];
    }[];

    for (const returnEntry of salesReturns) {
      const returnTotal = returnEntry.SalesReturnItems.reduce(
        (sum, item) => sum + item.returnPrice * item.quantity,
        0
      );

      totalSales -= returnTotal;
    }

    totalSales = parseFloat(totalSales.toFixed(2));
    totalProfit = parseFloat(totalProfit.toFixed(2));

    // Chart Data
    // Fetch and group sales
    const chartSalesData = (await Sales.findAll({
      include: [
        {
          model: SalesItem,
          attributes: ["sellingPrice", "quantity", "costPrice"],
        },
      ],
      where: { date: { [Op.gte]: startDate } },
      attributes: ["discount", "date"],
    })) as unknown as {
      discount: number;
      date: string;
      SalesItems: {
        quantity: number;
        sellingPrice: number;
        costPrice: number;
      }[];
    }[];

    const grouped: Record<string, { sales: number; profit: number }> = {};

    for (const sale of chartSalesData) {
      const period = dayjs(sale.date).format(
        dateFormat
          .replace("%Y", "YYYY")
          .replace("%m", "MM")
          .replace("%d", "DD")
          .replace("%H", "HH")
      );

      if (!grouped[period]) grouped[period] = { sales: 0, profit: 0 };

      const discount = sale.discount || 0;
      let totalSelling = 0;
      let totalCost = 0;

      for (const item of sale.SalesItems) {
        totalSelling += item.sellingPrice * item.quantity;
        totalCost += item.costPrice * item.quantity;
      }

      grouped[period].sales += totalSelling - discount;
      grouped[period].profit += totalSelling - totalCost - discount;
    }

    // Fetch and group sales returns
    const chartSalesReturnData = (await SalesReturn.findAll({
      include: [
        {
          model: SalesReturnItem,
          attributes: ["returnPrice", "quantity"],
        },
      ],
      where: { date: { [Op.gte]: startDate } },
      attributes: ["date"],
    })) as unknown as {
      date: string;
      SalesReturnItems: {
        quantity: number;
        returnPrice: number;
      }[];
    }[];

    // Subtract returns from grouped sales
    for (const returnEntry of chartSalesReturnData) {
      const period = dayjs(returnEntry.date).format(
        dateFormat
          .replace("%Y", "YYYY")
          .replace("%m", "MM")
          .replace("%d", "DD")
          .replace("%H", "HH")
      );

      if (!grouped[period]) grouped[period] = { sales: 0, profit: 0 };

      const returnTotal = returnEntry.SalesReturnItems.reduce(
        (sum, item) => sum + item.returnPrice * item.quantity,
        0
      );

      grouped[period].sales -= returnTotal;
    }

    const labels = Object.keys(grouped).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    const formattedLabels = labels.map((label) => {
      switch (groupBy) {
        case "day":
          return dayjs(label).format("MMM D, hA"); // e.g. "May 1, 3PM"
        case "week":
        case "month":
          return dayjs(label).format("MMM D"); // e.g. "May 1"
        case "year":
          return dayjs(label).format("MMM"); // e.g. "May"
        default:
          return label;
      }
    });
    const sales = labels.map((label) =>
      parseFloat(grouped[label].sales.toFixed(2))
    );
    const profit = labels.map((label) =>
      parseFloat(grouped[label].profit.toFixed(2))
    );

    return NextResponse.json({
      totalOrders: salesData.length,
      totalSales,
      totalProfit,
      topSellingProducts,
      lowStockProducts,
      chartData: { labels: formattedLabels, sales, profit },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats : " + error },
      { status: 500 }
    );
  }
}
