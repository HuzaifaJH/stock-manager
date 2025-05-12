import Sales from "@/lib/models/Sales";
import SalesItem from "@/lib/models/SalesItem";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json(
      { error: "Product ID is required" },
      { status: 400 }
    );
  }

  try {
    const lastSaleItem = await SalesItem.findOne({
      where: { productId },
      include: [{ model: Sales, attributes: ["date"] }],
      order: [[{ model: Sales, as: "Sale" }, "date", "DESC"]],
    });

    if (!lastSaleItem) {
      return NextResponse.json({
        sellingPrice: 0,
        date: null,
      });
    }

    const item = lastSaleItem.toJSON() as {
      sellingPrice: number;
      Sale?: { date: string };
    };

    return NextResponse.json({
      sellingPrice: item.sellingPrice,
      date: item.Sale?.date,
    });
  } catch (error) {
    console.error("Error fetching last sale item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
