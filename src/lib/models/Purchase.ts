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
});

// Associations
Supplier.hasMany(Purchase, { foreignKey: "supplierId" });
Purchase.belongsTo(Supplier, { foreignKey: "supplierId" });

Purchase.hasMany(PurchaseItem, { foreignKey: "purchaseId", onDelete: "CASCADE" });
PurchaseItem.belongsTo(Purchase, { foreignKey: "purchaseId" });

export default Purchase;
