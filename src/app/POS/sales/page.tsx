"use client";

import InvoiceTemplate from "@/app/utils/InvoiceTemplate";
import { SearchDropdown } from "@/components/search-dropdown";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiEye, FiPlusCircle, FiTrash2 } from "react-icons/fi";

interface Product {
    id: number;
    name: string;
    subCategoryId: number;
    categoryId: number;
    Category: Category;
    SubCategory: Subcategory;
}

interface Sales {
    id: number;
    date: string;
    SalesItems?: salesItem[];
    totalPrice?: number;
    customerName: string;
    isPaymentMethodCash: boolean;
}

interface salesItem {
    productId: number | "";
    categoryId: number | "";
    subCategoryId: number | "";
    quantity: number | null;
    price: number | null;
    Product?: Product;
    filteredSubcategories?: Subcategory[];
    filteredProducts?: Product[];
}

interface Category {
    id: number;
    name: string;
}

interface Subcategory {
    id: number;
    name: string;
    categoryId: number;
    Category?: Category;
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
    const [isPaymentMethodCash, setIsPaymentMethodCash] = useState<boolean>(true);
    const [viewMode, setViewMode] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [salesRes, productsRes, categoriesRes, subcategoriesRes] = await Promise.all([
                fetch("/api/sales"),
                fetch("/api/products/in-stock"),
                fetch("/api/categories"),
                fetch("/api/subcategories"),
            ]);
            const [salesData, productsData, categoriesData, subcategoriesData] = await Promise.all([
                salesRes.json(),
                productsRes.json(),
                categoriesRes.json(),
                subcategoriesRes.json()
            ]);
            setSales(salesData);
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
        setsalesItems([...salesItems, { productId: "", quantity: null, price: null, categoryId: "", subCategoryId: "" }]);
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
        if (viewMode) {
            e.preventDefault();
            return;
        }
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
                    body: JSON.stringify({ date, items: salesItems, customerName, isPaymentMethodCash }),
                });
            if (res.ok) {
                toast.success(`Sales ${selectedSale?.id ? "updated" : "added"} successfully`);
                setDate(new Date().toISOString().split("T")[0]);
                setCustomerName("");
                setIsPaymentMethodCash(true);
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

    const handleCategoryChange = (index: number, categoryId: number) => {
        const newItems = [...salesItems];

        newItems[index].categoryId = categoryId;
        newItems[index].subCategoryId = "";
        newItems[index].productId = "";
        newItems[index].filteredSubcategories = subcategories.filter(sc => sc.categoryId === categoryId);
        newItems[index].filteredProducts = [];

        setsalesItems(newItems);
    };

    const handleSubCategoryChange = (index: number, subCategoryId: number) => {
        const newItems = [...salesItems];

        newItems[index].subCategoryId = subCategoryId;
        newItems[index].productId = "";
        newItems[index].filteredProducts = products.filter(p => p.subCategoryId === subCategoryId);

        setsalesItems(newItems);
    };

    const handlePrintInvoice = () => {
        const printContents = document.getElementById("invoice")?.innerHTML;
        const printWindow = window.open("", "", "width=400,height=600");
        printWindow?.document.write(`
          <html>
            <head>
              <title>Invoice</title>
              <style>
                body {
                  font-family: monospace;
                  font-size: 10px;
                  padding: 10px;
                }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 2px 0; }
                hr { border-top: 1px dashed #000; margin: 4px 0; }
              </style>
            </head>
            <body onload="window.print(); window.close();">
              ${printContents}
            </body>
          </html>
        `);
        // printWindow?.document.close();
    };


    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Sales</h2>
                <button className="btn btn-primary" onClick={() => setSelectedSale({ id: 0, date: date, customerName: "", isPaymentMethodCash: isPaymentMethodCash })}>
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
                                            setsalesItems(sales.SalesItems || []);
                                            setDate(new Date(sales.date).toISOString().split("T")[0]);
                                            setIsPaymentMethodCash(sales.isPaymentMethodCash);
                                            setCustomerName(sales.customerName);
                                        }}
                                    />
                                    <FiEdit
                                        className="text-warning cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => {
                                            setSelectedSale(sales);
                                            setViewMode(false);

                                            const enrichedItems = sales.SalesItems?.map((item) => {
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

                                            setsalesItems(enrichedItems || []);
                                            setDate(new Date(sales.date).toISOString().split("T")[0]);
                                            setIsPaymentMethodCash(sales.isPaymentMethodCash);
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
                    <div className="modal-box w-[90%] h-[90%] max-w-[90vw] max-h-[90vh] flex flex-col">
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
                                <h4 className="font-semibold">Sales Items</h4>
                                {!viewMode && <FiPlusCircle className="cursor-pointer text-green-500 ml-4" size={25} onClick={addItem} />}
                            </div>

                            <table className="table w-full mt-3">
                                <thead>
                                    <tr className="text-sm">
                                        <th className="w-[14.28%]">Category</th>
                                        <th className="w-[14.28%]">Sub Category</th>
                                        <th className="w-[14.28%]">Product</th>
                                        <th className="w-[14.28%]">Quantity</th>
                                        <th className="w-[14.28%]">Price (Rs)</th>
                                        <th className="w-[14.28%]">Total Price (Rs)</th>
                                        {!viewMode && <th className="w-[14.28%]">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesItems?.map((item, index) => (
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
                                            <td className="p-2">Rs{(item.quantity || 0) * (item.price || 0)}</td>
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
                                        setIsPaymentMethodCash(true);
                                    }}
                                >
                                    {viewMode ? "Close" : "Cancel"}
                                </button>
                                {viewMode &&
                                    <button
                                        className="btn btn-primary"
                                        onClick={handlePrintInvoice}
                                    >
                                        🖨️ Print Invoice
                                    </button>
                                }
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {viewMode && selectedSale && (
                <div className="hidden">
                    <InvoiceTemplate sale={selectedSale} />
                </div>
            )}
        </div>
    );
}