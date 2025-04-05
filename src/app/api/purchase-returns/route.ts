import { NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import Product from "@/lib/models/Product";
import PurchaseReturn from "@/lib/models/PurchaseReturn";
import Supplier from "@/lib/models/Supplier";
import PurchaseReturnItem from "@/lib/models/PurchaseReturnItem";
import updateAccountBalances from "../update-account-balances";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";

interface PurchaseReturnItem {
  productId: number;
  quantity: number;
  purchaseReturnPrice: number;
}

export async function GET() {
  try {
    const purchaseReturns = await PurchaseReturn.findAll({
      include: [
        {
          model: Supplier,
          attributes: ["name"],
        },
        {
          model: PurchaseReturnItem,
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

    const formattedPurchaseReturns = purchaseReturns.map((purchaseReturn) => {
      const purchaseReturnsJSON = purchaseReturn.toJSON();

      let totalPrice = 0;

      const updatedPurchaseReturnItems =
        purchaseReturnsJSON.PurchaseReturnItems.map(
          (item: { purchaseReturnPrice: number; quantity: number }) => {
            const totalPurchaseReturnPrice =
              item.purchaseReturnPrice * item.quantity;
            totalPrice += totalPurchaseReturnPrice;

            return {
              ...item,
              totalPurchaseReturnPrice,
            };
          }
        );

      return {
        ...purchaseReturnsJSON,
        PurchaseReturnItems: updatedPurchaseReturnItems,
        totalPrice,
      };
    });

    return NextResponse.json(formattedPurchaseReturns);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch purchase returns: " + error },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const transaction = await sequelize.transaction();
  try {
    const { supplierId, date, items, paymentMethod, reason } = await req.json();

    // Calculate total purchase amount
    const totalAmount = items.reduce(
      (sum: number, item: { purchaseReturnPrice: number; quantity: number }) =>
        sum + item.purchaseReturnPrice * item.quantity,
      0
    );

    // Create the main Purchase Return record
    const newPurchaseReturn = await PurchaseReturn.create(
      { supplierId, date, reason },
      { returning: true, transaction }
    );

    // Create the related purchase return items
    const purchaseReturnItems = await Promise.all(
      items.map(async (item: PurchaseReturnItem) => {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) {
          throw new Error("Product not found");
        } else if (product.getDataValue("stock") < item.quantity) {
          throw new Error("Insufficient stock");
        }

        const purchaseReturnItem = await PurchaseReturnItem.create(
          {
            purchaseReturnId: newPurchaseReturn.getDataValue("id"),
            productId: item.productId,
            quantity: item.quantity,
            purchaseReturnPrice: item.purchaseReturnPrice,
          },
          { transaction }
        );

        // Increase stock in Product table
        await Product.decrement("stock", {
          by: item.quantity ?? 0,
          where: { id: item.productId },
          transaction,
        });

        return purchaseReturnItem;
      })
    );

    // Determine payment account (Cash or Accounts Receivable)
    const paymentAccountId = paymentMethod === "Cash" ? 1 : 2; // Cash (1) or Accounts Receivable (2)

    // Create Transaction record
    const newTransaction = await Transaction.create(
      {
        date,
        type: "Purchase",
        referenceId: newPurchaseReturn.getDataValue("id"),
        totalAmount,
      },
      { transaction }
    );

    // Create Journal Entries
    const journalEntries = [
      {
        transactionId: newTransaction.getDataValue("id"),
        accountId: paymentAccountId, // Cash or Accounts Payable
        description: "Refund from Purchase Return",
        amount: totalAmount,
        type: "Debit",
      },
      {
        transactionId: newTransaction.getDataValue("id"),
        accountId: 3, // Inventory Account
        description: "Inventory Returned",
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
      purchase: newPurchaseReturn,
      items: purchaseReturnItems,
      newTransaction,
    });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Failed to create purchase return: " + error },
      { status: 500 }
    );
  }
}
