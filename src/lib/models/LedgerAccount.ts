import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import AccountGroup from "@/lib/models/AccountGroup";

const LedgerAccount = sequelize.define(
  "LedgerAccount",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: "composite_ledger_name",
    },
    accountGroup: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: "composite_ledger_name",
      // references: {
      //   model: "AccountGroup",
      //   key: "id",
      // },
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: "unique_ledger_code",
        msg: "",
      },
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: "composite_ledger_name",
        fields: ["name", "accountGroup"],
      },
    ],
  }
);

LedgerAccount.belongsTo(AccountGroup, { foreignKey: "accountGroup", onDelete: 'RESTRICT' });
AccountGroup.hasMany(LedgerAccount, { foreignKey: "accountGroup" });

export default LedgerAccount;
