import { NextResponse } from "next/server";
import Category from "@/lib/models/Category";

// PUT - Update Category
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;

  if (!id || id.length === 0) {
    return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
  }

  try {
    const { name } = await req.json();
    const category = await Category.findByPk(Number(id));

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    await category.update({ name });
    await category.save();

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating category: " + error },
      { status: 500 }
    );
  }
}

// DELETE - Delete Category
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {

  const { id } = await context.params;
  if (!id || id.length === 0) {
    return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
  }

  try {
    const category = await Category.findByPk(Number(id));

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    await category.destroy();
    return NextResponse.json({ message: "Category deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting category:" + error },
      { status: 500 }
    );
  }
}
