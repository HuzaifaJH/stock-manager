import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";

const Supplier = sequelize.define(
  "Supplier",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payableAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default Supplier;
