import { NextResponse } from "next/server";
import Product from "@/lib/models/Product";
import Purchase from "@/lib/models/Purchase";
import Supplier from "@/lib/models/Supplier";

// GET: Fetch all purchases with associated supplier & product names
export async function GET() {
  try {
    const purchases = await Purchase.findAll({
      include: [
        { model: Supplier, attributes: ["name"] },
        { model: Product, attributes: ["name"] },
      ],
      // order: [["createdAt", "DESC"]],
    });
    return NextResponse.json(purchases);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch purchases: " + error },
      { status: 500 }
    );
  }
}

// POST: Create a new purchase
export async function POST(req: Request) {
  try {
    const { supplierId, productId, quantity, purchasePrice, date } =
      await req.json();

    // Validate input
    if (!supplierId || !productId || !quantity || !purchasePrice || !date) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Create purchase entry
    const newPurchase = await Purchase.create({
      supplierId,
      productId,
      quantity,
      purchasePrice,
      date,
    });

    // Update product stock
    await Product.increment("stock", {
      by: quantity,
      where: { id: productId },
    });

    return NextResponse.json(newPurchase, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create purchase: " + error },
      { status: 500 }
    );
  }
}
