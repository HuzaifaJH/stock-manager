import { NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import Product from "@/lib/models/Product";
import Purchase from "@/lib/models/Purchase";
import Supplier from "@/lib/models/Supplier";
import PurchaseItem from "@/lib/models/PurchaseItem";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";
import Category from "@/lib/models/Category";
import SubCategory from "@/lib/models/SubCategory";
import { _PurchaseItem } from "@/app/utils/interfaces";

// interface PurchaseItem {
//   productId: number;
//   quantity: number;
//   purchasePrice: number;
// }

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
              include: [
                {
                  model: Category,
                  attributes: ["id", "name"],
                },
                {
                  model: SubCategory,
                  attributes: ["id", "name"],
                },
              ],
              attributes: ["id", "name", "categoryId", "subCategoryId"],
            },
          ],
        },
      ],
      attributes: ["id", "supplierId", "date", "isPaymentMethodCash", "discount"],
      // order: [["createdAt", "DESC"]],
    });

    const result = purchases.map((purchase) => {
      const plainPurchase = purchase.get({ plain: true });

      plainPurchase.PurchaseItems = plainPurchase.PurchaseItems.map(
        (item: { Product: { categoryId: number; subCategoryId: number } }) => {
          const { categoryId, subCategoryId } = item.Product;
          return {
            ...item,
            categoryId,
            subCategoryId,
          };
        }
      );

      return plainPurchase;
    });

    const formattedPurchases = result.map((purchase) => {
      let totalPrice = 0;

      const updatedPurchaseItems = purchase.PurchaseItems.map(
        (item: { purchasePrice: number; quantity: number }) => {
          const totalPurchasePrice = item.purchasePrice * item.quantity;
          totalPrice += totalPurchasePrice;

          return {
            ...item,
            totalPurchasePrice,
          };
        }
      );

      totalPrice -= purchase.discount;

      return {
        ...purchase,
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
    const { supplierId, date, items, isPaymentMethodCash, discount } =
      await req.json();

    // Calculate total purchase amount
    let totalAmount = items.reduce(
      (sum: number, item: { purchasePrice: number; quantity: number }) =>
        sum + item.purchasePrice * item.quantity,
      0
    );

    totalAmount -= discount;

    // Create the main Purchase record
    const newPurchase = await Purchase.create(
      { supplierId, date, isPaymentMethodCash, discount },
      { returning: true, transaction }
    );

    if (!isPaymentMethodCash) {
      await Supplier.increment("payableAmount", {
        by: totalAmount,
        where: { id: supplierId },
        transaction,
      });
    }

    // Create the related purchase items
    const purchaseItems = await Promise.all(
      items.map(async (item: _PurchaseItem) => {
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
    const paymentAccountId = isPaymentMethodCash === true ? 7 : 6;

    // Create Transaction record
    const newTransaction = await Transaction.create(
      {
        date,
        type: "Purchase",
        referenceId: "P#" + newPurchase.getDataValue("id"),
        totalAmount,
      },
      { transaction }
    );

    // Create Journal Entries
    const journalEntries = [
      {
        transactionId: newTransaction.getDataValue("id"),
        ledgerId: 3, // Inventory Account
        description: "Purchase Inventory",
        amount: totalAmount,
        type: "Debit",
      },
      {
        transactionId: newTransaction.getDataValue("id"),
        ledgerId: paymentAccountId, // Cash or Accounts Payable
        description: "Payment for Purchase",
        amount: totalAmount,
        type: "Credit",
      },
    ];

    // Save Journal Entries
    await JournalEntry.bulkCreate(journalEntries, { transaction });

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
