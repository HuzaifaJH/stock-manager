// models/SubCategory.ts
import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import Category from "@/lib/models/Category";

const SubCategory = sequelize.define(
  "SubCategory",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Category,
        key: "id",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Associations
Category.hasMany(SubCategory, { foreignKey: "categoryId", onDelete: "CASCADE" });
SubCategory.belongsTo(Category, { foreignKey: "categoryId" });

export default SubCategory;