import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import LedgerAccounts from "@/lib/models/LedgerAccount";

const Expense = sequelize.define(
  "Expense",
  {
    expenseLedgerAccount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

Expense.belongsTo(LedgerAccounts, {
  foreignKey: "expenseLedgerAccount",
  onDelete: "RESTRICT",
});

export default Expense;
