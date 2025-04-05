import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import Supplier from "@/lib/models/Supplier";
import PurchaseReturnItem from "@/lib/models/PurchaseReturnItem";

const PurchaseReturn = sequelize.define("PurchaseReturn", {
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

// Associations
Supplier.hasMany(PurchaseReturn, { foreignKey: "supplierId" });
PurchaseReturn.belongsTo(Supplier, { foreignKey: "supplierId" });

PurchaseReturn.hasMany(PurchaseReturnItem, {
  foreignKey: "purchaseReturnId",
  onDelete: "CASCADE",
});
PurchaseReturnItem.belongsTo(PurchaseReturn, {
  foreignKey: "purchaseReturnId",
});

export default PurchaseReturn;
