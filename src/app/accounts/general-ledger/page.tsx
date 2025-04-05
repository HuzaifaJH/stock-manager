"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function GeneralLedger() {
    const [ledgerEntries, setLedgerEntries] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", accountId: "", type: "" });

    useEffect(() => {
        fetchAccounts();
        fetchLedgerEntries();
    }, [filters]);

    const fetchAccounts = async () => {
        const response = await axios.get("/api/accounts");
        setAccounts(response.data);
    };

    const fetchLedgerEntries = async () => {
        const response = await axios.get("/api/ledger", { params: filters });
        setLedgerEntries(response.data);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">General Ledger</h1>
            <div className="flex gap-4 mb-4">
                <input type="date" className="input input-bordered" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
                <input type="date" className="input input-bordered" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
                <select className="select select-bordered" value={filters.accountId} onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}>
                    <option value="">All Accounts</option>
                    {accounts.map((account: any) => (
                        <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                </select>
                <select className="select select-bordered" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                    <option value="">All Types</option>
                    <option value="Debit">Debit</option>
                    <option value="Credit">Credit</option>
                </select>
            </div>
            <table className="table w-full border">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Account</th>
                        <th>Description</th>
                        <th>Debit</th>
                        <th>Credit</th>
                    </tr>
                </thead>
                <tbody>
                    {ledgerEntries.map((entry: any) => (
                        <tr key={entry.id}>
                            <td>{new Date(entry.createdAt).toLocaleDateString("en-GB")}</td>
                            <td>{entry.Account.name}</td>
                            <td>{entry.description}</td>
                            <td>{entry.type === "Debit" ? entry.amount : "-"}</td>
                            <td>{entry.type === "Credit" ? entry.amount : "-"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
