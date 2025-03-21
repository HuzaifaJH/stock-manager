import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import Product from "@/lib/models/Product";

const PurchaseItem = sequelize.define("PurchaseItem", {
  purchaseId: {
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
  },
  purchasePrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

PurchaseItem.belongsTo(Product, { foreignKey: "productId", onDelete: "RESTRICT" });

export default PurchaseItem;
