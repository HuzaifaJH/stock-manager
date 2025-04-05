"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiEye, FiPlusCircle, FiTrash2 } from "react-icons/fi";

interface Product {
    id: number;
    name: string;
}

interface Sales {
    id: number;
    date: string;
    salesItems?: salesItem[];
    totalPrice?: number;
    customerName: string;
    paymentMehthod: string;
}

interface salesItem {
    productId: number | "";
    quantity: number | null;
    price: number | null;
    Product?: Product;
}

export default function SalesPage() {

    const [sales, setSales] = useState<Sales[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sales | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [salesItems, setsalesItems] = useState<salesItem[]>([]);
    const [customerName, setCustomerName] = useState<string>("");
    const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [paymentMethod, setPaymentMethod] = useState<string | "">("");
    const [viewMode, setViewMode] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [salesRes, productsRes] = await Promise.all([
                fetch("/api/sales"),
                fetch("/api/products"),
            ]);
            const [salesData, productsData] = await Promise.all([
                salesRes.json(),
                productsRes.json(),
            ]);
            setSales(salesData);
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
        if (!confirm("Are you sure you want to delete this sales?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Sales deleted successfully");
                fetchData();
            } else {
                toast.error("Failed to delete sales");
            }
        } catch (error) {
            toast.error("Error deleting sales: " + error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    const sortedSales = [...sales].sort((a, b) => {
        return sortOrder === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    });

    const totalPages = Math.ceil(sortedSales.length / rowsPerPage) == 0 ? 1 : Math.ceil(sortedSales.length / rowsPerPage);
    const paginatedSales = sortedSales.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const addItem = () => {
        setsalesItems([...salesItems, { productId: "", quantity: null, price: null }]);
    };

    const updateItem = (index: number, field: keyof salesItem, value: number | null) => {
        const newItems = [...salesItems];

        // newItems[index][field] = value as never;
        if (field === "quantity" || field === "price") {
            newItems[index][field] = value;
        } else if (field === "productId" && value !== null) {
            newItems[index][field] = value;
        }

        setsalesItems(newItems);
    };

    const removeItem = (index: number) => {
        setsalesItems(salesItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        if (salesItems.length === 0) {
            toast.error("Please add at least one sales item.");
            return;
        }
        try {
            const res = await fetch(
                selectedSale?.id ? `/api/sales/${selectedSale.id}` : "/api/sales",
                {
                    method: selectedSale?.id ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ date, items: salesItems, customerName, paymentMethod }),
                });
            if (res.ok) {
                toast.success(`Sales ${selectedSale?.id ? "updated" : "added"} successfully`);
                setDate(new Date().toISOString().split("T")[0]);
                setCustomerName("");
                setPaymentMethod("");
                setsalesItems([]);
                setSelectedSale(null);
                fetchData();
            } else {
                toast.error("Failed to add sales");
            }
        } catch (error) {
            console.error("Error adding sales:", error);
            toast.error("Error adding sales");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Sales</h2>
                <button className="btn btn-primary" onClick={() => setSelectedSale({ id: 0, date: date, customerName: "", paymentMehthod: paymentMethod })}>
                    Add Sales
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Customer Name</th>
                            <th className="cursor-pointer" onClick={handleSort}>
                                Date {sortOrder === "asc" ? "↑" : "↓"}
                            </th>
                            <th>Total Price (Rs)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSales.map((sales, index) => (
                            <tr key={sales.id}>
                                <td>{index + 1}</td>
                                <td>{sales.customerName}</td>
                                <td>{new Date(sales.date).toLocaleDateString("en-GB")}</td>
                                <td>{sales.totalPrice}</td>
                                <td className="flex items-center space-x-2">
                                    <FiEye
                                        className="text-blue-500 cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => {
                                            setSelectedSale(sales);
                                            setViewMode(true);
                                            setsalesItems(sales.salesItems || []);
                                            setDate(new Date(sales.date).toISOString().split("T")[0]);
                                            setPaymentMethod(sales.paymentMehthod);
                                            setCustomerName(sales.customerName);
                                        }}
                                    />
                                    <FiEdit
                                        className="text-warning cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => {
                                            setSelectedSale(sales);
                                            setViewMode(false);
                                            setsalesItems(sales.salesItems || []);
                                            setDate(new Date(sales.date).toISOString().split("T")[0]);
                                            setPaymentMethod(sales.paymentMehthod);
                                            setCustomerName(sales.customerName);
                                        }
                                        }
                                    />
                                    <FiTrash2
                                        className="text-error cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => handleDelete(sales.id)}
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

            {selectedSale && (
                <div className="modal modal-open flex items-center justify-center">
                    <div className="modal-box w-[80%] h-[80%] max-w-[90vw] max-h-[90vh] flex flex-col">
                        <h3 className="font-bold text-lg">
                            {viewMode ? "View Sales" : selectedSale.id ? "Edit Sales" : "Add Sales"}
                        </h3>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
                            <div className="flex flex-wrap gap-6 mt-3 items-center">
                                {/* Customer Name*/}
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Customer Name:</span>
                                    {viewMode ? (
                                        <span>{selectedSale.customerName || "N/A"}</span>
                                    ) : (
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            required
                                            className="input input-bordered w-52"
                                        />
                                    )}
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Date:</span>
                                    {viewMode ? (
                                        <span>{new Date(selectedSale.date).toLocaleDateString("en-GB")}</span>
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
                                            <option value="Accounts Receivable">Accounts Receivable</option>
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="flex mt-4">
                                <h4 className="font-semibold">Sales Items</h4>
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
                                    {salesItems?.map((item, index) => (
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
                                                    <span>Rs{item.price}</span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        className="input input-bordered"
                                                        value={item.price === null ? "" : item.price}
                                                        onChange={(e) => updateItem(index, "price", e.target.value ? Number(e.target.value) : null)}
                                                        onBlur={() => {
                                                            if (item.price === null || item.price <= 0) {
                                                                toast.error("Sales price must be greater than zero");
                                                                updateItem(index, "price", null);
                                                            }
                                                        }}
                                                        required
                                                        placeholder="Enter Price"
                                                    />
                                                )}
                                            </td>
                                            <td>Rs{(item.quantity || 0) * (item.price || 0)}</td>
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
                                {salesItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0).toFixed(2)}
                            </div>

                            <div className="modal-action mt-auto">
                                {!viewMode && <button type="submit" className="btn btn-primary" disabled={isLoading}>Save</button>}
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => {
                                        setSelectedSale(null);
                                        setsalesItems([]);
                                        setDate(new Date().toISOString().split("T")[0]);
                                        setViewMode(false);
                                        setCustomerName("");
                                        setPaymentMethod("");
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