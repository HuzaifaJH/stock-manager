import { JSX } from "react";
import { FiHome, FiCopy, FiCreditCard, FiPieChart, FiUsers, FiBox, FiBook, FiSettings, FiDollarSign, FiLayers, FiCornerDownLeft, FiCornerUpLeft } from "react-icons/fi";
import { GiExpense } from "react-icons/gi";

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
    },
    {
        name: "Categories",
        icon: <FiCopy />,
        href: "/POS/categories",
    },
    {
        name: "Sub Categories",
        icon: <FiLayers />,
        href: "/POS/sub-categories",
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
        href: "/POS/sales-returns",
        icon: <FiCornerUpLeft />
    },
    {
        name: "Purchases",
        href: "/POS/purchases",
        icon: <FiCreditCard />,
    },
    {
        name: "Purchase Return",
        href: "/POS/purchase-returns",
        icon: <FiCornerDownLeft />
    },
    {
        name: "Expenses",
        href: "/POS/expenses",
        icon: <GiExpense />
    },
    {
        name: "Transactions",
        href: "/accounts/transactions",
        icon: <FiDollarSign />
    },
    {
        name: "Settings", icon: <FiSettings />, subItems: [
            { name: "Account Groups", href: "/settings/account-groups" },
            { name: "Ledger Accounts", href: "/settings/ledger-accounts" }
        ]
    },
    {
        name: "Financials",
        icon: <FiBook />,
        subItems: [
            { name: "Journal Entries", href: "/accounts/journal-entries" },
            { name: "Trial Balance", href: "/accounts/trial-balance" },
            { name: "Income Statement", href: "/accounts/income-statement" },
            { name: "Balance Sheet", href: "/accounts/balance-sheet" },
            { name: "Cash Flow", href: "/accounts/cash-flow" },
        ],
    },
];
