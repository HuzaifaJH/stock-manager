"use client"
import React, { createContext, useContext, useState, PropsWithChildren } from "react";

interface LockContextType {
    isLocked: boolean;
    setIsLocked: React.Dispatch<React.SetStateAction<boolean>>;
}

const LockContext = createContext<LockContextType | undefined>(undefined);

export const LockProvider = ({ children }: PropsWithChildren) => {
    const [isLocked, setIsLocked] = useState(true);

    return (
        <LockContext.Provider value={{ isLocked, setIsLocked }}>
            {children}
        </LockContext.Provider>
    );
};

export const useLock = () => {
    const context = useContext(LockContext);
    if (!context) {
        throw new Error("useLock must be used within a LockProvider");
    }
    return context;
};
