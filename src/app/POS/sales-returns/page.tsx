"use client";

import { SearchDropdown } from "@/components/search-dropdown";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiEye, FiPlusCircle, FiTrash2 } from "react-icons/fi";
import { Category, Subcategory, Product, SalesReturn, SalesReturnItem } from '@/app/utils/interfaces';
import { formatPKR } from "@/app/utils/amountFormatter";

export default function SalesReturnPage() {

    const [salesReturn, setSalesReturn] = useState<SalesReturn[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSaleReturn, setSelectedSaleReturn] = useState<SalesReturn | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [salesReturnItems, setsalesReturnItems] = useState<SalesReturnItem[]>([]);
    const [customerName, setCustomerName] = useState<string>("");
    const [reason, setReason] = useState<string>("");
    const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [isPaymentMethodCash, setIsPaymentMethodCash] = useState<boolean>(true);
    const [viewMode, setViewMode] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [salesReturnRes, productsRes, categoriesRes, subcategoriesRes] = await Promise.all([
                fetch("/api/sales-returns"),
                fetch("/api/products"),
                fetch("/api/categories"),
                fetch("/api/subcategories"),
            ]);
            const [salesReturnData, productsData, categoriesData, subcategoriesData] = await Promise.all([
                salesReturnRes.json(),
                productsRes.json(),
                categoriesRes.json(),
                subcategoriesRes.json()
            ]);
            setSalesReturn(salesReturnData);
            setProducts(productsData);
            setCategories(categoriesData);
            setSubcategories(subcategoriesData);
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
        setsalesReturnItems([...salesReturnItems, { productId: "", quantity: null, returnPrice: null, categoryId: "", subCategoryId: "" }]);
    };

    const updateItem = (index: number, field: keyof SalesReturnItem, value: number | null) => {
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
                    body: JSON.stringify({ date, items: salesReturnItems, customerName, isPaymentMethodCash, reason }),
                });
            if (res.ok) {
                toast.success(`Sales Return ${selectedSaleReturn?.id ? "updated" : "added"} successfully`);
                setDate(new Date().toISOString().split("T")[0]);
                setCustomerName("");
                setReason("");
                setIsPaymentMethodCash(true);
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

    const handleCategoryChange = (index: number, categoryId: number) => {
        const newItems = [...salesReturnItems];

        newItems[index].categoryId = categoryId;
        newItems[index].subCategoryId = "";
        newItems[index].productId = "";
        newItems[index].filteredSubcategories = subcategories.filter(sc => sc.categoryId === categoryId);
        newItems[index].filteredProducts = [];

        setsalesReturnItems(newItems);
    };

    const handleSubCategoryChange = (index: number, subCategoryId: number) => {
        const newItems = [...salesReturnItems];

        newItems[index].subCategoryId = subCategoryId;
        newItems[index].productId = "";
        newItems[index].filteredProducts = products.filter(p => p.subCategoryId === subCategoryId);

        setsalesReturnItems(newItems);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Sales Return</h2>
                <button className="btn btn-primary" onClick={() => setSelectedSaleReturn({ id: 0, date: date, customerName: "", isPaymentMethodCash: isPaymentMethodCash, reason: reason })}>
                    Add Sales Return
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra border-2">
                    <thead className="border-2">
                        <tr>
                            <th>#</th>
                            <th>Ref no.</th>
                            <th>Customer Name</th>
                            <th className="cursor-pointer" onClick={handleSort}>
                                Date {sortOrder === "asc" ? "↑" : "↓"}
                            </th>
                            <th>Total Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSalesReturn.map((salesReturn, index) => (
                            <tr key={salesReturn.id}>
                                <td>{index + 1}</td>
                                <td>SR#{salesReturn.id}</td>
                                <td>{salesReturn.customerName}</td>
                                <td>{new Date(salesReturn.date).toLocaleDateString("en-GB")}</td>
                                <td>{formatPKR(salesReturn.totalPrice ?? 0)}</td>
                                <td className="flex items-center space-x-2">
                                    <FiEye
                                        className="text-blue-500 cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => {
                                            setSelectedSaleReturn(salesReturn);
                                            setViewMode(true);
                                            setsalesReturnItems(salesReturn.SalesReturnItems || []);
                                            setDate(new Date(salesReturn.date).toISOString().split("T")[0]);
                                            setIsPaymentMethodCash(salesReturn.isPaymentMethodCash);
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

                                            const enrichedItems = salesReturn.SalesReturnItems?.map((item) => {
                                                const itemFilteredSubcategories = subcategories.filter(
                                                    (sc) => sc.categoryId === item.categoryId
                                                );

                                                const itemFilteredProducts = products.filter(
                                                    (p) => p.subCategoryId === item.subCategoryId
                                                );

                                                return {
                                                    ...item,
                                                    filteredSubcategories: itemFilteredSubcategories,
                                                    filteredProducts: itemFilteredProducts,
                                                };
                                            });

                                            setsalesReturnItems(enrichedItems || []);
                                            setDate(new Date(salesReturn.date).toISOString().split("T")[0]);
                                            setIsPaymentMethodCash(salesReturn.isPaymentMethodCash);
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
                    <div className="modal-box w-[90%] h-[90%] max-w-[90vw] max-h-[90vh] flex flex-col">
                        <h3 className="font-bold text-lg">
                            {viewMode ? "View Sales Return" + " - SR#" + selectedSaleReturn.id : selectedSaleReturn.id ? "Edit Sales Return" + " - SR#" + selectedSaleReturn.id : "Add Sales Return"}
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
                                <div className="flex items-center gap-4">
                                    <span className="font-medium">Payment Method:</span>
                                    {viewMode ? (
                                        <span>{isPaymentMethodCash ? "CASH" : "CREDIT"}</span>
                                    ) : (
                                        <div className="form-control">
                                            <label className="label cursor-pointer gap-4">
                                                <span className="label-text">Credit</span>
                                                <input
                                                    type="checkbox"
                                                    className="toggle toggle-primary"
                                                    checked={isPaymentMethodCash === true}
                                                    onChange={(e) =>
                                                        setIsPaymentMethodCash(e.target.checked ? true : false)
                                                    }
                                                />
                                                <span className="label-text">Cash</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex mt-4">
                                <h4 className="font-semibold">Sales Return Items</h4>
                                {!viewMode && <FiPlusCircle className="cursor-pointer text-green-500 ml-4" size={25} onClick={addItem} />}
                            </div>

                            <table className="table w-full table-zebra border-2">
                                <thead className="border-2">
                                    <tr className="text-sm">
                                        <th className="w-[14.28%]">Category</th>
                                        <th className="w-[14.28%]">Sub Category</th>
                                        <th className="w-[14.28%]">Product</th>
                                        <th className="w-[14.28%]">Quantity</th>
                                        <th className="w-[14.28%]">Price</th>
                                        <th className="w-[14.28%]">Total Price</th>
                                        {!viewMode && <th className="w-[14.28%]">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesReturnItems?.map((item, index) => (
                                        <tr key={index}>
                                            <td className="p-2">
                                                {viewMode ? (
                                                    <span>{item.Product?.Category.name || "N/A"}</span>
                                                ) : (
                                                    <SearchDropdown
                                                        placeholder={"Select Category"}
                                                        index={index}
                                                        items={categories || []}
                                                        selectedItemId={item.categoryId || ""}
                                                        onChange={(i, val) => {
                                                            updateItem(i, "categoryId", val);
                                                            handleCategoryChange(index, Number(val));
                                                        }}
                                                        required={true}
                                                    />
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {viewMode ? (
                                                    <span>{item.Product?.SubCategory.name || "N/A"}</span>
                                                ) : (
                                                    <SearchDropdown
                                                        placeholder={"Select Sub Category"}
                                                        index={index}
                                                        items={item.filteredSubcategories || []}
                                                        selectedItemId={item.subCategoryId || ""}
                                                        onChange={(i, val) => {
                                                            updateItem(i, "subCategoryId", val);
                                                            handleSubCategoryChange(index, Number(val));
                                                        }}
                                                        required={true}
                                                    />
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {viewMode ? (
                                                    <span>{item.Product?.name || "N/A"}</span>
                                                ) : (
                                                    <SearchDropdown
                                                        placeholder={"Select Product"}
                                                        index={index}
                                                        items={item.filteredProducts || []}
                                                        selectedItemId={item.productId || ""}
                                                        onChange={(i, val) => updateItem(i, "productId", val)}
                                                        required={true}
                                                    />
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {viewMode ? (
                                                    <span>{item.quantity}</span>
                                                ) : (
                                                    <input
                                                        step={0.25}
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
                                            <td className="p-2">
                                                {viewMode ? (
                                                    <span>{formatPKR(item.returnPrice ?? 0)}</span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        className="input input-bordered"
                                                        value={item.returnPrice === null ? "" : item.returnPrice}
                                                        onChange={(e) => updateItem(index, "returnPrice", e.target.value ? Number(e.target.value) : null)}
                                                        onBlur={() => {
                                                            if (item.returnPrice === null || item.returnPrice <= 0) {
                                                                toast.error("Sales Return price must be greater than zero");
                                                                updateItem(index, "returnPrice", null);
                                                            }
                                                        }}
                                                        required
                                                        placeholder="Enter Price"
                                                    />
                                                )}
                                            </td>
                                            <td className="p-2">{formatPKR((item.quantity || 0) * (item.returnPrice || 0))}</td>
                                            {!viewMode && (
                                                <td className="p-2">
                                                    <FiTrash2 className="text-error cursor-pointer" size={20} onClick={() => removeItem(index)} />
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-4 font-semibold text-right">
                                Total:
                                <span className="ml-2">{
                                    formatPKR(salesReturnItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.returnPrice || 0), 0))}
                                </span>
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
                                        setIsPaymentMethodCash(true);
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