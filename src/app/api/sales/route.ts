import { NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import SalesItem from "@/lib/models/SalesItem";
import Product from "@/lib/models/Product";
import Sales from "@/lib/models/Sales";
import updateAccountBalances from "../update-account-balances";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";

interface PurchaseItem {
  productId: number;
  quantity: number;
  price: number;
}

// GET all sales
export async function GET() {
  try {
    const sales = await Sales.findAll({
      include: [
        {
          model: SalesItem,
          include: [
            {
              model: Product,
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    const formattedSales = sales.map((sales) => {
      const saleJSON = sales.toJSON();

      let totalPrice = 0;

      const updatedSalesItems = saleJSON.SalesItems.map(
        (item: { price: number; quantity: number }) => {
          const totalSalePrice = item.price * item.quantity;
          totalPrice += totalSalePrice;

          return {
            ...item,
            totalSalePrice,
          };
        }
      );

      return {
        ...saleJSON,
        SalesItems: updatedSalesItems,
        totalPrice,
      };
    });

    return NextResponse.json(formattedSales);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching sales: " + error },
      { status: 500 }
    );
  }
}

// POST create a new sales
export async function POST(req: Request) {
  const transaction = await sequelize.transaction();
  try {
    const { items, date, customerName, paymentMethod } = await req.json();

    // Create sales entry
    const newSale = await Sales.create({ date, customerName }, { transaction });

    let totalAmount = 0;
    const salesItems = await Promise.all(
      items.map(async (item: PurchaseItem) => {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) {
          throw new Error("Product not found");
        }
        else if(product.getDataValue("stock") < item.quantity){
          throw new Error("Insufficient stock");
        }

        const salesItem = await SalesItem.create(
          {
            salesId: newSale.getDataValue("id"),
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          },
          { transaction }
        );

        // Deduct stock
        await product.update(
          { stock: product.getDataValue("stock") - item.quantity },
          { transaction }
        );

        totalAmount += item.quantity * item.price;
        return salesItem;
      })
    );

    // Create transaction record
    const newTransaction = await Transaction.create(
      {
        date,
        type: "Sale",
        referenceId: newSale.getDataValue("id"),
        totalAmount,
      },
      { transaction }
    );

    // Journal Entries
    const journalEntries = [
      {
        accountId: paymentMethod === "Cash" ? 1 : 2, // Cash (1) or Accounts Receivable (2)
        description: `Sale to ${customerName}`,
        amount: totalAmount,
        type: "Debit",
        transactionId: newTransaction.getDataValue("id"),
      },
      {
        accountId: 4, // Sales Revenue Account
        description: `Revenue from sale to ${customerName}`,
        amount: totalAmount,
        type: "Credit",
        transactionId: newTransaction.getDataValue("id"),
      },
    ];

    await JournalEntry.bulkCreate(journalEntries, { transaction });

    // Update account balances
    await updateAccountBalances(journalEntries, transaction);

    await transaction.commit();
    return NextResponse.json({ newSale, salesItems }, { status: 201 });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Error recording sales: " + error },
      { status: 500 }
    );
  }
}
