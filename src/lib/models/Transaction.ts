import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import JournalEntry from "@/lib/models/JournalEntry";

const Transaction = sequelize.define(
  "Transaction",
  {
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    referenceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

export default Transaction;
