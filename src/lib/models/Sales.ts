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
    isPaymentMethodCash: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    discount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

Sales.hasMany(SalesItem, { foreignKey: "salesId" });
SalesItem.belongsTo(Sales, { foreignKey: "salesId", onDelete: "CASCADE" });

export default Sales;
