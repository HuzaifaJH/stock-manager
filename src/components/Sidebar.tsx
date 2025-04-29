"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FiCornerRightDown, FiMinus } from "react-icons/fi";
import { menuItems } from "../app/utils/menuItems";

interface SidebarProps {
    isExpanded: boolean;
    isMobileOpen: boolean;
    setIsMobileOpen: Dispatch<SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, isMobileOpen, setIsMobileOpen }) => {
    const pathname = usePathname();
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    const shouldExpand = isExpanded || isHovered;

    const toggleMenu = (menuName: string) => {
        setExpandedMenu((prev) => (prev === menuName ? null : menuName));
    };

    useEffect(() => { if (!isExpanded) setExpandedMenu(null); }, [isExpanded]);

    return (
        <>
            {/* Sidebar */}
            <div
                className={`fixed md:relative transition-all duration-300 h-screen z-40 
    bg-base-200 shadow-md border-r border-gray-300 dark:border-gray-700 
    ${isMobileOpen ? "left-0 w-60" : "left-[-100%] md:left-0"} 
    ${shouldExpand ? "w-60" : "w-16"} md:block`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => { if (!isExpanded) setExpandedMenu(null); setIsHovered(false); }}
            >
                {/* Menu Items */}
                <nav className="mt-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || item.subItems?.some(subItem => subItem.href === pathname);
                        const isMenuExpanded = expandedMenu === item.name;

                        return (
                            <div key={item.name}>
                                {/* Parent Menu Item */}
                                <div
                                    className={`flex items-center justify-between gap-4 px-6 py-3 transition-colors duration-200 
                ${isActive ? "bg-primary text-white" : "hover:bg-gray-600 hover:bg-opacity-20"}
                cursor-pointer`}
                                    onClick={() => item.subItems ? toggleMenu(item.name) : setIsMobileOpen(false)}
                                >
                                    {!item.subItems ? (
                                        <Link href={item.href ?? "#"} className="w-full flex items-center gap-4">
                                            <span className="text-xl">{item.icon}</span>
                                            {(shouldExpand || isMobileOpen) && <span className="text-sm">{item.name}</span>}
                                        </Link>
                                    ) : (
                                        <div className="w-full flex items-center gap-4">
                                            <span className="text-xl">{item.icon}</span>
                                            {(shouldExpand || isMobileOpen) && <span className="text-sm">{item.name}</span>}
                                        </div>
                                    )}
                                    {/* Arrow Indicator for Parent Items */}
                                    {item.subItems && (shouldExpand || isMobileOpen) && (
                                        <span
                                            className={`transition-transform duration-300 ${isMenuExpanded ? "rotate-180" : "rotate-0"
                                                }`}
                                        >
                                            <FiCornerRightDown />
                                        </span>
                                    )}
                                </div>

                                {/* Submenu Items */}
                                {isMenuExpanded && item.subItems && (
                                    <div className="pl-10">
                                        {item.subItems.map((subItem) => (
                                            <Link
                                                key={subItem.name}
                                                href={subItem.href ?? "#"}
                                                className={`flex items-center gap-4 px-4 py-2 transition-colors duration-200 
                    ${pathname === subItem.href ? "bg-gray-400 text-white" : "hover:bg-gray-600 hover:bg-opacity-20"}
                    `}
                                                onClick={() => setIsMobileOpen(false)}
                                            >
                                                <span className="text-lg"><FiMinus /></span>
                                                <span className="text-sm">{subItem.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </>
    );
};

export default Sidebar;