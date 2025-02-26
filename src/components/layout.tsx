"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function LayoutProvider({ children }: { children: React.ReactNode }) {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);
    const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);

    return (
        <div className="flex flex-col h-screen">
            <Navbar toggleSidebar={toggleSidebar} toggleMobileMenu={toggleMobileMenu} isSidebarExpanded={isSidebarExpanded} isMobileOpen={isMobileOpen} />
            <div className="flex flex-1">
                <Sidebar isExpanded={isSidebarExpanded} isMobileOpen={isMobileOpen} setIsMobileOpen={() => setIsMobileOpen(false)} />
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
