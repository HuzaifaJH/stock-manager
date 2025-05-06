import { NextResponse } from "next/server";
import LedgerAccountModel from "@/lib/models/LedgerAccount";
import AccountGroup from "@/lib/models/AccountGroup";
import { accountTypes } from "@/app/utils/accountType";
import { LedgerAccount } from "@/app/utils/interfaces";

// GET all ledger accounts
export async function GET() {
  try {
    const ledgerAccounts = await LedgerAccountModel.findAll({
      include: {
        model: AccountGroup,
        attributes: ["accountType", "name"],
      },
    });

    const ledgerAccountsWithTypeName = ledgerAccounts.map((group) => {
      const json = group.toJSON() as LedgerAccount;

      const accountType = accountTypes.find(
        (type) => type.code === json.AccountGroup?.accountType
      );

      return {
        ...json,
        AccountGroup: {
          ...json.AccountGroup,
          accountTypeName: accountType ? accountType.account : null,
        },
      };
    });

    return NextResponse.json(ledgerAccountsWithTypeName);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch ledger accounts: " + error },
      { status: 500 }
    );
  }
}

// POST create new ledger account
export async function POST(req: Request) {
  try {
    const { name, accountGroup } = await req.json();

    // Fetch group to use its code prefix
    const group = await AccountGroup.findByPk(accountGroup);
    if (!group) {
      return NextResponse.json(
        { error: "Account group not found" },
        { status: 400 }
      );
    }

    // Generate next code for ledger in the group
    const existingLedgers = await LedgerAccountModel.findAll({
      where: { accountGroup },
    });

    const nextLedgerNumber = existingLedgers.length + 1;
    const code = `${group.getDataValue("code")}-${nextLedgerNumber
      .toString()
      .padStart(3, "0")}`;

    const newLedger = await LedgerAccountModel.create({
      name,
      accountGroup,
      code,
    });

    return NextResponse.json(newLedger, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create ledger account: " + error },
      { status: 500 }
    );
  }
}
