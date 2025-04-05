import { NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import SalesReturnItem from "@/lib/models/SalesReturnItem";
import Product from "@/lib/models/Product";
import SalesReturn from "@/lib/models/SalesReturn";
import updateAccountBalances from "../update-account-balances";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";

interface SalesReturnItem {
  productId: number;
  quantity: number;
  returnPrice: number;
}

// GET all sales
export async function GET() {
  try {
    const salesReturns = await SalesReturn.findAll({
      include: [
        {
          model: SalesReturnItem,
          include: [
            {
              model: Product,
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    const formattedSalesReturns = salesReturns.map((salesReturns) => {
      const salesReturnJSON = salesReturns.toJSON();

      let totalPrice = 0;

      const updatedSalesReturnItems = salesReturnJSON.SalesReturnItems.map(
        (item: { returnPrice: number; quantity: number }) => {
          const totalSalesReturnPrice = item.returnPrice * item.quantity;
          totalPrice += totalSalesReturnPrice;

          return {
            ...item,
            totalSalesReturnPrice,
          };
        }
      );

      return {
        ...salesReturnJSON,
        SalesItems: updatedSalesReturnItems,
        totalPrice,
      };
    });

    return NextResponse.json(formattedSalesReturns);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching sales returns: " + error },
      { status: 500 }
    );
  }
}

// POST create a new sales
export async function POST(req: Request) {
  const transaction = await sequelize.transaction();
  try {
    const { items, date, customerName, paymentMethod, reason } =
      await req.json();

    // Create sales entry
    const newSalesReturn = await SalesReturn.create(
      { date, customerName, reason },
      { transaction }
    );

    let totalAmount = 0;
    const salesReturnItems = await Promise.all(
      items.map(async (item: SalesReturnItem) => {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) {
          throw new Error("Product not found");
        }

        const salesReturnItem = await SalesReturnItem.create(
          {
            salesReturnId: newSalesReturn.getDataValue("id"),
            productId: item.productId,
            quantity: item.quantity,
            returnPrice: item.returnPrice,
          },
          { transaction }
        );

        // Add stock
        await product.update(
          { stock: product.getDataValue("stock") + item.quantity },
          { transaction }
        );

        totalAmount += item.quantity * item.returnPrice;
        return salesReturnItem;
      })
    );

    // Create transaction record
    const newTransaction = await Transaction.create(
      {
        date,
        type: "Sale",
        referenceId: newSalesReturn.getDataValue("id"),
        totalAmount,
      },
      { transaction }
    );

    // Journal Entries
    const journalEntries = [
      {
        accountId: 4, // Sales Revenue Account
        description: `Sales return from ${customerName}`,
        amount: totalAmount,
        type: "Debit",
        transactionId: newTransaction.getDataValue("id"),
      },
      {
        accountId: paymentMethod === "Cash" ? 1 : 4, // Cash (1) or Accounts Receivable (4)
        description: `Refund to ${customerName}`,
        amount: totalAmount,
        type: "Credit",
        transactionId: newTransaction.getDataValue("id"),
      },
    ];

    await JournalEntry.bulkCreate(journalEntries, { transaction });

    // Update account balances
    await updateAccountBalances(journalEntries, transaction);

    await transaction.commit();
    return NextResponse.json(
      { newSalesReturn, salesReturnItems },
      { status: 201 }
    );
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Error recording sales return: " + error },
      { status: 500 }
    );
  }
}
