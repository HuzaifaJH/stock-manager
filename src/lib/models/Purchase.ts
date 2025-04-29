import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import Supplier from "@/lib/models/Supplier";
import PurchaseItem from "@/lib/models/PurchaseItem";

const Purchase = sequelize.define("Purchase", {
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  isPaymentMethodCash: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
});

// Associations
Supplier.hasMany(Purchase, { foreignKey: "supplierId" });
Purchase.belongsTo(Supplier, {
  foreignKey: "supplierId",
  onDelete: "RESTRICT",
});

Purchase.hasMany(PurchaseItem, { foreignKey: "purchaseId" });
PurchaseItem.belongsTo(Purchase, {
  foreignKey: "purchaseId",
  onDelete: "CASCADE",
});

export default Purchase;
