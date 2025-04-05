"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiEdit, FiTrash2, FiArrowLeftCircle, FiArrowRightCircle } from "react-icons/fi";

interface Account {
    id: number;
    name: string;
    type: string;
    code: number | null;
    balance: number | null;
}

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/accounts");
            const data = await res.json();
            setAccounts(data);
        } catch (error) {
            console.error("Error fetching accounts: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this account?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Account deleted successfully");
                fetchAccounts();
            } else {
                toast.error("Failed to delete account");
            }
        } catch (error) {
            toast.error("Error deleting account");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target as HTMLFormElement);
        const accountData = {
            name: formData.get("name"),
            type: formData.get("type"),
            code: formData.get("code"),
            balance: Number(formData.get("balance")),
        };
        try {
            const res = await fetch(
                selectedAccount?.id ? `/api/accounts/${selectedAccount.id}` : "/api/accounts",
                {
                    method: selectedAccount?.id ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(accountData),
                }
            );
            if (res.ok) {
                toast.success(`Account ${selectedAccount?.id ? "updated" : "added"} successfully`);
                fetchAccounts();
            } else {
                toast.error("Failed to save account");
            }
        } catch (error) {
            toast.error("Error saving account");
        } finally {
            setIsLoading(false);
            setSelectedAccount(null);
        }
    }

    const totalPages = Math.ceil(accounts.length / rowsPerPage) == 0 ? 1 : Math.ceil(accounts.length / rowsPerPage);
    const paginatedAccounts = accounts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Accounts</h2>
                <button className="btn btn-primary" onClick={() => setSelectedAccount({ id: 0, name: "", type: "Asset", code: null, balance: null })}>
                    Add Account
                </button>
            </div>

            <table className="table w-full table-zebra">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Code</th>
                        <th>Balance (Rs)</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedAccounts.map((account: Account, index) => (
                        <tr key={account.id}>
                            <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                            <td>{account.name}</td>
                            <td>{account.type}</td>
                            <td>{account.code}</td>
                            <td>{account.balance !== null ? (account.balance < 0 ? `(${Math.abs(account.balance).toFixed(2)})` : account.balance) : "N/A"}</td>
                            <td className="flex items-center space-x-2">
                                <FiEdit className="text-warning cursor-pointer" size={18} onClick={() => setSelectedAccount(account)} />
                                <FiTrash2 className="text-error cursor-pointer" size={18} onClick={() => handleDelete(account.id)} />
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

            {selectedAccount && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">{selectedAccount.id ? "Edit Account" : "Add Account"}</h3>
                        <form
                            onSubmit={handleSubmit}
                        >
                            {/* <label className="block my-2">Name: */}
                            <input name="name" placeholder="Name" defaultValue={selectedAccount.name} className="input input-bordered w-full my-2" required />
                            {/* </label> */}
                            {/* <label className="block my-2">Type: */}
                            <select name="type" defaultValue={selectedAccount.type} className="select select-bordered w-full my-2" required>
                                {['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            {/* </label> */}
                            <input
                                type="number"
                                name="code"
                                placeholder="Account Code"
                                className="input input-bordered w-full my-2"
                                defaultValue={selectedAccount.code === null ? "" : selectedAccount.code}
                                required
                            />
                            {/* <label className="block my-2">Initial Balance: */}
                            <input name="balance" placeholder="Initial Balance" type="number" defaultValue={selectedAccount.balance === null ? "" : selectedAccount.balance} className="input input-bordered w-full my-2" required />
                            {/* </label> */}
                            <div className="modal-action">
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>Save</button>
                                <button type="button" className="btn" onClick={() => setSelectedAccount(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
