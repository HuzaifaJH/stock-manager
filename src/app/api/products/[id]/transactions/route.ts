import { NextResponse } from "next/server";
import { PurchaseItem, Purchase, SalesItem, Sales } from "@/lib/models";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;

  try {
    const purchaseItems = await PurchaseItem.findAll({
      where: { productId: id },
      include: [{ model: Purchase, attributes: ["date"] }],
    });

    const salesItems = await SalesItem.findAll({
      where: { productId: id },
      include: [{ model: Sales, attributes: ["date"] }],
    });

    const transactions = [
      ...purchaseItems.map((item) => ({
        type: "Purchase",
        quantity: item.getDataValue("quantity"),
        date: item.getDataValue("Purchase").date,
        price: item.getDataValue("purchasePrice"),
      })),
      ...salesItems.map((item) => ({
        type: "Sale",
        quantity: item.getDataValue("quantity"),
        date: item.getDataValue("Sale").date,
        price: item.getDataValue("sellingPrice"),
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
