import { NextResponse } from "next/server";
import SubCategory from "@/lib/models/SubCategory";

// PUT - Update Subcategory
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  try {
    const body = await req.json();
    const { name, categoryId } = body;

    const subcategory = await SubCategory.findByPk(Number(id));
    if (!subcategory) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }

    await subcategory.update({ name, categoryId });
    return NextResponse.json(subcategory);
  } catch (error) {
    console.error("PUT Subcategory Error:", error);
    return NextResponse.json(
      { error: "Failed to update subcategory" },
      { status: 500 }
    );
  }
}

// DELETE - Remove Subcategory
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  try {
    const subcategory = await SubCategory.findByPk(Number(id));

    if (!subcategory) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }

    await subcategory.destroy();
    return NextResponse.json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete subcategory: " + error },
      { status: 500 }
    );
  }
}
