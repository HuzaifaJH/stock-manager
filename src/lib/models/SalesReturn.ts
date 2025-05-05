import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import SalesReturnItem from "@/lib/models/SalesReturnItem";

const SalesReturn = sequelize.define(
  "SalesReturn",
  {
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isPaymentMethodCash: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

SalesReturn.hasMany(SalesReturnItem, { foreignKey: "salesReturnId" });
SalesReturnItem.belongsTo(SalesReturn, {
  foreignKey: "salesReturnId",
  onDelete: "CASCADE",
});

export default SalesReturn;
