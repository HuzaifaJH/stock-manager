import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import Supplier from "@/lib/models/Supplier";
import Product from "@/lib/models/Product";

const Purchase = sequelize.define(
  "Purchase",
  {
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Supplier,
        key: "id",
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
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
    purchasePrice: {
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
Supplier.hasMany(Purchase, { foreignKey: "supplierId" });
Purchase.belongsTo(Supplier, { foreignKey: "supplierId" });

Product.hasMany(Purchase, { foreignKey: "productId", onDelete: "RESTRICT" });
Purchase.belongsTo(Product, { foreignKey: "productId" });

export default Purchase;
