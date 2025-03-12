import { NextRequest, NextResponse } from "next/server";
import Sale from "@/lib/models/Sale";
import Product from "@/lib/models/Product";

// GET all sales
export async function GET() {
  try {
    const sales = await Sale.findAll({ include: Product });
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching sales: " + error },
      { status: 500 }
    );
  }
}

// POST create a new sale
export async function POST(req: NextRequest) {
  try {
    const { productId, quantity, price, date } = await req.json();

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if stock is sufficient
    if (product.dataValues.stock < quantity) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 400 }
      );
    }

    // Create sale and update stock in a transaction
    await Sale.create({ productId, quantity, price, date });

    // Update product stock
    await product.update({ stock: product.dataValues.stock - quantity });

    return NextResponse.json(
      { message: "Sale recorded successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error recording sale: " + error },
      { status: 500 }
    );
  }
}
