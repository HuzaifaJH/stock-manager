import { DataTypes } from "sequelize";
import { sequelize } from "@/lib/sequelize";
import Category from "@/lib/models/Category";
import SubCategory from "@/lib/models/SubCategory";

const Product = sequelize.define(
  "Product",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Category,
        key: "id",
      },
    },
    subCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: SubCategory,
        key: "id",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Associations
Product.belongsTo(Category, { foreignKey: "categoryId", onDelete: "RESTRICT" });
Category.hasMany(Product, { foreignKey: "categoryId" });

Product.belongsTo(SubCategory, {
  foreignKey: "subCategoryId",
  onDelete: "RESTRICT",
});
SubCategory.hasMany(Product, { foreignKey: "subCategoryId" });

export default Product;
