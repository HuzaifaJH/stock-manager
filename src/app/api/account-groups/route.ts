import { NextResponse } from "next/server";
import AccountGroup from "@/lib/models/AccountGroup";
import { accountTypes } from "@/app/utils/accountType";

type AccountGroupJSON = {
  id: number;
  name: string;
  accountType: number;
};

// Get all accounts
export async function GET() {
  try {
    const accountgroups = await AccountGroup.findAll();

    const accountGroupsWithTypeName = accountgroups.map((group) => {
      const groupJson = group.toJSON() as AccountGroupJSON;
      const accountType = accountTypes.find(
        (type) => type.code === groupJson.accountType
      );
      return {
        ...groupJson,
        accountTypeName: accountType?.account ?? null,
      };
    });

    return NextResponse.json(accountGroupsWithTypeName);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch accounts: " + error },
      { status: 500 }
    );
  }
}

// Create a new account
export async function POST(req: Request) {
  try {
    const { name, accountType } = await req.json();
    const existingGroups = await AccountGroup.findAll({
      where: { accountType },
    });

    const nextGroupNumber = existingGroups.length + 1;
    const code = `${accountType}-${nextGroupNumber
      .toString()
      .padStart(2, "0")}`;
    const accountgroup = await AccountGroup.create({ name, accountType, code });
    return NextResponse.json(accountgroup, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create account: " + error },
      { status: 500 }
    );
  }
}
