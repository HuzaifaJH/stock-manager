"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiEye, FiPlusCircle, FiTrash2 } from "react-icons/fi";

interface Product {
    id: number;
    name: string;
}

interface SalesReturn {
    id: number;
    date: string;
    salesReturnItems?: salesReturnItem[];
    totalPrice?: number;
    customerName: string;
    paymentMehthod: string;
    reason: string;
}

interface salesReturnItem {
    productId: number | "";
    quantity: number | null;
    returnPrice: number | null;
    Product?: Product;
}

export default function SalesReturnPage() {

    const [salesReturn, setSalesReturn] = useState<SalesReturn[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSaleReturn, setSelectedSaleReturn] = useState<SalesReturn | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [salesReturnItems, setsalesReturnItems] = useState<salesReturnItem[]>([]);
    const [customerName, setCustomerName] = useState<string>("");
    const [reason, setReason] = useState<string>("");
    const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [paymentMethod, setPaymentMethod] = useState<string | "">("");
    const [viewMode, setViewMode] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [salesReturnRes, productsRes] = await Promise.all([
                fetch("/api/sales-returns"),
                fetch("/api/products"),
            ]);
            const [salesReturnData, productsData] = await Promise.all([
                salesReturnRes.json(),
                productsRes.json(),
            ]);
            setSalesReturn(salesReturnData);
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
        if (!confirm("Are you sure you want to delete this sales return?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/sales-returns/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Sales Return deleted successfully");
                fetchData();
            } else {
                toast.error("Failed to delete sales return");
            }
        } catch (error) {
            toast.error("Error deleting sales return: " + error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    const sortedSalesReturn = [...salesReturn].sort((a, b) => {
        return sortOrder === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    });

    const totalPages = Math.ceil(sortedSalesReturn.length / rowsPerPage) == 0 ? 1 : Math.ceil(sortedSalesReturn.length / rowsPerPage);
    const paginatedSalesReturn = sortedSalesReturn.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const addItem = () => {
        setsalesReturnItems([...salesReturnItems, { productId: "", quantity: null, returnPrice: null }]);
    };

    const updateItem = (index: number, field: keyof salesReturnItem, value: number | null) => {
        const newItems = [...salesReturnItems];

        // newItems[index][field] = value as never;
        if (field === "quantity" || field === "returnPrice") {
            newItems[index][field] = value;
        } else if (field === "productId" && value !== null) {
            newItems[index][field] = value;
        }

        setsalesReturnItems(newItems);
    };

    const removeItem = (index: number) => {
        setsalesReturnItems(salesReturnItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        if (salesReturnItems.length === 0) {
            toast.error("Please add at least one sales return item.");
            return;
        }
        try {
            const res = await fetch(
                selectedSaleReturn?.id ? `/api/sales-returns/${selectedSaleReturn.id}` : "/api/sales-returns",
                {
                    method: selectedSaleReturn?.id ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ date, items: salesReturnItems, customerName, paymentMethod, reason }),
                });
            if (res.ok) {
                toast.success(`Sales Return ${selectedSaleReturn?.id ? "updated" : "added"} successfully`);
                setDate(new Date().toISOString().split("T")[0]);
                setCustomerName("");
                setReason("");
                setPaymentMethod("");
                setsalesReturnItems([]);
                setSelectedSaleReturn(null);
                fetchData();
            } else {
                toast.error("Failed to add sales return");
            }
        } catch (error) {
            console.error("Error adding sales return:", error);
            toast.error("Error adding sales return");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Sales Return</h2>
                <button className="btn btn-primary" onClick={() => setSelectedSaleReturn({ id: 0, date: date, customerName: "", paymentMehthod: paymentMethod, reason: reason })}>
                    Add Sales Return
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
                        {paginatedSalesReturn.map((salesReturn, index) => (
                            <tr key={salesReturn.id}>
                                <td>{index + 1}</td>
                                <td>{salesReturn.customerName}</td>
                                <td>{new Date(salesReturn.date).toLocaleDateString("en-GB")}</td>
                                <td>{salesReturn.totalPrice}</td>
                                <td className="flex items-center space-x-2">
                                    <FiEye
                                        className="text-blue-500 cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => {
                                            setSelectedSaleReturn(salesReturn);
                                            setViewMode(true);
                                            setsalesReturnItems(salesReturn.salesReturnItems || []);
                                            setDate(new Date(salesReturn.date).toISOString().split("T")[0]);
                                            setPaymentMethod(salesReturn.paymentMehthod);
                                            setCustomerName(salesReturn.customerName);
                                            setReason(salesReturn.reason);
                                        }}
                                    />
                                    <FiEdit
                                        className="text-warning cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => {
                                            setSelectedSaleReturn(salesReturn);
                                            setViewMode(false);
                                            setsalesReturnItems(salesReturn.salesReturnItems || []);
                                            setDate(new Date(salesReturn.date).toISOString().split("T")[0]);
                                            setPaymentMethod(salesReturn.paymentMehthod);
                                            setCustomerName(salesReturn.customerName);
                                            setReason(salesReturn.reason);
                                        }
                                        }
                                    />
                                    <FiTrash2
                                        className="text-error cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => handleDelete(salesReturn.id)}
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

            {selectedSaleReturn && (
                <div className="modal modal-open flex items-center justify-center">
                    <div className="modal-box w-[80%] h-[80%] max-w-[90vw] max-h-[90vh] flex flex-col">
                        <h3 className="font-bold text-lg">
                            {viewMode ? "View Sales Return" : selectedSaleReturn.id ? "Edit Sales Return" : "Add Sales Return"}
                        </h3>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
                            <div className="flex flex-wrap gap-6 mt-3 items-center">
                                {/* Customer Name*/}
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Customer Name:</span>
                                    {viewMode ? (
                                        <span>{selectedSaleReturn.customerName || "N/A"}</span>
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
                                        <span>{new Date(selectedSaleReturn.date).toLocaleDateString("en-GB")}</span>
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

                                {/* Reason */}
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Reason:</span>
                                    {viewMode ? (
                                        <span>{selectedSaleReturn.reason || "N/A"}</span>
                                    ) : (
                                        <input
                                            type="text"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            required
                                            className="input input-bordered w-40"
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
                                <h4 className="font-semibold">Sales Return Items</h4>
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
                                    {salesReturnItems?.map((item, index) => (
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
                                                    <span>Rs{item.returnPrice}</span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        className="input input-bordered"
                                                        value={item.returnPrice === null ? "" : item.returnPrice}
                                                        onChange={(e) => updateItem(index, "returnPrice", e.target.value ? Number(e.target.value) : null)}
                                                        onBlur={() => {
                                                            if (item.returnPrice === null || item.returnPrice <= 0) {
                                                                toast.error("Price must be greater than zero");
                                                                updateItem(index, "returnPrice", null);
                                                            }
                                                        }}
                                                        required
                                                        placeholder="Enter Price"
                                                    />
                                                )}
                                            </td>
                                            <td>Rs{(item.quantity || 0) * (item.returnPrice || 0)}</td>
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
                                {salesReturnItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.returnPrice || 0), 0).toFixed(2)}
                            </div>

                            <div className="modal-action mt-auto">
                                {!viewMode && <button type="submit" className="btn btn-primary" disabled={isLoading}>Save</button>}
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => {
                                        setSelectedSaleReturn(null);
                                        setsalesReturnItems([]);
                                        setDate(new Date().toISOString().split("T")[0]);
                                        setViewMode(false);
                                        setCustomerName("");
                                        setPaymentMethod("");
                                        setReason("");
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