import { NextResponse } from "next/server";
import Product from "@/lib/models/Product";
import Purchase from "@/lib/models/Purchase";

// GET: Fetch a single purchase by ID
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params; // Await params

  if (!id || id.length === 0) {
    return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
  }

  try {
    const purchase = await Product.findByPk(Number(id));
    if (!purchase)
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );

    return NextResponse.json(purchase);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch purchase: " + error },
      { status: 500 }
    );
  }
}

// PUT: Update a purchase
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  if (!id || id.length === 0) {
    return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
  }
  try {
    const { supplierId, productId, quantity, purchasePrice, date } =
      await req.json();

    const purchase = await Purchase.findByPk(Number(id));
    if (!purchase)
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );

    const oldQuantity = purchase.dataValues.quantity;

    await purchase.update({
      supplierId,
      productId,
      quantity,
      purchasePrice,
      date,
    });

    const quantityDifference = quantity - oldQuantity;
    await Product.increment("stock", {
      by: quantityDifference,
      where: { id: productId },
    });

    return NextResponse.json(purchase, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update purchase: " + error },
      { status: 500 }
    );
  }
}

// DELETE: Remove a purchase
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  if (!id || id.length === 0) {
    return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
  }
  try {
    const purchase = await Purchase.findByPk(Number(id));
    if (!purchase)
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );

    // Subtract the purchased quantity from stock before deleting the purchase
    await Product.increment("stock", {
      by: -purchase.dataValues.quantity,
      where: { id: purchase.dataValues.productId },
    });

    await purchase.destroy();
    return NextResponse.json(
      { message: "Purchase deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete purchase: " + error },
      { status: 500 }
    );
  }
}
