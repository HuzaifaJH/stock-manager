import { sequelize } from "./models";

export async function syncDatabase() {
  try {
    console.log(sequelize.models);
    await sequelize.sync({ alter: true });
    console.log("Database synced successfully.");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
}