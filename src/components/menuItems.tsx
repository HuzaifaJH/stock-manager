import { JSX } from "react";
import { FiHome, FiCopy, FiSettings, FiCreditCard, FiPieChart, FiUsers, FiBox } from "react-icons/fi";

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
        icon: <FiBox />,
        href: "/products",
        // subItems: [
        //     { name: "Products List", href: "/products/product-list" },
        //     { name: "Add Product", href: "/products/add-product" },
        // ],
    },
    {
        name: "Categories",
        icon: <FiCopy />,
        href: "/categories",
        // subItems: [
        //     { name: "List Categories", href: "/categories/category-list" },
        //     { name: "Add Category", href: "/categories/add-category" },
        // ],
    },
    {
        name: "Suppliers",
        href: "/suppliers",
        icon: <FiUsers />
    },
    {
        name: "Sales",
        href: "/sales",
        icon: <FiPieChart />
    },
    {
        name: "Purchases",
        href: "/purchases",
        icon: <FiCreditCard />,
        // subItems: [
        //     { name: "Purchase List", href: "/purchases/purchase-list" },
        //     { name: "Add Purchase", href: "/purchases/add-purchase" },
        // ],
    },
    { name: "Settings", href: "/settings", icon: <FiSettings /> },
];
