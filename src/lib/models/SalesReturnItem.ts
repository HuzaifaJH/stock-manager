import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import Product from "@/lib/models/Product";

const SalesReturnItem = sequelize.define(
  "SalesReturnItem",
  {
    salesReturnId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    returnPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Associations
SalesReturnItem.belongsTo(Product, { foreignKey: "productId", onDelete: "RESTRICT" });

export default SalesReturnItem;