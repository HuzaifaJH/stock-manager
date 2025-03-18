import { Category, Product, sequelize, Supplier } from "./models";

const SHOULD_SEED = false;

export async function syncDatabase() {
  try {
    console.log(sequelize.models);

    if (SHOULD_SEED) {
      await sequelize.sync({ force: true });
      await seedData();
    } else {
      await sequelize.sync({ alter: true });
    }

    console.log("Database synced successfully.");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
}

async function seedData() {
  // Create a supplier
  const supplier = await Supplier.bulkCreate([
    {
      name: "ABC Suppliers",
      phoneNumber: "123456789",
    },
    {
      name: "DEF Suppliers",
      phoneNumber: "123456789",
    },
    {
      name: "GHI Suppliers",
      phoneNumber: "123456789",
    },
  ]);

  // Create a category
  const category = await Category.bulkCreate([{
    name: "Electronics",
  },{
    name: "Clothes",
  },{
    name: "Books",
  }]);

  // Create a product linked to the category and supplier
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const products = await Product.bulkCreate([
    {
      name: "Laptop",
      categoryId: category[0].getDataValue("id"),
      supplierId: supplier[0].getDataValue("id"),
      stock: 10,
    },
    {
      name: "T-Shirt",
      categoryId: category[1].getDataValue("id"),
      supplierId: supplier[1].getDataValue("id"),
      stock: 50,
    },
    {
      name: "Novel",
      categoryId: category[2].getDataValue("id"),
      supplierId: supplier[2].getDataValue("id"),
      stock: 30,
    },
  ]);

  console.log("Seed data inserted successfully!");
}
