import { NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import Product from "@/lib/models/Product";
import Purchase from "@/lib/models/Purchase";
import Supplier from "@/lib/models/Supplier";
import PurchaseItem from "@/lib/models/PurchaseItem";
import updateAccountBalances from "../update-account-balances";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";
interface PurchaseItem {
  productId: number;
  quantity: number;
  purchasePrice: number;
}

export async function GET() {
  try {
    const purchases = await Purchase.findAll({
      include: [
        {
          model: Supplier,
          attributes: ["name"],
        },
        {
          model: PurchaseItem,
          include: [
            {
              model: Product,
              attributes: ["name"],
            },
          ],
        },
      ],
      // order: [["createdAt", "DESC"]], // Optional ordering
    });

    const formattedPurchases = purchases.map((purchase) => {
      const purchaseJSON = purchase.toJSON();

      let totalPrice = 0;

      const updatedPurchaseItems = purchaseJSON.PurchaseItems.map(
        (item: { purchasePrice: number; quantity: number }) => {
          const totalPurchasePrice = item.purchasePrice * item.quantity;
          totalPrice += totalPurchasePrice;

          return {
            ...item,
            totalPurchasePrice,
          };
        }
      );

      return {
        ...purchaseJSON,
        PurchaseItems: updatedPurchaseItems,
        totalPrice,
      };
    });

    return NextResponse.json(formattedPurchases);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch purchases: " + error },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const transaction = await sequelize.transaction();

  try {
    const { supplierId, date, items, paymentMethod } = await req.json();

    // Calculate total purchase amount
    const totalAmount = items.reduce(
      (sum: number, item: { purchasePrice: number; quantity: number }) =>
        sum + item.purchasePrice * item.quantity,
      0
    );

    // Create the main Purchase record
    const newPurchase = await Purchase.create(
      { supplierId, date },
      { returning: true, transaction }
    );

    // Create the related purchase items
    const purchaseItems = await Promise.all(
      items.map(async (item: PurchaseItem) => {
        const purchaseItem = await PurchaseItem.create(
          {
            purchaseId: newPurchase.getDataValue("id"),
            productId: item.productId,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
          },
          { transaction }
        );

        // Increase stock in Product table
        await Product.increment("stock", {
          by: item.quantity ?? 0,
          where: { id: item.productId },
          transaction,
        });

        return purchaseItem;
      })
    );

    // Determine payment account (Cash or Accounts Payable)
    const paymentAccountId = paymentMethod === "Cash" ? 1 : 4; // Example: Cash = 1, Accounts Payable = 4

    // Create Transaction record
    const newTransaction = await Transaction.create(
      {
        date,
        type: "Purchase",
        referenceId: newPurchase.getDataValue("id"),
        totalAmount,
      },
      { transaction }
    );

    // Create Journal Entries
    const journalEntries = [
      {
        transactionId: newTransaction.getDataValue("id"),
        accountId: 3, // Inventory Account
        description: "Purchase Inventory",
        amount: totalAmount,
        type: "Debit",
      },
      {
        transactionId: newTransaction.getDataValue("id"),
        accountId: paymentAccountId, // Cash or Accounts Payable
        description: "Payment for Purchase",
        amount: totalAmount,
        type: "Credit",
      },
    ];

    // Save Journal Entries
    await JournalEntry.bulkCreate(journalEntries, { transaction });

    // Update Account Balances
    await updateAccountBalances(journalEntries, transaction);

    await transaction.commit();

    return NextResponse.json({
      purchase: newPurchase,
      items: purchaseItems,
      newTransaction,
    });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Failed to create purchase: " + error },
      { status: 500 }
    );
  }
}
