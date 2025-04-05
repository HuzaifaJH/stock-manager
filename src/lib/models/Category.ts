import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";

const Category = sequelize.define(
  "Category",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: "unique_category_name",
        msg: ""
      },
    },
  },
  {
    timestamps: true,
    indexes: [], // Ensure no additional indexes are auto-generated
  }
);

export default Category;
