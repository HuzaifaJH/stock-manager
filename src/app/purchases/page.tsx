"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiTrash2 } from "react-icons/fi";

interface Supplier {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
}

interface Purchase {
    id: number;
    supplierId: number;
    productId: number;
    quantity: number;
    purchasePrice: number;
    date: string;
    Supplier?: { name: string };
    Product?: { name: string };
}

export default function PurchasesPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
                fetch("/api/purchases"),
                fetch("/api/suppliers"),
                fetch("/api/products"),
            ]);
            const [purchasesData, suppliersData, productsData] = await Promise.all([
                purchasesRes.json(),
                suppliersRes.json(),
                productsRes.json(),
            ]);
            setPurchases(purchasesData);
            setSuppliers(suppliersData);
            setProducts(productsData);
        } catch (error) {
            console.error("Error fetching data: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this purchase?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Purchase deleted successfully");
                fetchData();
            } else {
                toast.error("Failed to delete purchase");
            }
        } catch (error) {
            console.log("Error deleting purchase: " + error)
            toast.error("Error deleting purchase");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    const sortedPurchases = [...purchases].sort((a, b) => {
        return sortOrder === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    });

    const totalPages = Math.ceil(sortedPurchases.length / rowsPerPage);
    const paginatedPurchases = sortedPurchases.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Purchases</h2>
                <button className="btn btn-primary" onClick={() => setSelectedPurchase({ id: 0, supplierId: 0, productId: 0, quantity: 1, purchasePrice: 0, date: new Date().toISOString().split('T')[0] })}>
                    Add Purchase
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Supplier</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th className="cursor-pointer" onClick={handleSort}>
                                Date {sortOrder === "asc" ? "↑" : "↓"}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPurchases.map((purchase, index) => (
                            <tr key={purchase.id}>
                                <td>{index + 1}</td>
                                <td>{purchase.Supplier?.name}</td>
                                <td>{purchase.Product?.name}</td>
                                <td>{purchase.quantity}</td>
                                <td>{purchase.purchasePrice}</td>
                                <td>{purchase.date}</td>
                                <td className="flex items-center space-x-2">
                                    <FiEdit
                                        className="text-warning cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => setSelectedPurchase(purchase)}
                                    />
                                    <FiTrash2
                                        className="text-error cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => handleDelete(purchase.id)}
                                    />
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
            {selectedPurchase && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">{selectedPurchase.id ? "Edit Purchase" : "Add Purchase"}</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setIsLoading(true);
                            const formData = new FormData(e.target as HTMLFormElement);
                            const purchaseData = {
                                supplierId: Number(formData.get("supplierId")),
                                productId: Number(formData.get("productId")),
                                quantity: Number(formData.get("quantity")),
                                purchasePrice: Number(formData.get("purchasePrice")),
                                date: formData.get("date") as string,
                            };

                            try {
                                const res = await fetch(
                                    selectedPurchase.id ? `/api/purchases/${selectedPurchase.id}` : "/api/purchases",
                                    {
                                        method: selectedPurchase.id ? "PUT" : "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(purchaseData),
                                    }
                                );
                                if (res.ok) {
                                    toast.success(`Purchase ${selectedPurchase.id ? "updated" : "added"} successfully`);
                                    fetchData();
                                } else {
                                    toast.error("Failed to save purchase");
                                }
                            } catch (error) {
                                console.log("Error saving purchase: " + error)
                                toast.error("Error saving purchase");
                            } finally {
                                setIsLoading(false);
                                setSelectedPurchase(null);
                            }
                        }}>
                            <label className="block my-2">
                                Supplier:
                                <select name="supplierId" required className="select select-bordered w-full" defaultValue={selectedPurchase.supplierId}>
                                    <option value="" disabled>Select a supplier</option>
                                    {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                                </select>
                            </label>
                            <label className="block my-2">
                                Product:
                                <select name="productId" required className="select select-bordered w-full" defaultValue={selectedPurchase.productId}>
                                    <option value="" disabled>Select a product</option>
                                    {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                </select>
                            </label>
                            <label className="block my-2">
                                Date:
                                <input
                                    type="date"
                                    name="date"
                                    className="input input-bordered w-full"
                                    required
                                    defaultValue={new Date().toISOString().split("T")[0]}
                                    min={new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]}
                                    max={new Date().toISOString().split("T")[0]}
                                />
                            </label>

                            <label className="block my-2">
                                Quantity:
                                <input name="quantity" type="number" className="input input-bordered w-full" defaultValue={selectedPurchase.quantity} required />
                            </label>
                            <label className="block my-2">
                                Price:
                                <input name="purchasePrice" type="number" className="input input-bordered w-full" defaultValue={selectedPurchase.purchasePrice} required />
                            </label>
                            <div className="modal-action">
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>Save</button>
                                <button type="button" className="btn" onClick={() => setSelectedPurchase(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}