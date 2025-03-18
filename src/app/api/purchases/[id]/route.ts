import { NextResponse } from "next/server";
import Product from "@/lib/models/Product";
import Purchase from "@/lib/models/Purchase";
import Supplier from "@/lib/models/Supplier";
import PurchaseItem from "@/lib/models/PurchaseItem";

interface PurchaseItem {
  productId: number;
  quantity: number;
  purchasePrice: number;
}

// GET: Fetch a single purchase by ID
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
  }

  try {
    const purchase = await Purchase.findByPk(Number(id), {
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
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    const purchaseJSON = purchase.toJSON();

    let totalPrice = 0;

    const updatedPurchaseItems = purchaseJSON.PurchaseItems.map(
      (item: { purchasePrice: number; quantity: number }) => {
        const totalPurchasePrice = item.purchasePrice * item.quantity;
        totalPrice += totalPurchasePrice;
        return { ...item, totalPurchasePrice };
      }
    );

    return NextResponse.json({
      ...purchaseJSON,
      PurchaseItems: updatedPurchaseItems,
      totalPrice,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch purchase: " + error },
      { status: 500 }
    );
  }
}

// PUT: Update a purchase
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
  }

  try {
    const { supplierId, date, items } = await req.json();

    const purchase = await Purchase.findByPk(Number(id), {
      include: [PurchaseItem],
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    const purchaseJSON = purchase.toJSON();

    // Update purchase details
    await purchase.update({ supplierId, date });

    // Restore old stock before updating
    await Promise.all(
      purchaseJSON.PurchaseItems.map(async (oldItem: PurchaseItem) => {
        await Product.increment("stock", {
          by: -oldItem.quantity,
          where: { id: oldItem.productId },
        });
      })
    );

    await PurchaseItem.destroy({ where: { purchaseId: purchaseJSON.id } });

    // Insert new purchase items
    const purchaseItems = await Promise.all(
      items.map(async (item: PurchaseItem) => {
        const purchaseItem = await PurchaseItem.create({
          purchaseId: purchaseJSON.id,
          productId: item.productId,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
        });

        // Deduct stock based on new items
        await Product.increment("stock", {
          by: item.quantity,
          where: { id: item.productId },
        });

        return purchaseItem;
      })
    );

    return NextResponse.json(
      { purchase, items: purchaseItems },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update purchase: " + error },
      { status: 500 }
    );
  }
}

// DELETE: Remove a purchase
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
  }

  try {
    const purchase = await Purchase.findByPk(Number(id), {
      include: [PurchaseItem],
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    const purchaseJSON = purchase.toJSON();

    // Restore stock before deleting purchase
    await Promise.all(
      purchaseJSON.PurchaseItems.map(async (item: PurchaseItem) => {
        await Product.increment("stock", {
          by: -item.quantity, // Restore stock
          where: { id: item.productId },
        });
      })
    );

    // Delete purchase items
    await PurchaseItem.destroy({ where: { purchaseId: purchaseJSON.id } });

    // Delete purchase
    await purchase.destroy();

    return NextResponse.json(
      { message: "Purchase deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete purchase: " + error },
      { status: 500 }
    );
  }
}
