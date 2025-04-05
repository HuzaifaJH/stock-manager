import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import Product from "@/lib/models/Product";

const PurchaseReturnItem = sequelize.define("PurchaseReturnItem", {
  purchaseReturnId: {
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
  purchaseReturnPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

PurchaseReturnItem.belongsTo(Product, { foreignKey: "productId", onDelete: "RESTRICT" });

export default PurchaseReturnItem;