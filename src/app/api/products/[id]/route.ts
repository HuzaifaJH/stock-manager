import Category from "@/lib/models/Category";
import Product from "@/lib/models/Product";
import Purchase from "@/lib/models/Purchase";

// GET a product by ID
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params; // Await params

  if (!id || id.length === 0) {
    return Response.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const product = await Product.findByPk(Number(id), {
      include: { model: Category, attributes: ["name"] },
    });
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    return Response.json(product);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch product: " + error },
      { status: 500 }
    );
  }
}

// UPDATE a product by ID
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  if (!id || id.length === 0) {
    return Response.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const { name, price, stock } = await req.json();
    const product = await Product.findByPk(Number(id));

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    await product.update({ name, price, stock });
    return Response.json(product);
  } catch (error) {
    return Response.json(
      { error: "Failed to update product: " + error },
      { status: 500 }
    );
  }
}

// DELETE a product by ID
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string[] }> }
) {
  const { id } = await context.params;
  if (!id || id.length === 0) {
    return Response.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const existingPurchases = await Purchase.count({
      where: { productId: id },
    });

    if (existingPurchases > 0) {
      return Response.json(
        { error: "Cannot delete product with existing purchases" },
        { status: 400 }
      );
    }

    const product = await Product.findByPk(Number(id));
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    await product.destroy();
    return Response.json({ message: "Product deleted successfully" });
  } catch (error) {
    return Response.json(
      { error: "Failed to delete product: " + error },
      { status: 500 }
    );
  }
}
