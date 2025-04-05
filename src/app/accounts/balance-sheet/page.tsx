"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function BalanceSheet() {
    const [balanceSheet, setBalanceSheet] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchBalanceSheet();
    }, []);

    const fetchBalanceSheet = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get("/api/balance-sheet");
            setBalanceSheet(response.data);
            console.log(response.data)
        } catch (error) {
            console.error("Error fetching balance sheet:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <p>Loading...</p>;
    if (!balanceSheet) return <p>No data available</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Balance Sheet</h1>
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold">Assets</h2>
                    <ul className="mt-2 border p-4 rounded-lg">
                        {balanceSheet.assets.map((account: any) => (
                            <li key={account.id} className="flex justify-between">
                                <span>{account.name}</span>
                                <span>{account.balance}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Liabilities & Equity</h2>
                    <ul className="mt-2 border p-4 rounded-lg">
                        {balanceSheet.liabilities.map((account: any) => (
                            <li key={account.id} className="flex justify-between">
                                <span>{account.name}</span>
                                <span>{account.balance}</span>
                            </li>
                        ))}
                        {balanceSheet.equity.map((account: any) => (
                            <li key={account.id} className="flex justify-between font-bold">
                                <span>{account.name}</span>
                                <span>{account.balance}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}