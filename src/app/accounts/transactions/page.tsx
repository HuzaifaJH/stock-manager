"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEye, FiPlusCircle, FiTrash2 } from "react-icons/fi";
import { accountTypes } from "@/app/utils/accountType";
import { AccountGroup, JournalEntry, LedgerAccount, Transaction } from '@/app/utils/interfaces';

export default function TransactionsPage() {

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [viewMode, setViewMode] = useState(false);

    const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
    const [ledgerAccount, setLedgerAccount] = useState<LedgerAccount[]>([]);
    // const [transactionType, setTransactionType] = useState<string | "">("Manual Entry");

    // const fixTransactionTypes = ["Sale", "Purchase", "Sales Return", "Purchase Return"];


    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const [transactionsRes, accountGroupRes, ledgerAccountsRes] = await Promise.all([
                fetch("/api/transactions"),
                fetch("/api/account-groups"),
                fetch("/api/ledger-accounts"),
            ]);
            const [transactionsData, accountGroupData, ledgerAccountsData] = await Promise.all([
                transactionsRes.json(),
                accountGroupRes.json(),
                ledgerAccountsRes.json(),
            ]);
            setTransactions(transactionsData);
            setAccountGroups(accountGroupData);
            setLedgerAccount(ledgerAccountsData);
        } catch (error) {
            console.error("Error fetching data: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // const handleDelete = async (id: number) => {
    //     if (!confirm("Are you sure you want to delete this transaction?")) return;
    //     setIsLoading(true);
    //     try {
    //         const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    //         if (res.ok) {
    //             toast.success("Transaction deleted successfully");
    //             fetchTransactions();
    //         } else {
    //             toast.error("Failed to delete transaction");
    //         }
    //     } catch (error) {
    //         toast.error("Error deleting transaction: " + error);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const handleSort = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    const sortedTransactions = [...transactions].sort((a, b) => {
        return sortOrder === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    });

    const totalPages = Math.ceil(sortedTransactions.length / rowsPerPage) == 0 ? 1 : Math.ceil(sortedTransactions.length / rowsPerPage);
    const paginatedTransactions = sortedTransactions.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const addItem = () => {
        setJournalEntries([...journalEntries, { ledgerId: "", description: null, amount: null, type: "", accountType: "", accountGroup: "" }]);
    };

    const updateItem = (index: number, field: keyof JournalEntry, value: string | number | null) => {
        const newItems = [...journalEntries];

        newItems[index][field] = value as never;
        // if (field === "description" || field === "amount") {
        //     newItems[index][field] = value;
        // } else if ((field === "accountId" || field === "type") && value !== null) {
        //     newItems[index][field] = value;
        // }

        setJournalEntries(newItems);
    };

    const removeItem = (index: number) => {
        setJournalEntries(journalEntries.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target as HTMLFormElement);
        const transactionData = {
            date: formData.get("date"),
            type: "Manual Entry",
            // referenceId: formData.get("referenceId"),
            totalAmount: selectedTransaction?.totalAmount,
            journalEntries: journalEntries,
        };
        if (journalEntries.length === 0) {
            toast.error("Please add journal Entries.");
            return;
        }
        try {
            const res = await fetch(
                selectedTransaction?.id ? `/api/transactions/${selectedTransaction.id}` : "/api/transactions",
                {
                    method: selectedTransaction?.id ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(transactionData),
                });
            if (res.ok) {
                toast.success(`Purchase ${selectedTransaction?.id ? "updated" : "added"} successfully`);
                setJournalEntries([]);
                // setTransactionType("");
                setSelectedTransaction(null);
                fetchTransactions();
            } else {
                toast.error(`Failed to ${selectedTransaction?.id ? "update" : "add"} transaction`);
            }
        } catch (error) {
            console.error("Error adding transaction:", error);
            toast.error("Error adding transaction");
        } finally {
            setIsLoading(false);
        }
    };

    // Memoize calculateTotalAmount with useCallback
    const calculateTotalAmount = useCallback(() => {
        const totalDebit = journalEntries
            .filter(entry => entry.type === "Debit")
            .reduce((sum, entry) => sum + (entry.amount || 0), 0);

        const totalCredit = journalEntries
            .filter(entry => entry.type === "Credit")
            .reduce((sum, entry) => sum + (entry.amount || 0), 0);

        return totalDebit === totalCredit ? totalDebit : null;
    }, [journalEntries]); // Recalculate only when journalEntries change

    useEffect(() => {
        const newTotal = calculateTotalAmount();
        setSelectedTransaction(prev => prev ? { ...prev, totalAmount: newTotal ?? null } : prev);
    }, [journalEntries, calculateTotalAmount]); // Re-run effect when journalEntries or calculateTotalAmount change


    const handleAccountTypeChange = (index: number, accountType: number) => {
        const newItems = [...journalEntries];

        newItems[index].accountType = accountType;
        newItems[index].accountGroup = "";
        newItems[index].ledgerId = "";
        newItems[index].filteredAccountGroups = accountGroups.filter(ag => ag.accountType === accountType);
        newItems[index].filteredLedgerAccount = [];

        setJournalEntries(newItems);
    };

    const handleAccountGroupChange = (index: number, accountGroup: number) => {
        const newItems = [...journalEntries];

        newItems[index].accountGroup = accountGroup;
        newItems[index].ledgerId = "";
        newItems[index].filteredLedgerAccount = ledgerAccount.filter(p => p.accountGroup === accountGroup);

        setJournalEntries(newItems);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Transactions</h2>
                <button className="btn btn-primary" onClick={() => setSelectedTransaction({ id: 0, type: "", referenceId: null, totalAmount: null, date: new Date().toISOString().split("T")[0] })}>
                    Add Transaction
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Type</th>
                            <th className="cursor-pointer" onClick={handleSort}>
                                Date {sortOrder === "asc" ? "↑" : "↓"}
                            </th>
                            <th>Reference ID</th>
                            <th>Total Amount (Rs)</th>
                            <th>View Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTransactions.map((transaction, index) => (
                            <tr key={transaction.id}>
                                <td>{index + 1}</td>
                                <td>{transaction.type}</td>
                                <td>{new Date(transaction.date).toLocaleDateString("en-GB")}</td>
                                <td>{transaction.referenceId}</td>
                                <td>{transaction.totalAmount}</td>
                                <td className="flex items-center space-x-2">
                                    <FiEye
                                        className="text-blue-500 cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => {
                                            setSelectedTransaction(transaction);
                                            setViewMode(true);
                                            setJournalEntries(transaction.JournalEntries || []);
                                            // setTransactionType(transaction.type);
                                        }}
                                    />
                                    {/* {!fixTransactionTypes.includes(transaction.type) && (
                                        <>
                                            <FiEdit
                                                className="text-warning cursor-pointer mx-1"
                                                size={18}
                                                onClick={() => {
                                                    setSelectedTransaction(transaction);
                                                    setViewMode(false);

                                                    const enrichedItems = transaction.JournalEntries?.map((item) => {
                                                        const itemFilteredgroupAccounts = accountGroups.filter(
                                                            (ag) => ag.accountType === item.accountType
                                                        );

                                                        const itemFilteredLedgerAccount = ledgerAccount.filter(
                                                            (la) => la.accountGroup === item.accountGroup
                                                        );

                                                        return {
                                                            ...item,
                                                            filteredAccountGroups: itemFilteredgroupAccounts,
                                                            filteredLedgerAccount: itemFilteredLedgerAccount,
                                                        };
                                                    });

                                                    setJournalEntries(enrichedItems || []);
                                                    // setTransactionType(transaction.type);
                                                }
                                                }
                                            />
                                            <FiTrash2
                                                className="text-error cursor-pointer mx-1"
                                                size={18}
                                                onClick={() => handleDelete(transaction.id)}
                                            />
                                        </>
                                    )} */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center">
                        <span className="mr-2">Items per page:</span>
                        <select
                            className="select select-bordered"
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            {[5, 10, 15, 20].map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                    <span>Page {currentPage} of {totalPages}</span>
                    <div>
                        <button className="mr-4" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                            <FiArrowLeftCircle size={24} />
                        </button>
                        <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                            <FiArrowRightCircle size={24} />
                        </button>
                    </div>
                </div>

            </div>

            {/* Add/Edit Modal */}

            {selectedTransaction && (
                <div className="modal modal-open flex items-center justify-center">
                    <div className="modal-box w-[90%] h-[90%] max-w-[90vw] max-h-[90vh] flex flex-col">
                        <h3 className="font-bold text-lg">
                            {viewMode ? "View Transaction" : selectedTransaction.id ? "Edit Transaction" : "Add Transaction"}
                        </h3>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
                            <div className="flex gap-6 mt-3 items-center justify-between">
                                {/* Type */}
                                <div className="flex items-center gap-2 w-full">
                                    <label className="font-medium whitespace-nowrap">Type:</label>
                                    <div className="w-full">
                                        {viewMode ? (
                                            <span>{selectedTransaction.type || "N/A"}</span>
                                        ) : (
                                            <span>Manual Entry</span>
                                        )}
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-2 w-full">
                                    <label className="font-medium whitespace-nowrap">Date:</label>
                                    <div className="w-full">
                                        {viewMode ? (
                                            <span>{new Date(selectedTransaction.date).toLocaleDateString("en-GB")}</span>
                                        ) : (
                                            <input
                                                type="date"
                                                className="input input-bordered w-full"
                                                name="date"
                                                value={
                                                    selectedTransaction.date
                                                        ? new Date(selectedTransaction.date).toISOString().split("T")[0]
                                                        : ""
                                                }
                                                required
                                                min={new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]}
                                                max={new Date().toISOString().split("T")[0]}
                                                placeholder="Date"
                                                onChange={(e) =>
                                                    setSelectedTransaction((prev) =>
                                                        prev ? { ...prev, date: e.target.value } : null
                                                    )
                                                }
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Reference ID */}
                                {/* <div className="flex items-center gap-2 w-full">
                                    <label className="font-medium whitespace-nowrap">Reference ID:</label>
                                    <div className="w-full">
                                        {viewMode ? (
                                            <span>{selectedTransaction.referenceId || "—"}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                name="referenceId"
                                                className="input input-bordered w-full"
                                                defaultValue={selectedTransaction.referenceId || ""}
                                                placeholder="Enter Reference ID (Optional)"
                                            />
                                        )}
                                    </div>
                                </div> */}

                                {/* Total Amount */}
                                <div className="flex items-center gap-2 w-full">
                                    <label className="font-medium whitespace-nowrap">Total Amount:</label>
                                    <div className="w-full">
                                        {viewMode ? (
                                            <span>{Number(selectedTransaction.totalAmount)}</span>
                                        ) : (
                                            <input
                                                type="number"
                                                name="totalAmount"
                                                className="input input-bordered w-full"
                                                value={Number(selectedTransaction.totalAmount) ?? ""}
                                                placeholder="Total Amount"
                                                disabled
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>


                            <div className="flex mt-4">
                                <h4 className="font-semibold">Journal Entries</h4>
                                {!viewMode && <FiPlusCircle className="cursor-pointer text-green-500 ml-4" size={25} onClick={addItem} />}
                            </div>

                            <table className="table w-full mt-3">
                                <thead>
                                    <tr>
                                        <th className="w-[14.28%]">Account Type</th>
                                        <th className="w-[14.28%]">Account Group</th>
                                        <th className="w-[14.28%]">Account Ledger</th>
                                        <th className="w-[14.28%]">Description</th>
                                        <th className="w-[14.28%]">Amount (Rs)</th>
                                        <th className="w-[14.28%]">Type</th>
                                        {!viewMode && <th className="w-[14.28%]">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {journalEntries?.map((item, index) => (
                                        <tr key={index}>
                                            <td className="p-2">
                                                {viewMode ? (
                                                    <span>{accountTypes.find((at) => at.code == item.LedgerAccount?.AccountGroup?.accountType)?.account || "N/A"}</span>
                                                ) : (
                                                    <select
                                                        className="select select-bordered w-full"
                                                        value={item.accountType || ""}
                                                        onChange={(e) => {
                                                            const value = Number(e.target.value);
                                                            updateItem(index, "accountType", value);
                                                            handleAccountTypeChange(index, value);
                                                        }}
                                                        required
                                                    >
                                                        <option value="" disabled>Select Type</option>
                                                        {accountTypes.map((type) => (
                                                            <option key={type.code} value={type.code}>{type.account}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {viewMode ? (
                                                    <span>{item.LedgerAccount?.AccountGroup?.name || "N/A"}</span>
                                                ) : (
                                                    <select
                                                        className="select select-bordered w-full"
                                                        value={item.accountGroup || ""}
                                                        onChange={(e) => {
                                                            const value = Number(e.target.value);
                                                            updateItem(index, "accountGroup", value);
                                                            handleAccountGroupChange(index, value);
                                                        }}
                                                        required
                                                    >
                                                        <option value="" disabled>Select Group</option>
                                                        {item.filteredAccountGroups?.map((ag) => (
                                                            <option key={ag.id} value={ag.id}>{ag.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {viewMode ? (
                                                    <span>{item.LedgerAccount?.name || "N/A"}</span>
                                                ) : (
                                                    <select
                                                        className="select select-bordered"
                                                        value={item.ledgerId}
                                                        onChange={(e) => updateItem(index, "ledgerId", Number(e.target.value))}
                                                        required
                                                    >
                                                        <option value="" disabled>Select Ledger</option>
                                                        {item.filteredLedgerAccount?.map((la) => (
                                                            <option key={la.id} value={la.id}>{la.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {viewMode ? (
                                                    <span>{item.description}</span>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="input input-bordered"
                                                        value={item.description || ""}
                                                        onChange={(e) => updateItem(index, "description", e.target.value)}
                                                        required
                                                        placeholder="Enter Description"
                                                    />
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {viewMode ? (
                                                    <span>{item.amount}</span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        className="input input-bordered"
                                                        value={item.amount || ""}
                                                        onChange={(e) => updateItem(index, "amount", Number(e.target.value) || null)}
                                                        onBlur={() => {
                                                            if (!item.amount || item.amount <= 0) {
                                                                toast.error("Amount must be greater than zero");
                                                                updateItem(index, "amount", null);
                                                            }
                                                        }}
                                                        required
                                                        placeholder="Enter Amount"
                                                    />
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {viewMode ? (
                                                    <span>{item.type}</span>
                                                ) : (
                                                    <select
                                                        className="select select-bordered"
                                                        value={item.type}
                                                        onChange={(e) => updateItem(index, "type", e.target.value)}
                                                        required
                                                    >
                                                        <option value="" disabled>Select Entry Type</option>
                                                        {["Debit", "Credit"].map((type) => (
                                                            <option key={type} value={type}>{type}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                            {!viewMode && (
                                                <td className="p-2">
                                                    <FiTrash2 className="text-error cursor-pointer" size={20} onClick={() => removeItem(index)} />
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="modal-action mt-auto">
                                {!viewMode && <button type="submit" className="btn btn-primary" disabled={isLoading || !selectedTransaction.totalAmount}>Save</button>}
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => {
                                        setSelectedTransaction(null);
                                        setJournalEntries([]);
                                        setViewMode(false);
                                        // setTransactionType("");
                                    }}
                                >
                                    {viewMode ? "Close" : "Cancel"}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
}