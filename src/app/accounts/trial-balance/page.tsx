"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function TrialBalance() {
    const [trialBalance, setTrialBalance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const fetchTrialBalance = async () => {
            try {
                const response = await axios.get("/api/trial-balance");
                setTrialBalance(response.data);
            } catch (err) {
                setError("Failed to load trial balance");
            } finally {
                setLoading(false);
            }
        };
        fetchTrialBalance();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    const totalDebit = trialBalance.reduce((sum, acc:any) => sum + acc.totalDebit, 0);
    const totalCredit = trialBalance.reduce((sum, acc:any) => sum + acc.totalCredit, 0);

    return (
        <div className="overflow-x-auto p-4">
            <h2 className="text-xl font-bold mb-4">Trial Balance</h2>
            <table className="table w-full border">
                <thead>
                    <tr>
                        <th className="border p-2">Account Name</th>
                        <th className="border p-2">Total Debit</th>
                        <th className="border p-2">Total Credit</th>
                    </tr>
                </thead>
                <tbody>
                    {trialBalance.map((account:any) => (
                        <tr key={account.accountId}>
                            <td className="border p-2">{account.accountName}</td>
                            <td className="border p-2">{account.totalDebit.toFixed(2)}</td>
                            <td className="border p-2">{account.totalCredit.toFixed(2)}</td>
                        </tr>
                    ))}
                    <tr className="font-bold">
                        <td className="border p-2">Total</td>
                        <td className="border p-2">{totalDebit.toFixed(2)}</td>
                        <td className="border p-2">{totalCredit.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
            {totalDebit !== totalCredit && (
                <p className="text-red-500 mt-2">Trial Balance is not balanced!</p>
            )}
        </div>
    );
};