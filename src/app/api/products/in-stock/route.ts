import { NextResponse } from "next/server";
import { Op } from "sequelize";
import Category from "@/lib/models/Category";
import Product from "@/lib/models/Product";
import SubCategory from "@/lib/models/SubCategory";

export async function GET() {
  try {
    const productsInStock = await Product.findAll({
      where: {
        stock: {
          [Op.gt]: 0,
        },
      },
      include: [
        { model: Category, attributes: ["name"] },
        { model: SubCategory, attributes: ["name"] },
      ],
    });

    return NextResponse.json(productsInStock);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch in-stock products: " + error },
      { status: 500 }
    );
  }
}
