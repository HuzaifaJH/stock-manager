import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import Product from "@/lib/models/Product";

const Sale = sequelize.define(
  "Sale",
  {
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Product,
        key: "id",
      },
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
  }
);

// Associations
Product.hasMany(Sale, { foreignKey: "productId", onDelete: "RESTRICT" });
Sale.belongsTo(Product, { foreignKey: "productId" });

export default Sale;
