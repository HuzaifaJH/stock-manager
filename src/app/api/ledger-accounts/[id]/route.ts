import { NextResponse } from "next/server";
import LedgerAccount from "@/lib/models/LedgerAccount";

// Get ledgerAccount by ID
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;

  try {
    const ledgerAccount = await LedgerAccount.findByPk(Number(id));
    if (!ledgerAccount)
      return NextResponse.json(
        { error: "Ledger Account not found" },
        { status: 404 }
      );
    return NextResponse.json(ledgerAccount);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Ledger Account: " + error },
      { status: 500 }
    );
  }
}

// Update ledgerAccount by ID
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  try {
    const { name } = await req.json();
    const ledgerAccount = await LedgerAccount.findByPk(Number(id));
    if (!ledgerAccount)
      return NextResponse.json(
        { error: "Ledger Account not found" },
        { status: 404 }
      );

    await ledgerAccount.update({ name });
    return NextResponse.json(ledgerAccount);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update Ledger Account: " + error },
      { status: 500 }
    );
  }
}

// Delete ledgerAccount by ID
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  try {
    const ledgerAccount = await LedgerAccount.findByPk(Number(id));
    if (!ledgerAccount)
      return NextResponse.json(
        { error: "Ledger Account not found" },
        { status: 404 }
      );

    await ledgerAccount.destroy();
    return NextResponse.json({
      message: "Ledger Account deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete Ledger Account: " + error },
      { status: 500 }
    );
  }
}
