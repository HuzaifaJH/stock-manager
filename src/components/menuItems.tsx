import { JSX } from "react";
import { FiHome, FiCopy, FiCreditCard, FiPieChart, FiUsers, FiBox, FiBook, FiDollarSign, FiBookOpen } from "react-icons/fi";

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
        href: "/POS/products",
        // subItems: [
        //     { name: "Products List", href: "/products/product-list" },
        //     { name: "Add Product", href: "/products/add-product" },
        // ],
    },
    {
        name: "Categories",
        icon: <FiCopy />,
        href: "/POS/categories",
        // subItems: [
        //     { name: "List Categories", href: "/categories/category-list" },
        //     { name: "Add Category", href: "/categories/add-category" },
        // ],
    },
    {
        name: "Suppliers",
        href: "/POS/suppliers",
        icon: <FiUsers />
    },
    {
        name: "Sales",
        href: "/POS/sales",
        icon: <FiPieChart />
    },
    {
        name: "Sales Return",
        href: "/POS/sales-return",
        icon: <FiPieChart />
    },
    {
        name: "Purchases",
        href: "/POS/purchases",
        icon: <FiCreditCard />,
        // subItems: [
        //     { name: "Purchase List", href: "/purchases/purchase-list" },
        //     { name: "Add Purchase", href: "/purchases/add-purchase" },
        // ],
    },
    {
        name: "Purchase Return",
        href: "/POS/purchase-return",
        icon: <FiCreditCard />
    },
    // { name: "Settings", href: "/settings", icon: <FiSettings /> },
    {
        name: "Transactions",
        href: "/accounts/transactions",
        icon: <FiDollarSign />
    },
    {
        name: "Financials",
        icon: <FiBook />,
        subItems: [
            { name: "Chart of Accounts", href: "/accounts/chart-of-accounts" },
            { name: "General Ledger", href: "/accounts/general-ledger" },
            { name: "Trial Balance", href: "/accounts/trial-balance" },
            { name: "Income Statement", href: "/accounts/income-statement" },
            { name: "Balance Sheet", href: "/accounts/balance-sheet" },
        ],
    },
];
