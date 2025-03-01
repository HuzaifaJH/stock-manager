import { NextResponse } from "next/server";
import Product from "@/lib/models/Product";

// GET all products
export async function GET() {
  try {
    const products = await Product.findAll();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products: " + error },
      { status: 500 }
    );
  }
}

// POST create a new product
export async function POST(req: Request) {
  try {
    const { name, price, stock } = await req.json();
    const newProduct = await Product.create({ name, price, stock });
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create product: " + error },
      { status: 500 }
    );
  }
}
