import { NextResponse } from "next/server";
import Supplier from "@/lib/models/Supplier";

export async function GET() {
  try {
    const suppliers = await Supplier.findAll();
    return NextResponse.json(suppliers);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch suppliers: " + error },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, phoneNumber } = await req.json();
    if (!name || !phoneNumber) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const newSupplier = await Supplier.create({ name, phoneNumber });
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create supplier: " + error },
      { status: 500 }
    );
  }
}
