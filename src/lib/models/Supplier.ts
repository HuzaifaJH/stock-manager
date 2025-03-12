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
  },
  {
    timestamps: true,
  }
);

export default Supplier;
