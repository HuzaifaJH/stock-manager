"use client";

import { useEffect, useState } from "react";
import { LedgerEntries } from '@/app/utils/interfaces';

const accountTypes = [
    { code: 1, account: "Asset" },
    { code: 2, account: "Liability" },
    { code: 3, account: "Equity" },
];

export default function BalanceSheet() {
    const today = new Date();
    const formatDate = (date: Date) => date.toLocaleDateString("en-CA");

    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntries[]>([]);
    const [filters, setFilters] = useState({
        dateTo: formatDate(today),
    });

    useEffect(() => {
        const query = new URLSearchParams(filters).toString();

        fetch(`/api/journal-entries?${query}`)
            .then((res) => res.json())
            .then((data) => setLedgerEntries(data));
    }, [filters]);

    // const filteredEntries = ledgerEntries.filter((entry) => {
    //     const entryDate = new Date(entry.createdAt);
    //     const to = filters.dateTo ? new Date(filters.dateTo) : null;
    //     return !to || entryDate <= to;
    // });

    const grouped: {
        [accountName: string]: {
            type: number;
            debit: number;
            credit: number;
        };
    } = {};

    ledgerEntries.forEach((entry) => {
        const name = entry.LedgerAccount.name;
        const type = entry.LedgerAccount.AccountGroup.accountType;

        if (!grouped[name]) {
            grouped[name] = { type, debit: 0, credit: 0 };
        }

        if (entry.type === "Debit") {
            grouped[name].debit += +entry.amount;
        } else {
            grouped[name].credit += +entry.amount;
        }
    });

    const assets = Object.entries(grouped).filter(([_, d]) => d.type === 1);
    const liabilities = Object.entries(grouped).filter(([_, d]) => d.type === 2);
    const equity = Object.entries(grouped).filter(([_, d]) => d.type === 3);

    const calcBalance = (debit: number, credit: number) => debit - credit;

    const totalAssets = assets.reduce((sum, [_, d]) => sum + calcBalance(d.debit, d.credit), 0);
    const totalLiabilities = liabilities.reduce((sum, [_, d]) => sum + calcBalance(d.credit, d.debit), 0);
    const totalEquity = equity.reduce((sum, [_, d]) => sum + calcBalance(d.credit, d.debit), 0);

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Balance Sheet</h2>

            {/* Filter */}
            <div className="mb-6">
                <input
                    type="date"
                    className="input input-bordered"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    max={formatDate(new Date())}
                />
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* Assets */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Assets</h3>
                    <table className="table w-full border">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th className="text-right">Amount (Rs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map(([name, data]) => (
                                <tr key={name}>
                                    <td>{name}</td>
                                    <td className="text-right">
                                        {calcBalance(data.debit, data.credit).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="font-bold bg-base-200">
                                <td>Total Assets</td>
                                <td className="text-right">{totalAssets.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Liabilities and Equity */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Liabilities</h3>
                    <table className="table w-full border mb-6">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th className="text-right">Amount (Rs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {liabilities.map(([name, data]) => (
                                <tr key={name}>
                                    <td>{name}</td>
                                    <td className="text-right">
                                        {calcBalance(data.credit, data.debit).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="font-bold bg-base-200">
                                <td>Total Liabilities</td>
                                <td className="text-right">{totalLiabilities.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3 className="text-lg font-semibold mb-2">Equity</h3>
                    <table className="table w-full border">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th className="text-right">Amount (Rs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equity.map(([name, data]) => (
                                <tr key={name}>
                                    <td>{name}</td>
                                    <td className="text-right">
                                        {calcBalance(data.credit, data.debit).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="font-bold bg-base-200">
                                <td>Total Equity</td>
                                <td className="text-right">{totalEquity.toFixed(2)}</td>
                            </tr>
                            <tr className="font-bold bg-base-300">
                                <td>Total Liabilities & Equity</td>
                                <td className="text-right">{totalLiabilitiesAndEquity.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Balance check */}
            <div className="mt-6 text-right font-semibold">
                {totalAssets === totalLiabilitiesAndEquity ? (
                    <p className="text-success">Balanced ✅</p>
                ) : (
                    <p className="text-error">
                        Not Balanced ❌ — Difference: {(totalAssets - totalLiabilitiesAndEquity).toFixed(2)} Rs
                    </p>
                )}
            </div>
        </div>
    );
}