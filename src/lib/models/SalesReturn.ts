import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import SalesReturnItem from "@/lib/models/SalesReturnItem";

const SalesReturn = sequelize.define(
  "SalesReturn",
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
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

SalesReturn.hasMany(SalesReturnItem, { foreignKey: "salesReturnId", onDelete: "CASCADE" });
SalesReturnItem.belongsTo(SalesReturn, { foreignKey: "salesReturnId" });

export default SalesReturn;