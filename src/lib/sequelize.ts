import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import mysql2 from "mysql2";

dotenv.config();

export const sequelize = new Sequelize(
  "ims",
  "root",
  "root",
  {
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: "mysql",
    dialectModule: mysql2,
    logging: false,
  }
);

export async function testDBConnection() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}