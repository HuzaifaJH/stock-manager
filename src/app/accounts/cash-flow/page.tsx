"use client";
import { formatPKR } from "@/app/utils/amountFormatter";
import { LedgerEntries } from "@/app/utils/interfaces";
import { useEffect, useState } from "react";

export default function CashFlowStatement() {
    // const [entries, setEntries] = useState([]);
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (date: Date) => date.toLocaleDateString("en-CA");

    const [filters, setFilters] = useState({
        dateFrom: formatDate(firstDayOfMonth),
        dateTo: formatDate(today), accountId: "", type: ""
    });

    const [totals, setTotals] = useState({
        operatingIn: 0,
        operatingOut: 0,
        investingIn: 0,
        investingOut: 0,
        financingIn: 0,
        financingOut: 0,
    });

    useEffect(() => {
        const query = new URLSearchParams(filters).toString();

        fetch(`/api/journal-entries?${query}`)
            .then((res) => res.json())
            .then((data) => { calculateCashFlows(data) });
    }, [filters]);

    const calculateCashFlows = (data: LedgerEntries[]) => {
        const cashFlows = {
            operatingIn: 0,
            operatingOut: 0,
            investingIn: 0,
            investingOut: 0,
            financingIn: 0,
            financingOut: 0,
        };

        data.forEach((entry: LedgerEntries) => {
            const type = entry.type; // Debit or Credit
            const amount = Number(entry.amount);
            const acctType = entry.LedgerAccount?.AccountGroup?.accountType;

            if (!acctType) return;

            // Operating = Income or Expense
            if (acctType === 4 || acctType === 5) {
                if (acctType === 4 && type === "Credit") cashFlows.operatingIn += amount;
                else if (acctType === 5 && type === "Debit") cashFlows.operatingOut += amount;
            }

            // Investing = Asset
            else if (acctType === 1) {
                if (type === "Credit") cashFlows.investingIn += amount;
                else if (type === "Debit") cashFlows.investingOut += amount;
            }

            // Financing = Liability or Equity
            else if (acctType === 2 || acctType === 3) {
                if (type === "Credit") cashFlows.financingIn += amount;
                else if (type === "Debit") cashFlows.financingOut += amount;
            }
        });

        setTotals(cashFlows);
    };

    const netOperating =
        totals.operatingIn - totals.operatingOut;
    const netInvesting =
        totals.investingIn - totals.investingOut;
    const netFinancing =
        totals.financingIn - totals.financingOut;
    const netCashFlow =
        netOperating + netInvesting + netFinancing;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Cash Flow Statement</h1>

            <div className="flex gap-4 mb-6">
                <input
                    type="date"
                    className="input input-bordered"
                    value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} max={formatDate(new Date())}
                />
                <input
                    type="date"
                    className="input input-bordered"
                    value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} max={formatDate(new Date())}
                />
            </div>

            <div className="border rounded-lg p-4 shadow bg-base-100">
                <h2 className="text-lg font-semibold mb-2">Operating Activities</h2>
                <div className="flex justify-between">
                    <p>Cash Inflows from Operating Activities</p>
                    <p>{formatPKR(totals.operatingIn)} Rs</p>
                </div>
                <div className="flex justify-between">
                    <p>Cash Outflows from Operating Activities</p>
                    <p>({formatPKR(totals.operatingOut)}) Rs</p>
                </div>
                <div className="flex justify-between font-bold border-t mt-2 pt-2">
                    <p>Net Cash from Operating Activities</p>
                    <p>{formatPKR(netOperating)} Rs</p>
                </div>

                <h2 className="text-lg font-semibold mt-6 mb-2">Investing Activities</h2>
                <div className="flex justify-between">
                    <p>Cash Inflows from Investing Activities</p>
                    <p>{formatPKR(totals.investingIn)} Rs</p>
                </div>
                <div className="flex justify-between">
                    <p>Cash Outflows from Investing Activities</p>
                    <p>({formatPKR(totals.investingOut)}) Rs</p>
                </div>
                <div className="flex justify-between font-bold border-t mt-2 pt-2">
                    <p>Net Cash from Investing Activities</p>
                    <p>{formatPKR(netInvesting)} Rs</p>
                </div>

                <h2 className="text-lg font-semibold mt-6 mb-2">Financing Activities</h2>
                <div className="flex justify-between">
                    <p>Cash Inflows from Financing Activities</p>
                    <p>{formatPKR(totals.financingIn)} Rs</p>
                </div>
                <div className="flex justify-between">
                    <p>Cash Outflows from Financing Activities</p>
                    <p>({formatPKR(totals.financingOut)}) Rs</p>
                </div>
                <div className="flex justify-between font-bold border-t mt-2 pt-2">
                    <p>Net Cash from Financing Activities</p>
                    <p>{formatPKR(netFinancing)} Rs</p>
                </div>

                <div className="flex justify-between text-xl font-bold mt-6 pt-4 border-t">
                    <p>Total Net Cash Flow</p>
                    <p>{formatPKR(netCashFlow)} Rs</p>
                </div>
            </div>
        </div>
    );
}