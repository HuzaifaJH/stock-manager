"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import { usePathname } from "next/navigation";
import Loader from "./loader";
import { Toaster } from "react-hot-toast";

export default function LayoutProvider({ children }: { children: React.ReactNode }) {

    const pathname = usePathname();
    const [loading, setLoading] = useState(false);

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);
    const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, [pathname]);

    return (
        <div className="flex flex-col">
            <Navbar toggleSidebar={toggleSidebar} toggleMobileMenu={toggleMobileMenu} isSidebarExpanded={isSidebarExpanded} isMobileOpen={isMobileOpen} />
            <div className="flex flex-1">
                <Sidebar isExpanded={isSidebarExpanded} isMobileOpen={isMobileOpen} setIsMobileOpen={() => setIsMobileOpen(false)} />
                <main className="flex-1 p-6">
                    <Toaster />
                    {loading && <Loader />}
                    {children}</main>
            </div>
        </div>
    );
}
