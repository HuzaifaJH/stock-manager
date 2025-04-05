import { NextResponse } from "next/server";
import Account from "@/lib/models/Account";

// Get account by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const account = await Account.findByPk(params.id);
    if (!account)
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    return NextResponse.json(account);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 }
    );
  }
}

// Update account by ID
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const account = await Account.findByPk(params.id);
    if (!account)
      return NextResponse.json({ error: "Account not found" }, { status: 404 });

    await account.update(body);
    return NextResponse.json(account);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

// Delete account by ID
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const account = await Account.findByPk(params.id);
    if (!account)
      return NextResponse.json({ error: "Account not found" }, { status: 404 });

    await account.destroy();
    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
