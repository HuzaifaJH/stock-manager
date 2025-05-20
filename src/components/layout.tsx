"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { usePathname } from "next/navigation";
import Loader from "../app/utils/loader";
import { Toaster } from "react-hot-toast";
import { useLock } from "@/components/lock-context";

export default function LayoutProvider({ children }: { children: React.ReactNode }) {

    const pathname = usePathname();
    const [loading, setLoading] = useState(false);

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);
    const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);

    // const [isLocked, setIsLocked] = useState(false);
    const [isPinModalVisible, setIsPinModalVisible] = useState(false);
    const [enteredPin, setEnteredPin] = useState("");
    const pinInputRef = useRef<HTMLInputElement>(null);
    const { isLocked, setIsLocked } = useLock();

    const handleLockToggle = () => {
        if (isLocked) {
            setIsPinModalVisible(true);
        } else {
            setIsLocked(true);
        }
    };

    const handlePinSubmit = () => {
        if (enteredPin === "5253") {
            setIsLocked(false);
            setIsPinModalVisible(false);
            setEnteredPin("");
        } else {
            alert("Incorrect PIN");
            setEnteredPin("");
        }
    };

    useEffect(() => {
        if (isPinModalVisible && pinInputRef.current) {
            pinInputRef.current.focus();
        }
    }, [isPinModalVisible]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, [pathname]);

    return (
        <>
            <div className="flex flex-col min-h-screen">
                <Navbar toggleSidebar={toggleSidebar} toggleMobileMenu={toggleMobileMenu} isSidebarExpanded={isSidebarExpanded} isMobileOpen={isMobileOpen}
                    isLocked={isLocked} onLockToggle={handleLockToggle} />
                <div className="flex flex-1">
                    <Sidebar isExpanded={isSidebarExpanded} isMobileOpen={isMobileOpen} setIsMobileOpen={() => setIsMobileOpen(false)}
                        isLocked={isLocked} />
                    <main className="flex-1 p-6 pt-20 overflow-y-auto h-screen">
                        <Toaster />
                        {loading && <Loader />}
                        {children}</main>
                </div>
            </div>
            {
                isPinModalVisible && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handlePinSubmit();
                            }}
                            className="bg-white p-6 rounded-xl w-80 shadow-lg"
                        >
                            <h2 className="text-lg font-semibold mb-4">Enter 4-Digit PIN</h2>
                            <input
                                type="password"
                                maxLength={4}
                                value={enteredPin}
                                onChange={(e) => setEnteredPin(e.target.value)}
                                ref={pinInputRef}
                                className="input input-bordered w-full mb-4"
                                placeholder="Enter PIN"
                            />
                            <div className="flex justify-between">
                                <button type="submit" className="btn btn-primary">Submit</button>
                                <button type="button" className="btn btn-ghost" onClick={() => setIsPinModalVisible(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )
            }
        </>
    );
}
