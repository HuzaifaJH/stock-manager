"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiEye, FiPlusCircle, FiTrash2 } from "react-icons/fi";

interface Supplier {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
}

interface Purchase {
    PurchaseItems?: PurchaseItem[];
    totalPrice?: number;
    id: number;
    supplierId: number | "";
    date: string;
    Supplier?: { name: string };
    paymentMehthod : string;
}

interface PurchaseItem {
    productId: number | "";
    quantity: number | null;
    purchasePrice: number | null;
    Product?: Product;
}

export default function PurchasesPage() {

    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
    const [supplierId, setSupplierId] = useState<number | "">("");
    const [paymentMethod, setPaymentMethod] = useState<string | "">("");
    const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [viewMode, setViewMode] = useState(false);

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

    useEffect(() => {
        fetchData();
    }, []);

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
            toast.error("Error deleting purchase: " + error);
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

    const totalPages = Math.ceil(sortedPurchases.length / rowsPerPage) == 0 ? 1 : Math.ceil(sortedPurchases.length / rowsPerPage);
    const paginatedPurchases = sortedPurchases.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const addItem = () => {
        setPurchaseItems([...purchaseItems, { productId: "", quantity: null, purchasePrice: null }]);
    };

    const updateItem = (index: number, field: keyof PurchaseItem, value: number | null) => {
        const newItems = [...purchaseItems];

        // newItems[index][field] = value as never;
        if (field === "quantity" || field === "purchasePrice") {
            newItems[index][field] = value;
        } else if (field === "productId" && value !== null) {
            newItems[index][field] = value;
        }

        setPurchaseItems(newItems);
    };

    const removeItem = (index: number) => {
        setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        if (purchaseItems.length === 0) {
            toast.error("Please add at least one purchase item.");
            return;
        }
        try {
            const res = await fetch(
                selectedPurchase?.id ? `/api/purchases/${selectedPurchase.id}` : "/api/purchases",
                {
                    method: selectedPurchase?.id ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ supplierId, date, items: purchaseItems, paymentMethod }),
                });
            if (res.ok) {
                toast.success(`Purchase ${selectedPurchase?.id ? "updated" : "added"} successfully`);
                setSupplierId("");
                setPaymentMethod("");
                setDate(new Date().toISOString().split("T")[0]);
                setPurchaseItems([]);
                setSelectedPurchase(null);
                fetchData();
            } else {
                toast.error("Failed to add purchase");
            }
        } catch (error) {
            console.error("Error adding purchase:", error);
            toast.error("Error adding purchase");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Purchases</h2>
                <button className="btn btn-primary" onClick={() => setSelectedPurchase({ id: 0, supplierId: supplierId, date: date, paymentMehthod: paymentMethod })}>
                    Add Purchase
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Supplier</th>
                            <th className="cursor-pointer" onClick={handleSort}>
                                Date {sortOrder === "asc" ? "↑" : "↓"}
                            </th>
                            <th>Total Price (Rs)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPurchases.map((purchase, index) => (
                            <tr key={purchase.id}>
                                <td>{index + 1}</td>
                                <td>{purchase.Supplier?.name}</td>
                                <td>{new Date(purchase.date).toLocaleDateString("en-GB")}</td>
                                <td>{purchase.totalPrice}</td>
                                <td className="flex items-center space-x-2">
                                    <FiEye
                                        className="text-blue-500 cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => {
                                            setSelectedPurchase(purchase);
                                            setViewMode(true);
                                            setPurchaseItems(purchase.PurchaseItems || []);
                                            setSupplierId(purchase.supplierId);
                                            setPaymentMethod(purchase.paymentMehthod);
                                            setDate(new Date(purchase.date).toISOString().split("T")[0]);
                                        }}
                                        />
                                    <FiEdit
                                        className="text-warning cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => {
                                            setSelectedPurchase(purchase);
                                            setViewMode(false);
                                            setPurchaseItems(purchase.PurchaseItems || []);
                                            setSupplierId(purchase.supplierId);
                                            setPaymentMethod(purchase.paymentMehthod);
                                            setDate(new Date(purchase.date).toISOString().split("T")[0]);
                                        }
                                        }
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
                <div className="modal modal-open flex items-center justify-center">
                    <div className="modal-box w-[80%] h-[80%] max-w-[90vw] max-h-[90vh] flex flex-col">
                        <h3 className="font-bold text-lg">
                            {viewMode ? "View Purchase" : selectedPurchase.id ? "Edit Purchase" : "Add Purchase"}
                        </h3>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
                            <div className="flex flex-wrap gap-6 mt-3 items-center">
                                {/* Supplier */}
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Supplier:</span>
                                    {viewMode ? (
                                        <span>{selectedPurchase.Supplier?.name || "N/A"}</span>
                                    ) : (
                                        <select
                                            value={supplierId}
                                            onChange={(e) => setSupplierId(Number(e.target.value))}
                                            required
                                            className="select select-bordered w-52"
                                        >
                                            <option value="" disabled>Select a supplier</option>
                                            {suppliers.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Date:</span>
                                    {viewMode ? (
                                        <span>{new Date(selectedPurchase.date).toLocaleDateString("en-GB")}</span>
                                    ) : (
                                        <input
                                            type="date"
                                            className="input input-bordered w-40"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            required
                                            min={new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]}
                                            max={new Date().toISOString().split("T")[0]}
                                        />
                                    )}
                                </div>

                                {/* Payment Method */}
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Payment Method:</span>
                                    {viewMode ? (
                                        <span>
                                            {/* {selectedPurchase.paymentMehthod || "N/A"} */}
                                            </span>
                                    ) : (
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            required
                                            className="select select-bordered w-52"
                                        >
                                            <option value="" disabled>Select Payment Method</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Accounts Payable">Accounts Payable</option>
                                        </select>
                                    )}
                                </div>

                            </div>

                            <div className="flex mt-4">
                                <h4 className="font-semibold">Purchase Items</h4>
                                {!viewMode && <FiPlusCircle className="cursor-pointer text-green-500 ml-4" size={25} onClick={addItem} />}
                            </div>

                            <table className="table w-full mt-3">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Price (Rs)</th>
                                        <th>Total Price (Rs)</th>
                                        {!viewMode && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchaseItems?.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                {viewMode ? (
                                                    <span>{products.find((p) => p.id === item.productId)?.name || "N/A"}</span>
                                                ) : (
                                                    <select
                                                        className="select select-bordered"
                                                        value={item.productId}
                                                        onChange={(e) => updateItem(index, "productId", Number(e.target.value))}
                                                        required
                                                    >
                                                        <option value="" disabled>Select product</option>
                                                        {products.map((p) => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                            <td>
                                                {viewMode ? (
                                                    <span>{item.quantity}</span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        className="input input-bordered"
                                                        value={item.quantity === null ? "" : item.quantity}
                                                        onChange={(e) => updateItem(index, "quantity", e.target.value ? Number(e.target.value) : null)}
                                                        onBlur={() => {
                                                            if (item.quantity === null || item.quantity <= 0) {
                                                                toast.error("Quantity must be greater than zero");
                                                                updateItem(index, "quantity", null);
                                                            }
                                                        }}
                                                        required
                                                        placeholder="Enter Quantity"
                                                    />
                                                )}
                                            </td>
                                            <td>
                                                {viewMode ? (
                                                    <span>Rs {item.purchasePrice}</span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        className="input input-bordered"
                                                        value={item.purchasePrice === null ? "" : item.purchasePrice}
                                                        onChange={(e) => updateItem(index, "purchasePrice", e.target.value ? Number(e.target.value) : null)}
                                                        onBlur={() => {
                                                            if (item.purchasePrice === null || item.purchasePrice <= 0) {
                                                                toast.error("Purchase price must be greater than zero");
                                                                updateItem(index, "purchasePrice", null);
                                                            }
                                                        }}
                                                        required
                                                        placeholder="Enter Price"
                                                    />
                                                )}
                                            </td>
                                            <td>Rs {(item.quantity || 0) * (item.purchasePrice || 0)}</td>
                                            {!viewMode && (
                                                <td>
                                                    <FiTrash2 className="text-error cursor-pointer" size={20} onClick={() => removeItem(index)} />
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-4 font-semibold text-right">
                                Total: Rs
                                {purchaseItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.purchasePrice || 0), 0).toFixed(2)}
                            </div>

                            <div className="modal-action mt-auto">
                                {!viewMode && <button type="submit" className="btn btn-primary" disabled={isLoading}>Save</button>}
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => {
                                        setSelectedPurchase(null);
                                        setPurchaseItems([]);
                                        setSupplierId("");
                                        setPaymentMethod("");
                                        setDate(new Date().toISOString().split("T")[0]);
                                        setViewMode(false);
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