import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import Product from "@/lib/models/Product";

const SalesItem = sequelize.define(
  "SalesItem",
  {
    salesId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // references: {
      //   model: Sale,
      //   key: "id",
      // },
      // onDelete: "CASCADE",
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // references: {
      //   model: Product,
      //   key: "id",
      // },
      // onDelete: "RESTRICT",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    price: {
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
// Product.hasMany(SalesItem, { foreignKey: "productId", onDelete: "RESTRICT" });
SalesItem.belongsTo(Product, { foreignKey: "productId", onDelete: "RESTRICT" });

export default SalesItem;
