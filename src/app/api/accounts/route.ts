import { NextResponse } from "next/server";
import Account from "@/lib/models/Account";

// Get all accounts
export async function GET() {
  try {
    const accounts = await Account.findAll();
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

// Create a new account
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const account = await Account.create(body);
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
