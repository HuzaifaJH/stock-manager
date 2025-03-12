import { NextResponse } from "next/server";
import Sale from "@/lib/models/Sale";
import Product from "@/lib/models/Product";

// GET a single sale by ID
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params; // Await params

  if (!id || id.length === 0) {
    return NextResponse.json({ error: "Invalid sale ID" }, { status: 400 });
  }
  try {
    const sale = await Sale.findByPk(Number(id), { include: Product });
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }
    return NextResponse.json(sale);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching sale: " + error },
      { status: 500 }
    );
  }
}

// PUT update a sale
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  if (!id || id.length === 0) {
    return NextResponse.json({ error: "Invalid sale ID" }, { status: 400 });
  }
  try {
    const { quantity, price, date } = await req.json();

    const sale = await Sale.findByPk(Number(id));
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const oldQuantity = sale.dataValues.quantity;

    // Update sale details
    await sale.update({ quantity, price, date });

    const quantityDifference = quantity - oldQuantity;
    await Product.increment("stock", {
      by: quantityDifference,
      where: { id: sale.dataValues.productId },
    });

    return NextResponse.json({ message: "Sale updated successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating sale: " + error },
      { status: 500 }
    );
  }
}

// DELETE a sale and restore stock
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  if (!id || id.length === 0) {
    return NextResponse.json({ error: "Invalid sale ID" }, { status: 400 });
  }
  try {
    const sale = await Sale.findByPk(Number(id));
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Restore the sold quantity to stock before deleting the sale
    await Product.increment("stock", {
      by: sale.dataValues.quantity,
      where: { id: sale.dataValues.productId },
    });

    await sale.destroy();

    return NextResponse.json(
      { message: "Sale deleted and stock restored" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting sale: error: " + error },
      { status: 500 }
    );
  }
}
