import { NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import SalesItem from "@/lib/models/SalesItem";
import Product from "@/lib/models/Product";
import Sales from "@/lib/models/Sales";
import Transaction from "@/lib/models/Transaction";
import JournalEntry from "@/lib/models/JournalEntry";
import Category from "@/lib/models/Category";
import SubCategory from "@/lib/models/SubCategory";

interface SalesItem {
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
    });

    const result = sales.map((sales) => {
      const plainSales = sales.get({ plain: true });

      plainSales.SalesItems = plainSales.SalesItems.map(
        (item: { Product: { categoryId: number; subCategoryId: number } }) => {
          const { categoryId, subCategoryId } = item.Product;
          return {
            ...item,
            categoryId,
            subCategoryId,
          };
        }
      );

      return plainSales;
    });

    const formattedSales = result.map((sales) => {
      let totalPrice = 0;

      const updatedSalesItems = sales.SalesItems.map(
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
        ...sales,
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
    const { items, date, customerName, isPaymentMethodCash } = await req.json();

    // Create sales entry
    const newSale = await Sales.create({ date, customerName, isPaymentMethodCash }, { transaction });

    let totalAmount = 0;
    const salesItems = await Promise.all(
      items.map(async (item: SalesItem) => {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) {
          await transaction.rollback();
          throw new Error("Product not found");
        } else if (product.getDataValue("stock") < item.quantity) {
          await transaction.rollback();
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
        ledgerId: isPaymentMethodCash === true ? 7 : 5, // Cash (1) or Accounts Receivable (2)
        description: `Sale to ${customerName}`,
        amount: totalAmount,
        type: "Debit",
        transactionId: newTransaction.getDataValue("id"),
      },
      {
        ledgerId: 1, // Sales Revenue Account
        description: `Revenue from sale to ${customerName}`,
        amount: totalAmount,
        type: "Credit",
        transactionId: newTransaction.getDataValue("id"),
      },
    ];

    await JournalEntry.bulkCreate(journalEntries, { transaction });

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
