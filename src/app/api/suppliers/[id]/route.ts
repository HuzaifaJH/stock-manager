import { NextResponse } from "next/server";
import Supplier from "@/lib/models/Supplier";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params; // Await params

  if (!id || id.length === 0) {
    return NextResponse.json({ error: "Invalid supplier ID" }, { status: 400 });
  }
  try {
    const supplier = await Supplier.findByPk(Number(id));
    if (!supplier)
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );

    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch supplier: " + error },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  if (!id || id.length === 0) {
    return NextResponse.json({ error: "Invalid supplier ID" }, { status: 400 });
  }
  try {
    const supplier = await Supplier.findByPk(Number(id));
    if (!supplier)
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );

    const { name, phoneNumber } = await req.json();
    if (!name || !phoneNumber) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    await supplier.update({ name, phoneNumber });
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update supplier: " + error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  if (!id || id.length === 0) {
    return NextResponse.json({ error: "Invalid supplier ID" }, { status: 400 });
  }
  try {
    const supplier = await Supplier.findByPk(Number(id));
    if (!supplier)
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );

    await supplier.destroy();
    return NextResponse.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete supplier: " + error },
      { status: 500 }
    );
  }
}
