import { NextRequest, NextResponse } from "next/server";
import Category from "@/lib/models/Category";

// GET All Categories
export async function GET() {
  try {
    const categories = await Category.findAll({
      // order: [["createdAt", "DESC"]],
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch categories: " + error },
      { status: 500 }
    );
  }
}

// POST - Create Category
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const category = await Category.create({ name });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating category: " + error },
      { status: 500 }
    );
  }
}
