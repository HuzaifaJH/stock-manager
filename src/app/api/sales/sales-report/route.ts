import { Op } from "sequelize";
import SalesItemModel from "@/lib/models/SalesItem";
import Product from "@/lib/models/Product";
import Sales from "@/lib/models/Sales";
import Category from "@/lib/models/Category";
import SubCategory from "@/lib/models/SubCategory";
import {
  FinalSalesReportCategory,
  SalesItem,
  SalesReportCategory,
  SalesReportProduct,
  SalesReportResponse,
  SalesReportSubCategory,
} from "@/app/utils/interfaces";

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

    const salesItems = (await SalesItemModel.findAll({
      include: [
        {
          model: Sales,
          where: { createdAt: { [Op.gte]: startDate } },
          attributes: [],
        },
        {
          model: Product,
          include: [
            {
              model: SubCategory,
              include: [Category],
            },
          ],
        },
      ],
    })) as unknown as SalesItem[];

    let totalRevenue = 0;
    let totalProfit = 0;

    const reportMap: Map<number, SalesReportCategory> = new Map();

    for (const item of salesItems) {
      const quantity = item.quantity!;
      const revenue = item.sellingPrice! * quantity;
      const profit = (item.sellingPrice! - item.costPrice!) * quantity;
      totalRevenue += revenue;
      totalProfit += profit;

      const product = item.Product!;
      const subCategory = product.SubCategory!;
      const category = subCategory.Category!;

      if (!reportMap.has(category.id)) {
        reportMap.set(category.id, {
          id: category.id,
          name: category.name,
          revenue: 0,
          profit: 0,
          subcategories: new Map<number, SalesReportSubCategory>(),
        });
      }

      const catEntry = reportMap.get(category.id)!;
      catEntry.revenue += revenue;
      catEntry.profit += profit;

      if (!catEntry.subcategories.has(subCategory.id)) {
        catEntry.subcategories.set(subCategory.id, {
          id: subCategory.id,
          name: subCategory.name,
          revenue: 0,
          profit: 0,
          products: new Map<number, SalesReportProduct>(),
        });
      }

      const subEntry = catEntry.subcategories.get(subCategory.id)!;
      subEntry.revenue += revenue;
      subEntry.profit += profit;

      if (!subEntry.products.has(product.id)) {
        subEntry.products.set(product.id, {
          id: product.id,
          name: product.name,
          quantity: 0,
          revenue: 0,
          profit: 0,
        });
      }

      const prodEntry = subEntry.products.get(product.id)!;
      prodEntry.quantity += quantity;
      prodEntry.revenue += revenue;
      prodEntry.profit += profit;
    }

    const byCategory: FinalSalesReportCategory[] = Array.from(
      reportMap.values()
    ).map((cat) => ({
      id: cat.id,
      name: cat.name,
      revenue: cat.revenue,
      profit: cat.profit,
      subcategories: Array.from(cat.subcategories.values()).map((sub) => ({
        id: sub.id,
        name: sub.name,
        revenue: sub.revenue,
        profit: sub.profit,
        products: Array.from(sub.products.values()),
      })),
    }));

    const result: SalesReportResponse = {
      totalRevenue,
      totalProfit,
      byCategory,
    };

    return Response.json(result);
  } catch (error) {
    console.error("Sales report error:", error);
    return Response.json(
      { error: "Failed to generate sales report." },
      { status: 500 }
    );
  }
}
