import { NextResponse } from "next/server";
import JournalEntry from "@/lib/models/JournalEntry";

// Get all journal entries
export async function GET() {
  try {
    const entries = await JournalEntry.findAll();
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch journal entries" },
      { status: 500 }
    );
  }
}

// Create a new journal entry
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entry = await JournalEntry.create(body);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create journal entry" },
      { status: 500 }
    );
  }
}
