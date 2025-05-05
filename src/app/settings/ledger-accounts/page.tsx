"use client";
import { accountTypes } from "@/app/utils/accountType";
import { AccountGroup, LedgerAccount } from "@/app/utils/interfaces";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiEdit, FiTrash2, FiArrowLeftCircle, FiArrowRightCircle } from "react-icons/fi";

// interface LedgerAccount {
//     id: number;
//     name: string;
//     accountGroup: number | "";
//     code: string;
//     AccountGroup?: AccountGroup;
//     accountType: number | "";
// }

export default function LedgerAccounts() {
    const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLedger, setSelectedLedger] = useState<LedgerAccount | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
    const [selectedAccountType, setSelectedAccountType] = useState<number | "">("");
    const [selectedAccountGroup, setSelectedAccountGroup] = useState<number | "">("");
    const [filteredGroups, setFilteredGroups] = useState<AccountGroup[]>([]);

    useEffect(() => {
        fetchLedgerAccounts();
        fetchAccountGroups();
    }, []);

    useEffect(() => {
        const filtered = accountGroups.filter(group => group.accountType == selectedAccountType);
        setFilteredGroups(filtered);
    }, [selectedAccountType]);

    const fetchLedgerAccounts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/ledger-accounts");
            const data = await res.json();
            setLedgerAccounts(data);
        } catch (error) {
            toast.error("Error fetching ledger accounts: " + error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAccountGroups = async () => {
        try {
            const res = await fetch("/api/account-groups");
            const data = await res.json();
            setAccountGroups(data);
        } catch (error) {
            toast.error("Error fetching account groups: " + error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this ledger account?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/ledger-accounts/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Ledger account deleted successfully");
                fetchLedgerAccounts();
            } else {
                toast.error("Failed to delete ledger account");
            }
        } catch (error) {
            toast.error("Error deleting ledger account: " + error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            name: formData.get("name")?.toString().replace(/\b\w/g, c => c.toUpperCase()),
            accountGroup: formData.get("accountGroup"),
            // balance: parseFloat(formData.get("balance") as string) || 0,
        };

        try {
            const res = await fetch(
                selectedLedger?.id ? `/api/ledger-accounts/${selectedLedger.id}` : "/api/ledger-accounts",
                {
                    method: selectedLedger?.id ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                }
            );
            if (res.ok) {
                toast.success(`Ledger ${selectedLedger?.id ? "updated" : "added"} successfully`);
                fetchLedgerAccounts();
                setSelectedAccountType("");
            } else {
                toast.error("Failed to save ledger account");
            }
        } catch (error) {
            toast.error("Error saving ledger account: " + error);
        } finally {
            setIsLoading(false);
            setSelectedLedger(null);
            setSelectedAccountType("");
        }
    };

    const totalPages = Math.ceil(ledgerAccounts.length / rowsPerPage) || 1;
    const paginatedData = ledgerAccounts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Ledger Accounts</h2>
                <button className="btn btn-primary" onClick={() => setSelectedLedger({ id: 0, name: "", accountGroup: "", code: "", accountType: "" })}>
                    Add Ledger Account
                </button>
            </div>

            <table className="table w-full table-zebra">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Account Group</th>
                        <th>Account Type</th>
                        <th>Code</th>
                        {/* <th>Balance</th> */}
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((ledger, index) => (
                        <tr key={ledger.id}>
                            <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                            <td>{ledger.name}</td>
                            <td>{ledger.AccountGroup?.name}</td>
                            <td>{ledger.AccountGroup?.accountTypeName}</td>
                            <td>{ledger.code}</td>
                            {/* <td>{ledger.balance.toFixed(2)}</td> */}
                            <td className="flex space-x-2">
                                <FiEdit className="text-warning cursor-pointer" size={18} onClick={() => { setSelectedLedger(ledger); setSelectedAccountType(ledger.AccountGroup!.accountType); setSelectedAccountGroup(ledger.accountGroup); }} />
                                <FiTrash2 className="text-error cursor-pointer" size={18} onClick={() => handleDelete(ledger.id)} />
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
                            <option key={size} value={size}>{size}</option>
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

            {selectedLedger && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">{selectedLedger.id ? "Edit Ledger Account" : "Add Ledger Account"}</h3>
                        <form onSubmit={handleSubmit}>
                            <input name="name" placeholder="Name" defaultValue={selectedLedger.name} className="input input-bordered w-full my-2" required />

                            {/* Account Type */}
                            <select name="accountType" value={selectedAccountType} className="select select-bordered w-full my-2" required disabled={selectedLedger.id != 0}
                                onChange={(e) => {
                                    setSelectedAccountType(Number(e.target.value));
                                    setSelectedAccountGroup("");
                                }}>
                                <option value="" disabled>Select a Account Type</option>
                                {accountTypes.map(type => (
                                    <option key={type.code} value={type.code}>{type.account}</option>
                                ))}
                            </select>

                            {/* Account Group */}
                            <select name="accountGroup" value={selectedAccountGroup} className="select select-bordered w-full my-2" required disabled={selectedLedger.id != 0 || !selectedAccountType}
                                onChange={(e) => {
                                    setSelectedAccountGroup(Number(e.target.value));
                                }}>
                                <option value="" disabled>Select Account Group</option>
                                {filteredGroups.map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}
                            </select>
                            {/* <input name="balance" placeholder="Opening Balance" type="number" step="0.01" defaultValue={selectedLedger.balance} className="input input-bordered w-full my-2" /> */}
                            <div className="modal-action">
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>Save</button>
                                <button type="button" className="btn" onClick={() => { setSelectedLedger(null); setSelectedAccountType(""); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    );
}