import { NextResponse } from "next/server";
import Payment from "@/lib/models/Payment";
import JournalEntry from "@/lib/models/JournalEntry";

// Get all payments
export async function GET() {
  try {
    const payments = await Payment.findAll();
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// Create a new payment
export async function POST(req: Request) {
  try {
    const { date, amount, method, referenceId, accountId } = await req.json();

    const payment = await Payment.create({ date, amount, method, referenceId, accountId });

    // Record journal entry for the payment
    await JournalEntry.create({
      date,
      description: `Payment of ${amount} via ${method}`,
      amount,
      type: "Credit", // Since it's an outgoing payment
      accountId,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}