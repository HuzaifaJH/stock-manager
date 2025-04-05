import { NextResponse } from "next/server";
import SalesItem from "@/lib/models/SalesItem";
import Product from "@/lib/models/Product";
import Sales from "@/lib/models/Sales";
import { sequelize } from "@/lib/sequelize";

// GET a single sales by ID
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  try {
    const sales = await Sales.findByPk(Number(id), {
      include: [
        {
          model: SalesItem,
          include: [{ model: Product, attributes: ["name"] }],
        },
      ],
    });

    if (!sales) {
      return NextResponse.json({ error: "Sales not found" }, { status: 404 });
    }

    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching sales: " + error },
      { status: 500 }
    );
  }
}

// PUT update a sales
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  const transaction = await sequelize.transaction();

  try {
    const { items, date, customerName } = await req.json();

    const sales = await Sales.findByPk(Number(id), {
      include: SalesItem,
      transaction,
    });

    if (!sales) {
      await transaction.rollback();
      return NextResponse.json({ error: "Sales not found" }, { status: 404 });
    }

    // Restore previous stock
    for (const item of sales.getDataValue("SalesItems") ?? []) {
      await Product.increment("stock", {
        by: item.quantity,
        where: { id: item.productId },
        transaction,
      });
    }

    // Delete old sales items
    await SalesItem.destroy({ where: { saleId: id }, transaction });

    // Update sales details
    await sales.update({ date, customerName }, { transaction });

    // Process new sales items
    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });

      if (!product || product.getDataValue("stock") < item.quantity) {
        await transaction.rollback();
        return NextResponse.json(
          { error: "Insufficient stock or product not found" },
          { status: 400 }
        );
      }

      await SalesItem.create(
        {
          saleId: id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        },
        { transaction }
      );

      // Deduct new stock
      await product.update(
        { stock: product.getDataValue("stock") - item.quantity },
        { transaction }
      );
    }

    await transaction.commit();
    return NextResponse.json({ message: "Sales updated successfully" });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Error updating sales: " + error },
      { status: 500 }
    );
  }
}

// DELETE a sales
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  const transaction = await sequelize.transaction();

  try {
    const sales = await Sales.findByPk(Number(id), {
      include: SalesItem,
      transaction,
    });

    if (!sales) {
      await transaction.rollback();
      return NextResponse.json({ error: "Sales not found" }, { status: 404 });
    }

    // Restore stock before deleting
    for (const item of sales.getDataValue("SalesItems") ?? []) {
      await Product.increment("stock", {
        by: item.quantity,
        where: { id: item.productId },
        transaction,
      });
    }

    // Delete sales items and sales
    await SalesItem.destroy({ where: { saleId: id }, transaction });
    await sales.destroy({ transaction });

    await transaction.commit();
    return NextResponse.json(
      { message: "Sales deleted and stock restored" },
      { status: 200 }
    );
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Error deleting sales: " + error },
      { status: 500 }
    );
  }
}
