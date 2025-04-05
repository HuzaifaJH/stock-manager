import { NextRequest, NextResponse } from "next/server";
import Category from "@/lib/models/Category";
import SubCategory from "@/lib/models/SubCategory";

// GET all subcategories
export async function GET() {
  try {
    const subcategories = await SubCategory.findAll({
      include: [{ model: Category, attributes: ["id", "name"] }],
      order: [["name", "ASC"]],
    });
    return NextResponse.json(subcategories);
  } catch (error) {
    console.error("GET Subcategories Error:", error);
    return NextResponse.json({ error: "Failed to fetch subcategories" }, { status: 500 });
  }
}

// POST a new subcategory
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, categoryId } = body;

    if (!name || !categoryId) {
      return NextResponse.json({ error: "Name and Category ID are required" }, { status: 400 });
    }

    const newSubcategory = await SubCategory.create({ name, categoryId });
    return NextResponse.json(newSubcategory, { status: 201 });
  } catch (error) {
    console.error("POST Subcategory Error:", error);
    return NextResponse.json({ error: "Failed to create subcategory" }, { status: 500 });
  }
}