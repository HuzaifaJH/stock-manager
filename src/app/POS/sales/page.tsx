"use client";

import InvoiceTemplate from "@/app/utils/InvoiceTemplate";
import { SearchDropdown } from "@/components/search-dropdown";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiEye, FiPlusCircle, FiTrash2 } from "react-icons/fi";
import { FaPrint, FaRegFilePdf } from "react-icons/fa6";
import { Category, Subcategory, Product, Sales, SalesItem } from '@/app/utils/interfaces';
import dayjs from "dayjs";
import axios from "axios";
import { formatPKR } from "@/app/utils/amountFormatter";

export default function SalesPage() {

    const [sales, setSales] = useState<Sales[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sales | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [salesItems, setsalesItems] = useState<SalesItem[]>([]);
    const [customerName, setCustomerName] = useState<string>("Walk-in Customer");
    const [date, setDate] = useState(dayjs().format("YYYY-MM-DDTHH:mm"));
    const [isPaymentMethodCash, setIsPaymentMethodCash] = useState<boolean>(true);
    const [discount, setDiscount] = useState<number>(0);
    const [viewMode, setViewMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [hideWalkIn, setHideWalkIn] = useState(false);

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

    const filteredSales = sales.filter((sale) => {
        const matchesSearch = sale.customerName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCheckBox = hideWalkIn ? sale.customerName.toLowerCase() !== "walk-in customer" : true;
        return matchesSearch && matchesCheckBox;
    });

    const handleSort = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    const sortedSales = [...filteredSales].sort((a, b) => {
        return sortOrder === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    });

    const totalPages = Math.ceil(sortedSales.length / rowsPerPage) == 0 ? 1 : Math.ceil(sortedSales.length / rowsPerPage);
    const paginatedSales = sortedSales.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const addItem = () => {
        setsalesItems([...salesItems, { productId: "", quantity: null, sellingPrice: null, costPrice: null, stock: null, unit: "", categoryId: "", subCategoryId: "", lastSellingPrice: null }]);
    };

    const updateItem = (
        index: number,
        field: keyof SalesItem,
        value: string | number | null
    ) => {
        const newItems = [...salesItems];

        if (
            field === "quantity" ||
            field === "sellingPrice" ||
            field === "costPrice" ||
            field === "lastSellingPrice" ||
            field === "stock"
        ) {
            newItems[index][field] = value as number;
        } else if (field === "productId" && typeof value === "number") {
            newItems[index][field] = value;
        } else if (field === "unit" && typeof value === "string") {
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
                    body: JSON.stringify({ date, items: salesItems, customerName, isPaymentMethodCash, discount }),
                });
            if (res.ok) {
                toast.success(`Sales ${selectedSale?.id ? "updated" : "added"} successfully`);
                setDate(dayjs().format("YYYY-MM-DDTHH:mm"));
                setCustomerName("Walk-in Customer");
                setDiscount(0);
                setIsPaymentMethodCash(true);
                setsalesItems([]);
                setSelectedSale(null);
                fetchData();
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || "Unknown error");
            }
        } catch (error) {
            console.error("Error adding sales:", error);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unknown error occurred.");
            }
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

    // PRINT For WEB
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
    };

    // PRINT For DESKTOP
    const handlePrintInvoiceDesktop = () => {
        const printContents = document.getElementById("invoice")?.innerHTML;
        if (!printContents) return;

        const html = `
            <html>
            <head>
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
            <body>
                ${printContents}
            </body>
            </html>
        `;

        if (window?.electron?.ipcRenderer) {
            window.electron.ipcRenderer.send("print-content", html).catch((e) => console.error("Error in invoke:", e));
        } else {
            console.warn("Electron IPC not available.");
        }
    };

    // const handlePrintInvoiceDesktop = () => {
    //     const printContents = document.getElementById("invoice")?.innerHTML;

    //     if (!printContents) return;

    //     const html = `
    //       <html>
    //         <head>
    //           <title>Invoice</title>
    //           <style>
    //             body {
    //               font-family: monospace;
    //               font-size: 10px;
    //               padding: 10px;
    //             }
    //             table { width: 100%; border-collapse: collapse; }
    //             th, td { padding: 2px 0; }
    //             hr { border-top: 1px dashed #000; margin: 4px 0; }
    //           </style>
    //         </head>
    //         <body>
    //           ${printContents}
    //         </body>
    //       </html>
    //     `;

    //     // Use Electron's IPC renderer
    //     // if (window?.electron?.ipcRenderer) {
    //     //     console.log("request sent to IPC")
    //     //     window.electron.ipcRenderer.invoke('print-invoice-html', html);
    //     // } else {
    //     // fallback to browser printing
    //     // console.log("Not working")
    //     // }
    //     const printWindow = window.open('', '', 'width=400,height=600');

    //     if (printWindow) {
    //         printWindow.document.write(html);
    //         printWindow.document.close();

    //         printWindow.focus();

    //         printWindow.onload = () => {
    //             printWindow.print();

    //             printWindow.onafterprint = () => {
    //                 printWindow.close();
    //             };
    //         };
    //     }
    // };

    // Save PDF For DESKTOP
    
    const handleSaveAsPDFDesktop = () => {
        const printContents = document.getElementById("invoice")?.innerHTML;
        if (!printContents) {
            console.warn("No invoice content found");
            return;
        }

        const html = `
          <html>
            <head><style>body{font-size:10px;}</style></head>
            <body>${printContents}</body>
          </html>
        `;

        if (window?.electron?.ipcRenderer) {
            window.electron.ipcRenderer.invoke("save-invoice-pdf", html).catch((e) => console.error("Error in invoke:", e));
        } else {
            console.warn("Electron IPC not available.");
        }
    };

    const updatePrice = async (index: number, id: number) => {
        const { price, stock, unit } = products.find((x) => x.id == id) || {};
        // updateItem(index, "sellingPrice", price ? Number(price) : null);
        updateItem(index, "costPrice", price ? Number(price) : null);
        updateItem(index, "stock", stock ? stock : null);
        updateItem(index, "unit", unit ? unit : null);

        const response = await axios.get("/api/sales/last-price", {
            params: { productId: id },
        });
        if (response) {
            updateItem(index, "lastSellingPrice", Number(response.data.sellingPrice));
        } else {
            updateItem(index, "lastSellingPrice", 0);
        }
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Sales</h2>
                <button className="btn btn-primary" onClick={() => setSelectedSale({ id: 0, date: date, customerName: "", isPaymentMethodCash: isPaymentMethodCash, discount: discount })}>
                    Add Sales
                </button>
            </div>

            {/* Filters Section */}
            <div className="flex flex-wrap gap-4 mb-4 items-center">
                <input
                    type="text"
                    placeholder="Search by customer name"
                    className="input input-bordered w-full sm:max-w-sm"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                />
                <label className="flex items-center space-x-2 mb-2">
                    <input
                        type="checkbox"
                        checked={hideWalkIn}
                        onChange={(e) => {
                            setHideWalkIn(e.target.checked)
                            setCurrentPage(1);
                        }}
                    />
                    <span>Hide Walk-in Customers</span>
                </label>
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
                            <th>Payment</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSales.map((sales, index) => (
                            <tr key={sales.id}>
                                <td>{index + 1}</td>
                                <td>S#{sales.id}</td>
                                <td>{sales.customerName}</td>
                                <td>{new Date(sales.date).toLocaleDateString("en-GB")}</td>
                                <td>{formatPKR(sales.totalPrice ?? 0)}</td>
                                <td>
                                    {sales.isPaymentMethodCash ? (
                                        <span className="badge badge-success">Cash</span>
                                    ) : (
                                        <span className="badge badge-warning">Credit</span>
                                    )}
                                </td>
                                <td className="flex items-center space-x-2">
                                    <FiEye
                                        className="text-blue-500 cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => {
                                            setSelectedSale(sales);
                                            setViewMode(true);
                                            setsalesItems(sales.SalesItems || []);
                                            setDate(dayjs(sales.date).format("YYYY-MM-DDTHH:mm"));
                                            setIsPaymentMethodCash(sales.isPaymentMethodCash);
                                            setCustomerName(sales.customerName);
                                            setDiscount(sales.discount);
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
                                            setDate(dayjs(sales.date).format("YYYY-MM-DDTHH:mm"));
                                            setIsPaymentMethodCash(sales.isPaymentMethodCash);
                                            setCustomerName(sales.customerName);
                                            setDiscount(sales.discount);
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
                            {viewMode ? "View Sales" + " - S#" + selectedSale.id : selectedSale.id ? "Edit Sales" + " - S#" + selectedSale.id : "Add Sales"}
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
                                            className="input input-bordered w-full"
                                        />
                                    )}
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Date:</span>
                                    {viewMode ? (
                                        <span>{dayjs(selectedSale.date).format("YYYY-MM-DD HH:mm")}</span>
                                    ) : (
                                        <input
                                            type="datetime-local"
                                            className="input input-bordered w-full"
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

                            <div className="flex-1 mt-3">
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
                                                            onChange={(i, val) => { updateItem(i, "productId", val); updatePrice(i, val); }}
                                                            required={true}
                                                        />
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    {viewMode ? (
                                                        <span>{item.quantity} {item.Product?.unit}</span>
                                                    ) : (
                                                        <div className="mt-5">
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
                                                            <div className="flex justify-between text-xs text-gray-500 font-bold">
                                                                <span>
                                                                    Stock: {(item.Product?.stock ?? item.stock) ?? ""} {(item.Product?.unit ?? item.unit) ?? ""}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    {viewMode ? (
                                                        <span>{formatPKR(item.sellingPrice ?? 0)}</span>
                                                    ) : (
                                                        <div className="mt-5">
                                                            <input
                                                                type="number"
                                                                className="input input-bordered w-full mb-1"
                                                                value={item.sellingPrice === null ? "" : item.sellingPrice}
                                                                onChange={(e) => updateItem(index, "sellingPrice", e.target.value ? Number(e.target.value) : null)}
                                                                onBlur={() => {
                                                                    if (item.sellingPrice === null || item.sellingPrice <= 0) {
                                                                        toast.error("Selling price must be greater than zero");
                                                                        updateItem(index, "sellingPrice", null);
                                                                    }
                                                                }}
                                                                required
                                                                placeholder="Enter Price"
                                                            />
                                                            <div className="flex justify-between text-xs text-gray-500 font-bold">
                                                                <span>LSP: Rs {item.lastSellingPrice === null ? "" : item.lastSellingPrice}</span>
                                                                <span>CP: Rs {item.costPrice}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2">{formatPKR((item.quantity || 0) * (item.sellingPrice || 0))}</td>
                                                {!viewMode && (
                                                    <td className="p-2">
                                                        <FiTrash2 className="text-error cursor-pointer" size={20} onClick={() => removeItem(index)} />
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 flex flex-col items-end space-y-2">
                                <div className="font-semibold">
                                    Discount:
                                    {viewMode ? (
                                        <span className="ml-2">{formatPKR(selectedSale.discount)}</span>
                                    ) : (
                                        <input
                                            type="number"
                                            className="input input-bordered w-40 ml-2"
                                            value={discount || ""}
                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                            onBlur={(e) => {
                                                const amount = Number(e.target.value);
                                                if (amount < 0) {
                                                    toast.error("Discount must be greater than zero");
                                                    e.target.value = "";
                                                }
                                            }}
                                            placeholder="Enter Discount"
                                        />
                                    )}
                                </div>

                                <div className="font-semibold">
                                    Total:
                                    <span className="ml-2">{
                                        formatPKR(
                                            Number(
                                                salesItems.reduce(
                                                    (acc, item) => acc + (item.quantity || 0) * (item.sellingPrice || 0),
                                                    0
                                                ).toFixed(2)
                                            ) - (discount || 0)
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="modal-action mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                {viewMode ? (
                                    <div className="flex items-center gap-4">
                                        {typeof window !== "undefined" && (
                                            <>
                                                {!window.electron?.ipcRenderer && (
                                                    <FaPrint
                                                        className="cursor-pointer text-primary"
                                                        size={25}
                                                        onClick={handlePrintInvoice}
                                                    />
                                                )}

                                                {window.electron?.ipcRenderer && (
                                                    <>
                                                        <FaPrint
                                                            className="cursor-pointer text-primary"
                                                            size={25}
                                                            onClick={handlePrintInvoiceDesktop}
                                                        />
                                                        <FaRegFilePdf
                                                            className="cursor-pointer text-primary"
                                                            size={25}
                                                            onClick={handleSaveAsPDFDesktop}
                                                        />
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>

                                ) : (
                                    <button type="submit" className="btn btn-primary" disabled={isLoading} >
                                        Save
                                    </button>
                                )}

                                <button
                                    type="button" className="btn"
                                    onClick={() => {
                                        setSelectedSale(null);
                                        setsalesItems([]);
                                        setDate(dayjs().format("YYYY-MM-DDTHH:mm"));
                                        setViewMode(false);
                                        setCustomerName("Walk-in Customer");
                                        setDiscount(0);
                                        setIsPaymentMethodCash(true);
                                    }}
                                >
                                    {viewMode ? "Close" : "Cancel"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
            {
                viewMode && selectedSale && (
                    <div className="hidden">
                        <InvoiceTemplate sale={selectedSale} />
                    </div>
                )
            }
        </div >
    );
}