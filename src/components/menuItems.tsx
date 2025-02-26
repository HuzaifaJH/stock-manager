import { JSX } from "react";
import { FiHome, FiBox, FiShoppingCart, FiDollarSign, FiSettings } from "react-icons/fi";

export interface MenuItem {
    name: string;
    href?: string;
    icon: JSX.Element;
    subItems?: MenuItem[];
}

export const menuItems: MenuItem[] = [
    { name: "Dashboard", href: "/", icon: <FiHome /> },
    {
        name: "Products",
        icon: <FiBox />,
        subItems: [
            { name: "Products List", href: "/products/product-list", icon: <FiBox /> },
            { name: "Add Product", href: "/products/add-product", icon: <FiBox /> },
        ],
    },
    {
        name: "Categories",
        icon: <FiShoppingCart />,
        subItems: [
            { name: "List Categories", href: "/categories/category-list", icon: <FiShoppingCart /> },
            { name: "Add Category", href: "/categories/add-category", icon: <FiShoppingCart /> },
        ],
    },
    {
        name: "Sales",
        icon: <FiShoppingCart />,
        subItems: [
            { name: "List Sales", href: "/sales/sales-list", icon: <FiShoppingCart /> },
            { name: "Add Sales", href: "/sales/add-sales", icon: <FiShoppingCart /> },
        ],
    },
    {
        name: "Purchases",
        icon: <FiShoppingCart />,
        subItems: [
            { name: "List Purchases", href: "/purchases/purchase-list", icon: <FiShoppingCart /> },
            { name: "Add Purchase", href: "/purchases/add-purchase", icon: <FiShoppingCart /> },
        ],
    },
    { name: "Settings", href: "/settings", icon: <FiSettings /> },
];
