"use client";
import { useEffect, useState } from "react";
import { accountTypes } from "@/app/utils/accountType";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { LedgerAccount, LedgerEntries } from '@/app/utils/interfaces';

export default function TrialBalancePage() {

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (date: Date) => date.toLocaleDateString("en-CA");

    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntries[]>([]);
    const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([]);
    const [filters, setFilters] = useState({
        dateFrom: formatDate(firstDayOfMonth),
        dateTo: formatDate(today),
        accountId: "",
        accountType: ""
    });

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        const query = new URLSearchParams(filters).toString();

        const [entriesRes, accountsRes] = await Promise.all([
            fetch(`/api/journal-entries?${query}`),
            fetch("/api/ledger-accounts"),
        ]);

        const entries = await entriesRes.json();
        const accounts = await accountsRes.json();
        setLedgerEntries(entries);
        setLedgerAccounts(accounts);
    };

    const filteredAccounts = ledgerAccounts.filter((acc) => {
        if (!filters.accountType) return true;
        return acc.AccountGroup?.accountType === Number(filters.accountType);
    });

    // const filteredEntries = ledgerEntries.filter((entry) => {
    //     const entryDate = new Date(entry.createdAt);
    //     const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
    //     const to = filters.dateTo ? new Date(filters.dateTo) : null;

    //     return (
    //         (!from || entryDate >= from) &&
    //         (!to || entryDate <= to)
    //     );
    // });

    const trialBalance = filteredAccounts.map((account) => {
        const entries = ledgerEntries.filter(e => e.ledgerId === account.id);
        const debit = entries.filter(e => e.type === 'Debit').reduce((sum, e) => sum + Number(e.amount), 0);
        const credit = entries.filter(e => e.type === 'Credit').reduce((sum, e) => sum + Number(e.amount), 0);
        const balance = debit - credit;

        return {
            name: account.name,
            accountType: account.AccountGroup?.accountType,
            debit: balance > 0 ? balance : 0,
            credit: balance < 0 ? Math.abs(balance) : 0,
        };
    });

    const totalDebit = trialBalance.reduce((sum, a) => sum + a.debit, 0);
    const totalCredit = trialBalance.reduce((sum, a) => sum + a.credit, 0);
    const isBalanced = totalDebit.toFixed(2) === totalCredit.toFixed(2);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Trial Balance</h2>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
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
                    onChange={(e) => setFilters({ ...filters, accountType: e.target.value })}
                >
                    <option value="">All Account Types</option>
                    {accountTypes.map((type) => (
                        <option key={type.code} value={type.code}>{type.account}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead>
                        <tr className="bg-base-200">
                            <th>Account Name</th>
                            <th>Debit</th>
                            <th>Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trialBalance.map((row, idx) => (
                            <tr key={idx}>
                                <td>{row.name}</td>
                                <td>{row.debit ? row.debit.toFixed(2) : "-"}</td>
                                <td>{row.credit ? row.credit.toFixed(2) : "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold bg-base-200">
                            <td>Total</td>
                            <td>{totalDebit.toFixed(2)}</td>
                            <td>{totalCredit.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Balance check */}
            <div className="mt-4 text-right">
                {isBalanced ? (
                    <p className="text-success font-semibold flex items-center justify-end gap-2">
                        <FaCheckCircle className="text-success" /> Trial Balance is Balanced
                    </p>
                ) : (
                    <p className="text-error font-semibold flex items-center justify-end gap-2">
                        <FaTimesCircle className="text-error" /> Trial Balance is Not Balanced
                    </p>
                )}
            </div>
        </div>
    );
}