import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import SaleItem from "@/lib/models/SaleItem";

const Sale = sequelize.define(
  "Sale",
  {
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

Sale.hasMany(SaleItem, { foreignKey: "saleId", onDelete: "CASCADE" });
SaleItem.belongsTo(Sale, { foreignKey: "saleId" });

export default Sale;