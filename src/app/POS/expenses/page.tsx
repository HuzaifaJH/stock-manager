"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiTrash2 } from "react-icons/fi";
import { Expense, LedgerAccount } from '@/app/utils/interfaces';
import axios from "axios";
import { accountTypes } from "@/app/utils/accountType";
import { formatPKR } from "@/app/utils/amountFormatter";

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    // const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [expenseLedgers, setExpenseLedgers] = useState<LedgerAccount[]>([]);
    const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<number | null>(null);

    useEffect(() => {
        fetchExpenses();
        fetchAccounts();
    }, []);

    const fetchExpenses = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/expenses");
            const data = await res.json();
            setExpenses(data);
        } catch (error) {
            console.error("Error fetching expenses: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAccounts = async () => {
        const response = await axios.get("/api/ledger-accounts");
        const expenseType = accountTypes.find((type) => type.account === "Expense")?.code;

        setExpenseLedgers(response.data.filter(
            (ledger: LedgerAccount) => ledger.AccountGroup?.accountType === expenseType
        ));
    };

    // Sorting Logic
    // const handleSort = () => {
    //     setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    // };

    const filteredExpenses = expenses.filter((exp) => {
        const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedLedgerAccountId ? exp.expenseLedgerAccount === selectedLedgerAccountId : true;
        return matchesSearch && matchesCategory;
    });

    // Sort Filtered Categories
    // const sortedCategories = [...filteredCategories].sort((a, b) => {
    //     return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    // });

    // Pagination Logic
    const totalPages = Math.ceil(filteredExpenses.length / rowsPerPage);
    const paginatedExpenses = filteredExpenses.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // Delete Expense
    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this expense?")) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Expense deleted successfully");
                fetchExpenses();
            } else {
                toast.error("Failed to delete expense");
            }
        } catch (error) {
            console.error("Delete error: ", error);
            toast.error("Error deleting expense");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Expense List</h2>
                <button className="btn btn-primary" onClick={() => setSelectedExpense({ id: 0, expenseLedgerAccount: 0, date: new Date().toISOString().split("T")[0], amount: 0, description: "" })}>
                    Add Expense
                </button>
            </div>

            {/* Filters Section */}
            <div className="flex flex-wrap gap-4 mb-4 items-center">
                <input
                    type="text"
                    placeholder="Search by expense description"
                    className="input input-bordered w-full sm:max-w-sm"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                />

                <select
                    className="select select-bordered w-full sm:max-w-xs"
                    value={selectedLedgerAccountId || ""}
                    onChange={(e) => {
                        setSelectedLedgerAccountId(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                >
                    <option value="">Select Expense Type</option>
                    {expenseLedgers.map((exp) => (
                        <option key={exp.id} value={exp.id}>{exp.name}</option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra border-2">
                    <thead className="border-2">
                        <tr className="bg-base-100 text-base-content">
                            <th className="">#</th>
                            <th className="">Expense Type</th>
                            <th className="">Date</th>
                            <th className="">Amount</th>
                            <th className="">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedExpenses.map((expense, index) => (
                            <tr key={expense.id}>
                                <td className="">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                <td className="">{expense.LedgerAccount?.name}</td>
                                <td className="">{new Date(expense.date).toLocaleDateString("en-GB")}</td>
                                <td className="">{formatPKR(expense.amount)}</td>
                                <td className="">{expense.description}</td>
                                <td className="flex items-center space-x-2">
                                    <FiEdit
                                        className="text-warning cursor-pointer"
                                        size={20}
                                        onClick={() => { setSelectedExpense(expense); expense.date = new Date(expense.date).toISOString().split("T")[0] }}
                                    />
                                    <FiTrash2
                                        className="text-error cursor-pointer"
                                        size={20}
                                        onClick={() => handleDelete(expense.id)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Controls */}
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
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <div>
                        <button
                            className="mr-4"
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <FiArrowLeftCircle size={24} />
                        </button>
                        <button
                            className=""
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            <FiArrowRightCircle size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {selectedExpense && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">{selectedExpense.id ? "Edit Expense" : "Add Expense"}</h3>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setIsLoading(true);
                                const formData = new FormData(e.target as HTMLFormElement);
                                const expenseData = {
                                    expenseLedgerAccount: formData.get("expenseLedgerAccount"),
                                    date: formData.get("date"),
                                    amount: formData.get("amount"),
                                    description: formData.get("description"),
                                };

                                try {
                                    const res = await fetch(
                                        selectedExpense.id ? `/api/expenses?id=${selectedExpense.id}` : "/api/expenses",
                                        {
                                            method: selectedExpense.id ? "PUT" : "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(expenseData),
                                        }
                                    );

                                    if (res.ok) {
                                        toast.success(`Expense ${selectedExpense.id ? "updated" : "added"} successfully`);
                                        fetchExpenses();
                                    } else {
                                        toast.error("Failed to save expense");
                                    }
                                } catch (error) {
                                    toast.error("Error saving expense: " + error);
                                } finally {
                                    setIsLoading(false);
                                    setSelectedExpense(null);
                                }
                            }}
                        >
                            <label className="block my-2">
                                Expense Type:
                                <select
                                    name="expenseLedgerAccount"
                                    defaultValue={selectedExpense.expenseLedgerAccount || ""}
                                    className="select select-bordered w-full"
                                    required
                                >
                                    <option value="" disabled>Select Expense Type</option>
                                    {expenseLedgers.map((exp) => (
                                        <option key={exp.id} value={exp.id}>{exp.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block my-2">
                                Date:
                                <input
                                    name="date"
                                    type="date"
                                    className="input input-bordered w-full"
                                    defaultValue={selectedExpense.date}
                                    required
                                    max={new Date().toISOString().split("T")[0]}
                                    readOnly
                                />
                            </label>
                            <label className="block my-2">
                                Amount:
                                <input
                                    name="amount"
                                    defaultValue={selectedExpense.amount === 0 ? "" : selectedExpense.amount}
                                    className="input input-bordered w-full"
                                    type="number"
                                    step="any"
                                    required
                                />
                            </label>
                            <label className="block my-2">
                                Description:
                                <input
                                    name="description"
                                    defaultValue={selectedExpense.description}
                                    className="input input-bordered w-full"
                                    type="text"
                                    required
                                />
                            </label>
                            <div className="modal-action">
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                    {isLoading ? "Saving..." : "Save Changes"}
                                </button>
                                <button type="button" className="btn" onClick={() => { setSelectedExpense(null) }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}