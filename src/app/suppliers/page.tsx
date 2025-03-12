"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiTrash2 } from "react-icons/fi";

interface Supplier {
    id: number;
    name: string;
    phoneNumber: string;
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/suppliers");
            const data = await res.json();
            setSuppliers(data);
        } catch (error) {
            console.error("Error fetching suppliers: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    const sortedSuppliers = [...suppliers].sort((a, b) => {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

    const totalPages = Math.ceil(sortedSuppliers.length / rowsPerPage);
    const paginatedSuppliers = sortedSuppliers.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this supplier?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Supplier deleted successfully");
                fetchSuppliers();
            } else {
                toast.error("Failed to delete supplier");
            }
        } catch (error) {
            console.error("Delete error: ", error);
            toast.error("Error deleting supplier");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Supplier List</h2>
                <button className="btn btn-primary" onClick={() => setSelectedSupplier({ id: 0, name: "", phoneNumber: "" })}>
                    Add Supplier
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                    <thead>
                        <tr className="bg-base-100 text-base-content">
                            <th className="">#</th>
                            <th className="cursor-pointer" onClick={handleSort}>
                                Name {sortOrder === "asc" ? "↑" : "↓"}
                            </th>
                            <th className="">Phone</th>
                            <th className="">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSuppliers.map((supplier, index) => (
                            <tr key={supplier.id}>
                                <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                <td>{supplier.name}</td>
                                <td>{supplier.phoneNumber}</td>
                                <td className="flex items-center space-x-2">
                                    <FiEdit
                                        className="text-warning cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => setSelectedSupplier(supplier)}
                                    />
                                    <FiTrash2
                                        className="text-error cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => handleDelete(supplier.id)}
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

            {selectedSupplier && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">{selectedSupplier.id ? "Edit Supplier" : "Add Supplier"}</h3>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setIsLoading(true);
                                const formData = new FormData(e.target as HTMLFormElement);
                                const supplierData = {
                                    name: formData.get("name"),
                                    phoneNumber: formData.get("phone")
                                };

                                try {
                                    const res = await fetch(
                                        selectedSupplier.id ? `/api/suppliers/${selectedSupplier.id}` : "/api/suppliers",
                                        {
                                            method: selectedSupplier.id ? "PUT" : "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(supplierData),
                                        }
                                    );

                                    if (res.ok) {
                                        toast.success(`Supplier ${selectedSupplier.id ? "updated" : "added"} successfully`);
                                        fetchSuppliers();
                                    } else {
                                        toast.error("Failed to save supplier");
                                    }
                                } catch (error) {
                                    toast.error("Error saving supplier: " + error);
                                } finally {
                                    setIsLoading(false);
                                    setSelectedSupplier(null);
                                }
                            }}
                        >
                            <label className="block my-2">Name: <input name="name" defaultValue={selectedSupplier.name} className="input input-bordered w-full" required /></label>
                            <label className="block my-2">Phone: <input name="phone" defaultValue={selectedSupplier.phoneNumber} className="input input-bordered w-full" required /></label>
                            <div className="modal-action">
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>Save</button>
                                <button type="button" className="btn" onClick={() => setSelectedSupplier(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}