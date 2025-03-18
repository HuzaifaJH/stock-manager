import { NextResponse } from "next/server";
import Category from "@/lib/models/Category";
import Product from "@/lib/models/Product";

// GET all products
export async function GET() {
  try {
    const products = await Product.findAll({
      include: { model: Category, attributes: ["name"] },
    //   order: [["createdAt", "DESC"]],
    });
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
    const { name, stock, categoryId } = await req.json();
    const newProduct = await Product.create({ name, stock, categoryId });
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create product: " + error },
      { status: 500 }
    );
  }
}
