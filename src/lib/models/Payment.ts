import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import Account from "./Account";

const Payment = sequelize.define(
  "Payment",
  {
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    method: {
      type: DataTypes.ENUM("Cash", "Bank Transfer", "Card", "Cheque"),
      allowNull: false,
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

Payment.belongsTo(Account, { foreignKey: "accountId", onDelete: "CASCADE" });

export default Payment;
