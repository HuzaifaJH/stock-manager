"use client";

import { useEffect, useState } from "react";

type LedgerEntries = {
    id: number;
    amount: number;
    type: "Debit" | "Credit";
    createdAt: string;
    ledgerId: number;
    LedgerAccount: {
        id: number;
        name: string;
        AccountGroup: {
            id: number;
            name: string;
            accountType: number; // 4 = Income, 5 = Expense
        };
    };
};

const accountTypes = [
    { code: 4, account: "Income" },
    { code: 5, account: "Expense" },
];

export default function IncomeStatement() {

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (date: Date) => date.toLocaleDateString("en-CA");

    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntries[]>([]);
    const [filters, setFilters] = useState({
        dateFrom: formatDate(firstDayOfMonth),
        dateTo: formatDate(today),
        accountId: "",
        accountType: ""
    });

    useEffect(() => {
        const query = new URLSearchParams(filters).toString();

        fetch(`/api/journal-entries?${query}`)
            .then((res) => res.json())
            .then((data) => setLedgerEntries(data));
    }, [filters]);

    const filteredEntries = ledgerEntries.filter((entry) => {
        // const entryDate = new Date(entry.createdAt);
        // const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
        // const to = filters.dateTo ? new Date(filters.dateTo) : null;

        // const isWithinDate =
        //     (!from || entryDate >= from) && (!to || entryDate <= to);

        const isCorrectType =
            filters.accountType === "" ||
            entry.LedgerAccount.AccountGroup.accountType.toString() === filters.accountType;

        return isCorrectType;
    });

    const grouped: {
        [accountName: string]: {
            type: number;
            debit: number;
            credit: number;
        };
    } = {};

    filteredEntries.forEach((entry) => {
        const { name } = entry.LedgerAccount;
        const accountType = entry.LedgerAccount.AccountGroup.accountType;

        if (!grouped[name]) {
            grouped[name] = { type: accountType, debit: 0, credit: 0 };
        }

        if (entry.type === "Debit") {
            grouped[name].debit += +entry.amount;
        } else {
            grouped[name].credit += +entry.amount;
        }
    });

    const incomeAccounts = Object.entries(grouped).filter(
        ([_, data]) => data.type === 4
    );
    const expenseAccounts = Object.entries(grouped).filter(
        ([_, data]) => data.type === 5
    );

    const totalIncome = incomeAccounts.reduce(
        (sum, [_, data]) => sum + (data.credit - data.debit),
        0
    );
    const totalExpense = expenseAccounts.reduce(
        (sum, [_, data]) => sum + (data.debit - data.credit),
        0
    );

    const netProfit = totalIncome - totalExpense;

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Income Statement</h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <input
                    type="date"
                    className="input input-bordered"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    max={formatDate(new Date())}
                />
                <input
                    type="date"
                    className="input input-bordered"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    max={formatDate(new Date())}
                />
                <select
                    className="select select-bordered"
                    value={filters.accountType}
                    onChange={(e) =>
                        setFilters({ ...filters, accountType: e.target.value })
                    }
                >
                    <option value="">All</option>
                    {accountTypes.map((type) => (
                        <option key={type.code} value={type.code}>
                            {type.account}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* Income Table */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Income</h3>
                    <table className="table w-full border">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th className="text-right">Amount (Rs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {incomeAccounts.map(([name, data]) => (
                                <tr key={name}>
                                    <td>{name}</td>
                                    <td className="text-right">
                                        {(data.credit - data.debit).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="font-bold bg-base-200">
                                <td>Total Income</td>
                                <td className="text-right">{totalIncome.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Expense Table */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Expenses</h3>
                    <table className="table w-full border">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th className="text-right">Amount (Rs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenseAccounts.map(([name, data]) => (
                                <tr key={name}>
                                    <td>{name}</td>
                                    <td className="text-right">
                                        {(data.debit - data.credit).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="font-bold bg-base-200">
                                <td>Total Expense</td>
                                <td className="text-right">{totalExpense.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Net Profit/Loss */}
            <div className="mt-8 text-xl font-bold text-right">
                Net {netProfit >= 0 ? "Profit" : "Loss"}:{" "}
                {Math.abs(netProfit).toFixed(2)} Rs
            </div>
        </div>
    );
}