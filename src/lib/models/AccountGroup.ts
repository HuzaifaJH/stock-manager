import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";

const AccountGroup = sequelize.define(
  "AccountGroup",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: "composite_group_name",
    },
    accountType: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: "composite_group_name",
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: "unique_account_code"
    },
    // balance: {
    //   type: DataTypes.DECIMAL(10, 2),
    //   allowNull: false,
    //   defaultValue: 0.0,
    // },
  },
  {
    timestamps: true,
    modelName: "AccountGroup",
    indexes: [
      {
        unique: true,
        fields: ["name", "accountType"],
        name: "composite_group_name",
      },
    ],
  }
);

export default AccountGroup;