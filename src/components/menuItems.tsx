import { JSX } from "react";
import { FiHome, FiCopy, FiShoppingCart, FiDollarSign, FiSettings, FiMinus, FiCreditCard, FiPieChart } from "react-icons/fi";

export interface MenuItem {
    name: string;
    href?: string;
    icon?: JSX.Element;
    subItems?: MenuItem[];
}

export const menuItems: MenuItem[] = [
    { name: "Dashboard", href: "/", icon: <FiHome /> },
    {
        name: "Products",
        icon: <FiShoppingCart />,
        subItems: [
            { name: "Products List", href: "/products/product-list" },
            { name: "Add Product", href: "/products/add-product" },
        ],
    },
    {
        name: "Categories",
        icon: <FiCopy />,
        subItems: [
            { name: "List Categories", href: "/categories/category-list" },
            { name: "Add Category", href: "/categories/add-category" },
        ],
    },
    {
        name: "Sales",
        icon: <FiPieChart />,
        subItems: [
            { name: "List Sales", href: "/sales/sales-list" },
            { name: "Add Sales", href: "/sales/add-sales" },
        ],
    },
    {
        name: "Purchases",
        icon: <FiCreditCard />,
        subItems: [
            { name: "List Purchases", href: "/purchases/purchase-list" },
            { name: "Add Purchase", href: "/purchases/add-purchase" },
        ],
    },
    { name: "Settings", href: "/settings", icon: <FiSettings /> },
];
