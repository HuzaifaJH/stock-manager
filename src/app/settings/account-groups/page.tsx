"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiEdit, FiTrash2, FiArrowLeftCircle, FiArrowRightCircle } from "react-icons/fi";
import { accountTypes } from "@/app/utils/accountType";
import { AccountGroup } from "@/app/utils/interfaces";

export default function AccountGroups() {
    const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAccountGroup, setSelectedAccountGroup] = useState<AccountGroup | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        fetchAccountGroups();
    }, []);

    const fetchAccountGroups = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/account-groups");
            const data = await res.json();
            console.log(data)
            setAccountGroups(data);
        } catch (error) {
            console.error("Error fetching account groups: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this account group?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/account-groups/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Account deleted successfully");
                fetchAccountGroups();
            } else {
                toast.error("Failed to delete account group");
            }
        } catch (error) {
            toast.error("Error deleting account group: " + error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target as HTMLFormElement);
        const accountGroupData = {
            name: formData.get("name"),
            accountType: formData.get("accountType"),
        };
        try {
            const res = await fetch(
                selectedAccountGroup?.id ? `/api/account-groups/${selectedAccountGroup.id}` : "/api/account-groups",
                {
                    method: selectedAccountGroup?.id ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(accountGroupData),
                }
            );
            if (res.ok) {
                toast.success(`Account ${selectedAccountGroup?.id ? "updated" : "added"} successfully`);
                fetchAccountGroups();
            } else {
                toast.error("Failed to save account group");
            }
        } catch (error) {
            toast.error("Error saving account group: " + error);
        } finally {
            setIsLoading(false);
            setSelectedAccountGroup(null);
        }
    }

    const totalPages = Math.ceil(accountGroups.length / rowsPerPage) == 0 ? 1 : Math.ceil(accountGroups.length / rowsPerPage);
    const paginatedAccounts = accountGroups.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Account Groups</h2>
                <button className="btn btn-primary" onClick={() => setSelectedAccountGroup({ id: 0, name: "", accountType: 0, code: null })}>
                    Add Account Group
                </button>
            </div>

            <table className="table w-full table-zebra">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Account Type</th>
                        <th>Code</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedAccounts.map((accountGroup: AccountGroup, index) => (
                        <tr key={accountGroup.id}>
                            <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                            <td>{accountGroup.name}</td>
                            <td>{accountGroup.accountTypeName}</td>
                            <td>{accountGroup.code}</td>
                            <td className="flex items-center space-x-2">
                                <FiEdit className="text-warning cursor-pointer" size={18} onClick={() => setSelectedAccountGroup(accountGroup)} />
                                <FiTrash2 className="text-error cursor-pointer" size={18} onClick={() => handleDelete(accountGroup.id)} />
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

            {selectedAccountGroup && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">{selectedAccountGroup.id ? "Edit Account Group" : "Add Account Group"}</h3>
                        <form
                            onSubmit={handleSubmit}
                        >
                            {/* <label className="block my-2">Name: */}
                            <input name="name" placeholder="Name" defaultValue={selectedAccountGroup.name} className="input input-bordered w-full my-2" required />
                            {/* </label> */}
                            {/* <label className="block my-2">Type: */}
                            <select name="accountType" defaultValue={selectedAccountGroup?.accountType || ""} className="select select-bordered w-full my-2" required disabled={selectedAccountGroup.id != 0}>
                                <option value="" disabled>Select a Account Type</option>
                                {accountTypes.map(type => (
                                    <option key={type.code} value={type.code}>{type.account}</option>
                                ))}
                            </select>
                            {/* </label> */}
                            {/* <input
                                type="number"
                                name="code"
                                placeholder="Account Code"
                                className="input input-bordered w-full my-2"
                                defaultValue={selectedAccount.code === null ? "" : selectedAccount.code}
                                required
                            /> */}
                            {/* <label className="block my-2">Initial Balance: */}
                            {/* <input name="balance" placeholder="Initial Balance" type="number" defaultValue={selectedAccount.balance === null ? "" : selectedAccount.balance} className="input input-bordered w-full my-2" required /> */}
                            {/* </label> */}
                            <div className="modal-action">
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>Save</button>
                                <button type="button" className="btn" onClick={() => setSelectedAccountGroup(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
