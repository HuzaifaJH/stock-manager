import { Category, Product, sequelize, Supplier } from "./models";

const SHOULD_SEED = false;

export async function syncDatabase() {
  try {
    console.log(sequelize.models);
    
    if (SHOULD_SEED) {
      await sequelize.sync({ force: true });
      await seedData();
    }
    else{
      await sequelize.sync({ alter: true });
    }

    console.log("Database synced successfully.");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
}

async function seedData() {
  // Create a supplier
  const supplier = await Supplier.create({
    name: "ABC Suppliers",
    phoneNumber: "123456789",
  });

  // Create a category
  const category = await Category.create({
    name: "Electronics",
  });

  // Create a product linked to the category and supplier
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const product = await Product.create({
    name: "Laptop",
    categoryId: category.getDataValue("id"),
    supplierId: supplier.getDataValue("id"),
    stock: 10,
    price: 500,
  });

  console.log("Seed data inserted successfully!");
}
