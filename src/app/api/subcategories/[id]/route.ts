import { NextRequest, NextResponse } from "next/server";
import SubCategory from "@/lib/models/SubCategory";

// PUT - Update Subcategory
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const { name, categoryId } = body;

    const subcategory = await SubCategory.findByPk(id);
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
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const subcategory = await SubCategory.findByPk(id);

    if (!subcategory) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }

    await subcategory.destroy();
    return NextResponse.json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    console.error("DELETE Subcategory Error:", error);
    return NextResponse.json(
      { error: "Failed to delete subcategory" },
      { status: 500 }
    );
  }
}
