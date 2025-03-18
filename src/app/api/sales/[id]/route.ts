import { NextRequest, NextResponse } from "next/server";
import SaleItem from "@/lib/models/SaleItem";
import Product from "@/lib/models/Product";
import Sale from "@/lib/models/Sale";
import { sequelize } from "@/lib/sequelize";

// GET a single sale by ID
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  try {
    const sale = await Sale.findByPk(Number(id), {
      include: [
        {
          model: SaleItem,
          include: [{ model: Product, attributes: ["name"] }],
        },
      ],
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching sale: " + error },
      { status: 500 }
    );
  }
}

// PUT update a sale
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  const transaction = await sequelize.transaction();

  try {
    const { items, date, customerName } = await req.json();

    const sale = await Sale.findByPk(Number(id), {
      include: SaleItem,
      transaction,
    });

    if (!sale) {
      await transaction.rollback();
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Restore previous stock
    for (const item of sale.getDataValue("SaleItems") ?? []) {
      await Product.increment("stock", {
        by: item.quantity,
        where: { id: item.productId },
        transaction,
      });
    }

    // Delete old sale items
    await SaleItem.destroy({ where: { saleId: id }, transaction });

    // Update sale details
    await sale.update({ date, customerName }, { transaction });

    // Process new sale items
    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });

      if (!product || product.getDataValue("stock") < item.quantity) {
        await transaction.rollback();
        return NextResponse.json(
          { error: "Insufficient stock or product not found" },
          { status: 400 }
        );
      }

      await SaleItem.create(
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
    return NextResponse.json({ message: "Sale updated successfully" });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Error updating sale: " + error },
      { status: 500 }
    );
  }
}

// DELETE a sale
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  const transaction = await sequelize.transaction();

  try {
    const sale = await Sale.findByPk(Number(id), {
      include: SaleItem,
      transaction,
    });

    if (!sale) {
      await transaction.rollback();
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Restore stock before deleting
    for (const item of sale.getDataValue("SaleItems") ?? []) {
      await Product.increment("stock", {
        by: item.quantity,
        where: { id: item.productId },
        transaction,
      });
    }

    // Delete sale items and sale
    await SaleItem.destroy({ where: { saleId: id }, transaction });
    await sale.destroy({ transaction });

    await transaction.commit();
    return NextResponse.json(
      { message: "Sale deleted and stock restored" },
      { status: 200 }
    );
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json(
      { error: "Error deleting sale: " + error },
      { status: 500 }
    );
  }
}
