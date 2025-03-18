import { NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import SaleItem from "@/lib/models/SaleItem";
import Product from "@/lib/models/Product";
import Sale from "@/lib/models/Sale";

// GET all sales
export async function GET() {
  try {
    const sales = await Sale.findAll({
      include: [
        {
          model: SaleItem,
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

      const updatedSaleItems = saleJSON.SaleItems.map((item: { price: number; quantity: number; }) => {
        const totalSalePrice = item.price * item.quantity;
        totalPrice += totalSalePrice;

        return {
          ...item,
          totalSalePrice,
        };
      });

      return {
        ...saleJSON,
        SaleItems: updatedSaleItems,
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

// POST create a new sale
export async function POST(req: Request) {
  const transaction = await sequelize.transaction();
  try {
    const { items, date, customerName } = await req.json();

    // Create Sale entry
    const newSale = await Sale.create({ date, customerName }, { transaction });

    // Process sale items
    const saleItems = await Promise.all(
      items.map(async (item: any) => {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product || product.getDataValue("stock") < item.quantity) {
          throw new Error("Insufficient stock or product not found");
        }

        const saleItem = await SaleItem.create(
          {
            saleId: newSale.getDataValue("id"),
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

        return saleItem;
      })
    );

    await transaction.commit();
    return NextResponse.json({newSale, saleItems}, { status: 201 });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Error recording sale: " + error },
      { status: 500 }
    );
  }
}
