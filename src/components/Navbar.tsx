"use client";

import { useTheme } from "@/context/ThemeContext";
import { FiSun, FiMoon, FiMenu, FiX } from "react-icons/fi";

interface NavbarProps {
    toggleSidebar: () => void;
    toggleMobileMenu: () => void;
    isSidebarExpanded: boolean;
    isMobileOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, toggleMobileMenu, isSidebarExpanded, isMobileOpen }) => {
    const { theme, toggleTheme } = useTheme();

    const isExpanded = isSidebarExpanded || isMobileOpen;

    return (
        <nav className="flex items-center justify-between px-4 py-4 bg-gray-800 text-white">
            {/* Left Section: Sidebar Toggle + Dashboard Heading */}
            <div className="flex items-center gap-4">
                {/* Sidebar Toggle Button (Mobile) */}
                <button className="md:hidden p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition" onClick={toggleMobileMenu}>
                    {isExpanded ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>

                {/* Sidebar Toggle Button (Desktop) */}
                <div className="hidden md:block p-2 rounded-full cursor-pointer bg-gray-800 hover:bg-gray-700" onClick={toggleSidebar}>
                    {isExpanded ? <FiX size={20} /> : <FiMenu size={20} />}
                </div>

                {/* Dashboard Title */}
                <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>

            {/* Right Section: Theme Toggle */}
            <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition">
                {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
        </nav>
    );
};

export default Navbar;
