import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import SalesItem from "@/lib/models/SalesItem";

const Sales = sequelize.define(
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

Sales.hasMany(SalesItem, { foreignKey: "salesId", onDelete: "CASCADE" });
SalesItem.belongsTo(Sales, { foreignKey: "salesId" });

export default Sales;