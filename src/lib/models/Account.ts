import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";

const Account = sequelize.define(
  "Account",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: "unique_account_name",
        msg: ""
      },
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: {
        name: "unique_account_code",
        msg: ""
      },
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    timestamps: true,
  }
);

export default Account;