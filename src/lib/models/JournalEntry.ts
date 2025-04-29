import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import Transaction from "@/lib/models/Transaction";
import LedgerAccounts from "@/lib/models/LedgerAccount";

const JournalEntry = sequelize.define(
  "JournalEntry",
  {
    // date: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    // },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ledgerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // references: {
      //   model: "Accounts",
      //   key: "id",
      // },
      // onDelete: "CASCADE",
    },
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // references: {
      //   model: "Transactions",
      //   key: "id",
      // },
      // onDelete: "CASCADE",
    },
  },
  {
    timestamps: true,
  }
);

JournalEntry.belongsTo(LedgerAccounts, {
  foreignKey: "ledgerId",
  onDelete: 'RESTRICT'
});
JournalEntry.belongsTo(Transaction, { foreignKey: "transactionId" });
Transaction.hasMany(JournalEntry, {
  foreignKey: "transactionId",
  onDelete: "CASCADE",
});

export default JournalEntry;
