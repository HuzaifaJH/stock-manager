import { Category, Subcategory, Product } from "@/app/utils/interfaces";
import CategoryModel from "@/lib/models/Category";
import ProductModel from "@/lib/models/Product";
import SubCategoryModel from "@/lib/models/SubCategory";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = (await CategoryModel.findAll({
      include: [
        {
          model: SubCategoryModel,
          include: [
            {
              model: ProductModel,
              attributes: ["id", "name", "stock", "price"],
            },
          ],
        },
      ],
    })) as unknown as Category[];

    let totalInventoryValue = 0;

    const report = categories.map((category: Category) => {
      let categoryTotalValue = 0;

      const SubCategories =
        category.SubCategories?.map((subcat: Subcategory) => {
          let subTotalValue = 0;

          const Products =
            subcat.Products?.map((product: Product) => {
              const stockValue = (product.stock ?? 0) * (product.price ?? 0);
              subTotalValue += stockValue;

              return {
                id: product.id,
                name: product.name,
                stock: product.stock,
                price: product.price,
                stockValue,
              };
            }) ?? [];

          categoryTotalValue += subTotalValue;

          return {
            id: subcat.id,
            name: subcat.name,
            Products,
            subTotalValue,
          };
        }) ?? [];

      totalInventoryValue += categoryTotalValue;

      return {
        id: category.id,
        name: category.name,
        SubCategories,
        categoryTotalValue,
        totalInventoryValue,
      };
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return NextResponse.json(
      { error: "Error generating inventory report: " + error },
      { status: 500 }
    );
  }
}
