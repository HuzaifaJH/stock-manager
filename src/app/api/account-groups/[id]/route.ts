import { NextResponse } from "next/server";
import AccountGroup from "@/lib/models/AccountGroup";
import LedgerAccount from "@/lib/models/LedgerAccount";

// Get accountGroup by ID
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;

  try {
    const accountGroup = await AccountGroup.findByPk(Number(id), {
      include: { model: LedgerAccount, attributes: ["id","name"] },
    });
    if (!accountGroup)
      return NextResponse.json(
        { error: "Account Group not found" },
        { status: 404 }
      );
    return NextResponse.json(accountGroup);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch account group: " + error },
      { status: 500 }
    );
  }
}

// Update accountGroup by ID
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  try {
    const { name } = await req.json();
    const accountGroup = await AccountGroup.findByPk(Number(id));
    if (!accountGroup)
      return NextResponse.json(
        { error: "Account Group not found" },
        { status: 404 }
      );

    await accountGroup.update({ name });
    return NextResponse.json(accountGroup);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update account group: " + error },
      { status: 500 }
    );
  }
}

// Delete accountGroup by ID
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  try {
    const accountGroup = await AccountGroup.findByPk(Number(id));
    if (!accountGroup)
      return NextResponse.json(
        { error: "Account Group not found" },
        { status: 404 }
      );

    await accountGroup.destroy();
    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete account group: " + error },
      { status: 500 }
    );
  }
}
