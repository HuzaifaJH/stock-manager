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

      const updatedPurchaseItems = purchaseJSON.PurchaseItems.map((item: { purchasePrice: number; quantity: number; }) => {
        const totalPurchasePrice = item.purchasePrice * item.quantity;
        totalPrice += totalPurchasePrice;

        return {
          ...item,
          totalPurchasePrice,
        };
      });

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
  try {
    const { supplierId, date, items } = await req.json();

    // Create the main Purchase record
    const newPurchase = await Purchase.create(
      {
        supplierId,
        date,
      },
      { returning: true }
    );

    // Create the related purchase items
    const purchaseItems = await Promise.all(
      items.map(async (item: PurchaseItem) => {
        const purchaseItem = await PurchaseItem.create({
          purchaseId: newPurchase.getDataValue("id"),
          productId: item.productId,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
        });

        // Deduct stock from the Product table
        await Product.increment("stock", {
          by: item.quantity ?? 0,
          where: { id: item.productId },
        });

        return purchaseItem;
      })
    );

    return NextResponse.json({ purchase: newPurchase, items: purchaseItems });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create purchase: " + error },
      { status: 500 }
    );
  }
}
