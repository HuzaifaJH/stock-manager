"use client";

import { useEffect, useState } from "react";
import { FiSun, FiMoon, FiMenu, FiX } from "react-icons/fi";

interface NavbarProps {
    toggleSidebar: () => void;
    toggleMobileMenu: () => void;
    isSidebarExpanded: boolean;
    isMobileOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, toggleMobileMenu, isSidebarExpanded, isMobileOpen }) => {
    // const { theme, toggleTheme } = useTheme();
    const [theme, setTheme] = useState<string>(() => {
        return localStorage.getItem("theme") || "forest";
    });

    useEffect(() => {
        require("theme-change");
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === "forest" ? "cupcake" : "forest";
        setTheme(newTheme);
    };

    const isExpanded = isSidebarExpanded || isMobileOpen;

    return (
        <nav className="flex items-center justify-between px-4 py-4 bg-base-100 shadow-md border-b border-gray-300 forest:border-gray-700">
            {/* Left Section: Sidebar Toggle + Dashboard Heading */}
            <div className="flex items-center gap-4">
                {/* Sidebar Toggle Button (Mobile) */}
                <button
                    className="md:hidden p-2 rounded-full bg-gray-200 forest:bg-gray-700 hover:bg-gray-300 forest:hover:bg-gray-600 transition"
                    onClick={toggleMobileMenu}
                >
                    {isExpanded ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>

                {/* Sidebar Toggle Button (Desktop) */}
                <div
                    className="hidden md:block p-2 cursor-pointer rounded-md"
                    onClick={toggleSidebar}
                >
                    {isExpanded ? <FiX size={20} /> : <FiMenu size={20} />}
                </div>

                {/* Dashboard Title */}
                <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>

            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-200 forest:bg-gray-700 hover:bg-gray-300 forest:hover:bg-gray-600 transition"
            >
                {theme === "forest" ? <FiSun size={20} className="text-yellow-500" /> : <FiMoon size={20} className="text-blue-500" />}
            </button>
        </nav>
    );
};

export default Navbar;
