"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { LedgerEntries, LedgerAccount } from '@/app/utils/interfaces';
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";

export default function JournalEntries() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (date: Date) => date.toLocaleDateString("en-CA");

    const [ledgerEntries, setLedgerEntries] = useState([]);
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
    const [filters, setFilters] = useState({
        dateFrom: formatDate(firstDayOfMonth),
        dateTo: formatDate(today)
    });
    const [accountFilter, setAccountFilter] = useState<number | "">("");
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    // Memoize fetchAccounts with useCallback
    const fetchAccounts = useCallback(async () => {
        try {
            const response = await axios.get("/api/ledger-accounts");
            setAccounts(response.data);
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    }, []); // Empty dependency array means this function will not change unless explicitly needed

    // Memoize fetchLedgerEntries with useCallback, dependent on filters
    const fetchLedgerEntries = useCallback(async () => {
        try {
            const response = await axios.get("/api/journal-entries", { params: filters });
            setLedgerEntries(response.data);
        } catch (error) {
            console.error("Error fetching ledger entries:", error);
        }
    }, [filters]); // Fetch ledger entries whenever filters change

    // UseEffect to call both fetch functions when filters change
    useEffect(() => {
        fetchAccounts();
        fetchLedgerEntries();
    }, [filters, fetchAccounts, fetchLedgerEntries]);  // Include functions in dependency array

    const groupedEntries = ledgerEntries.reduce<Record<string, LedgerEntries[]>>((acc, entry: LedgerEntries) => {
        const refId = entry.Transaction?.referenceId || "No Ref";
        if (!acc[refId]) acc[refId] = [];
        acc[refId].push(entry);
        return acc;
    }, {});

    return (
        <div id="print-area" className="p-4">
            <h1 className="text-2xl font-bold mb-4">Journal Entries</h1>
            <div className="flex gap-4 mb-4">
                <input type="date" className="input input-bordered" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} max={formatDate(new Date())} />
                <input type="date" className="input input-bordered" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} max={formatDate(new Date())} />
                <select className="select select-bordered" value={accountFilter ?? ""} onChange={(e) => setAccountFilter(Number(e.target.value))}>
                    <option value="">All Accounts</option>
                    {accounts.map((account: LedgerAccount) => (
                        <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                </select>
            </div>
            <div id="journal-entries-content" className="print:bg-white bg-base-100 p-4">
                <table id="journal-table" className="table w-full border-spacing-0 border">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Account</th>
                            <th>Description</th>
                            <th>Debit</th>
                            <th>Credit</th>
                            {accountFilter != "" && <th>Counter Account</th>}
                            {accountFilter != "" && <th>Balance</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {(Object.entries(groupedEntries) as [string, LedgerEntries[]][]).filter(([, entries]) => !accountFilter || entries.some(e => e.ledgerId === accountFilter)).flatMap(([referenceId, entries]) => {

                            const isExpanded = expandedGroups[referenceId] ?? true;
                            const toggleGroup = () =>
                                setExpandedGroups((prev) => ({ ...prev, [referenceId]: !isExpanded }));

                            const headerRow = (
                                <tr key={`header-${referenceId}`} className="bg-base-200 cursor-pointer" onClick={toggleGroup}>
                                    <td colSpan={accountFilter ? 6 : 5} className="flex items-center gap-2">
                                        {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                                        Ref: {referenceId} |{" "}
                                        {/* {new Date(entries[0].Transaction?.date || entries[0].createdAt).toLocaleDateString("en-GB")}| */}
                                        Total:{" "} {entries[0].Transaction?.totalAmount || "N/A"} Rs
                                    </td>
                                </tr>
                            );

                            const entryRows = isExpanded
                                ? entries
                                    .filter((entry) =>
                                        !accountFilter || entry.ledgerId === accountFilter
                                    )
                                    .map((entry: LedgerEntries) => {
                                        const isDebit = entry.type === "Debit";
                                        if (entry.ledgerId === accountFilter) {
                                            runningBalance += isDebit ? +entry.amount : -entry.amount;
                                        }

                                        if (isExpanded) {
                                            if (isDebit) totalDebit += +entry.amount;
                                            else totalCredit += +entry.amount;
                                        }

                                        const counterAccount = entries
                                            .filter((e) => (e.id !== entry.id && e.type !== entry.type))
                                            .map((e) => e.LedgerAccount.name)
                                            .join(", ");

                                        return (
                                            <tr className="border-b border-base-300" key={entry.id}>
                                                <td className="td-bordered">{new Date(entry.Transaction.date).toLocaleDateString("en-GB")}</td>
                                                <td className="td-bordered">
                                                    {entry.LedgerAccount.name}
                                                    {entry?.Transaction?.purchaseDetails?.Supplier?.name
                                                        ? ` (${entry.Transaction.purchaseDetails.Supplier.name})`
                                                        : ""}
                                                </td>
                                                <td className="td-bordered">{entry.description}</td>
                                                <td className="td-bordered">{isDebit ? entry.amount : "-"}</td>
                                                <td className="td-bordered">{!isDebit ? entry.amount : "-"}</td>
                                                {accountFilter != "" && (
                                                    <td className="td-bordered">
                                                        {counterAccount || "-"}
                                                    </td>
                                                )}
                                                {accountFilter != "" && (
                                                    <td className="td-bordered">
                                                        {runningBalance >= 0 ? Math.abs(runningBalance) : "(" + Math.abs(runningBalance) + ")"}
                                                        {/* {Math.abs(runningBalance)} {runningBalance >= 0 ? "Dr" : "Cr"} */}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                : [];
                            return [headerRow, ...entryRows];
                        })}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end gap-4 mt-4 text-sm font-medium text-right">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    Debit: {totalDebit.toFixed(2)}
                </div>
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
                    Credit: {totalCredit.toFixed(2)}
                </div>
            </div>
            <div className="flex gap-3 mb-4 print:hidden">
                <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                    🖨️ Print
                </button>

                {/* <button
                    className="btn btn-outline btn-sm"
                    onClick={exportToPDF}
                >
                    📄 Export as PDF
                </button> */}

                <button
                    className="btn btn-outline btn-sm"
                    onClick={exportToExcel}
                >
                    📊 Export as Excel
                </button>
            </div>
        </div>
    );
};

const exportToExcel = () => {
    const table = document.getElementById("journal-table");
    if (!table) return;

    import("xlsx").then((xlsx) => {
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.table_to_sheet(table);
        xlsx.utils.book_append_sheet(wb, ws, "Journal Entries");
        xlsx.writeFile(wb, "journal_entries.xlsx");
    });
};

// const exportToPDF = async () => {
//     const element = document.getElementById("journal-entries-content");
//     if (!element) return;

//     const canvas = await html2canvas(element, {
//         scale: 2,
//         useCORS: true,
//     });

//     const imgData = canvas.toDataURL("image/png");
//     const pdf = new jsPDF({
//         orientation: "portrait",
//         unit: "px",
//         format: [canvas.width, canvas.height],
//     });

//     pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
//     pdf.save(`journal-entries-${new Date().toISOString().slice(0, 10)}.pdf`);
// };
