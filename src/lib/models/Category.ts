import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";

const Category = sequelize.define(
  "Category",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export default Category;
