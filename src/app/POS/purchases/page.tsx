"use client";

import { SearchDropdown } from "@/components/search-dropdown";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiEye, FiPlusCircle, FiTrash2 } from "react-icons/fi";
import { Category, Subcategory, Product, Supplier, Purchase, PurchaseItem } from '@/app/utils/interfaces';
import dayjs from "dayjs";

export default function PurchasesPage() {

    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    // const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    // const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
    const [supplierId, setSupplierId] = useState<number | "">("");
    const [isPaymentMethodCash, setIsPaymentMethodCash] = useState<boolean>(true);
    const [date, setDate] = useState(dayjs().format("YYYY-MM-DDTHH:mm"));
    const [viewMode, setViewMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [purchasesRes, suppliersRes, productsRes, categoriesRes, subcategoriesRes] = await Promise.all([
                fetch("/api/purchases"),
                fetch("/api/suppliers"),
                fetch("/api/products"),
                fetch("/api/categories"),
                fetch("/api/subcategories"),
            ]);
            const [purchasesData, suppliersData, productsData, categoriesData, subcategoriesData] = await Promise.all([
                purchasesRes.json(),
                suppliersRes.json(),
                productsRes.json(),
                categoriesRes.json(),
                subcategoriesRes.json()
            ]);
            setPurchases(purchasesData);
            setSuppliers(suppliersData);
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

    const filteredPurchases = purchases.filter(purchase =>
        purchase.Supplier?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSort = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    const sortedPurchases = [...filteredPurchases].sort((a, b) => {
        return sortOrder === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    });

    const totalPages = Math.ceil(sortedPurchases.length / rowsPerPage) == 0 ? 1 : Math.ceil(sortedPurchases.length / rowsPerPage);
    const paginatedPurchases = sortedPurchases.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const addItem = () => {
        setPurchaseItems([...purchaseItems, { productId: "", quantity: null, purchasePrice: null, categoryId: "", subCategoryId: "" }]);
    };

    const updateItem = (index: number, field: keyof PurchaseItem, value: number | null) => {
        const newItems = [...purchaseItems];

        // newItems[index][field] = value as never;
        if (field === "quantity" || field === "purchasePrice") {
            newItems[index][field] = value;
        } else if ((field === "productId" || field === "categoryId" || field === "subCategoryId") && value !== null) {
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
                    body: JSON.stringify({ supplierId, date, items: purchaseItems, isPaymentMethodCash }),
                });
            if (res.ok) {
                toast.success(`Purchase ${selectedPurchase?.id ? "updated" : "added"} successfully`);
                setSupplierId("");
                setIsPaymentMethodCash(true);
                setDate(dayjs().format("YYYY-MM-DDTHH:mm"));
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

    const handleCategoryChange = (index: number, categoryId: number) => {
        const newItems = [...purchaseItems];

        newItems[index].categoryId = categoryId;
        newItems[index].subCategoryId = "";
        newItems[index].productId = "";
        newItems[index].filteredSubcategories = subcategories.filter(sc => sc.categoryId === categoryId);
        newItems[index].filteredProducts = [];

        setPurchaseItems(newItems);
    };

    const handleSubCategoryChange = (index: number, subCategoryId: number) => {
        const newItems = [...purchaseItems];

        newItems[index].subCategoryId = subCategoryId;
        newItems[index].productId = "";
        newItems[index].filteredProducts = products.filter(p => p.subCategoryId === subCategoryId);

        setPurchaseItems(newItems);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Purchases</h2>
                <button className="btn btn-primary" onClick={() => setSelectedPurchase({ id: 0, supplierId: supplierId, date: date, isPaymentMethodCash: isPaymentMethodCash })}>
                    Add Purchase
                </button>
            </div>

            {/* Filters Section */}
            <div className="flex flex-wrap gap-4 mb-4 items-center">
                <input
                    type="text"
                    placeholder="Search by supplier name"
                    className="input input-bordered w-full sm:max-w-sm"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra border-2">
                    <thead className="border-2">
                        <tr>
                            <th>#</th>
                            <th>Ref no.</th>
                            <th>Supplier</th>
                            <th className="cursor-pointer" onClick={handleSort}>
                                Date {sortOrder === "asc" ? "↑" : "↓"}
                            </th>
                            <th>Total Price (Rs)</th>
                            <th>Payment</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPurchases.map((purchase, index) => (
                            <tr key={purchase.id}>
                                <td>{index + 1}</td>
                                <td>P#{purchase.id}</td>
                                <td>{purchase.Supplier?.name}</td>
                                <td>{new Date(purchase.date).toLocaleDateString("en-GB")}</td>
                                <td>{purchase.totalPrice}</td>
                                <td>
                                    {purchase.isPaymentMethodCash ? (
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
                                            setSelectedPurchase(purchase);
                                            setViewMode(true);
                                            setPurchaseItems(purchase.PurchaseItems || []);
                                            setSupplierId(purchase.supplierId);
                                            setIsPaymentMethodCash(purchase.isPaymentMethodCash);
                                            setDate(dayjs(purchase.date).format("YYYY-MM-DDTHH:mm"));
                                        }}
                                    />
                                    <FiEdit
                                        className="text-warning cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => {
                                            setSelectedPurchase(purchase);
                                            setViewMode(false);

                                            const enrichedItems = purchase.PurchaseItems?.map((item) => {
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
                                            setPurchaseItems(enrichedItems || []);
                                            setSupplierId(purchase.supplierId);
                                            setIsPaymentMethodCash(purchase.isPaymentMethodCash);
                                            setDate(dayjs(purchase.date).format("YYYY-MM-DDTHH:mm"));
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
                    <div className="modal-box w-[90%] h-[90%] max-w-[90vw] max-h-[90vh] flex flex-col">
                        <h3 className="font-bold text-lg">
                            {viewMode ? "View Purchase" + " - P#" + selectedPurchase.id : selectedPurchase.id ? "Edit Purchase" + " - P#" + selectedPurchase.id : "Add Purchase"}
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
                                            className="select select-bordered w-full"
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
                                        <span>{dayjs(selectedPurchase.date).format("YYYY-MM-DD HH:mm")}</span>
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
                                <h4 className="font-semibold">Purchase Items</h4>
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
                                            <th className="w-[14.28%]">Price (Rs)</th>
                                            <th className="w-[14.28%]">Total Price (Rs)</th>
                                            {!viewMode && <th className="w-[14.28%]">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {purchaseItems?.map((item, index) => (
                                            <tr key={index} className="text-sm">
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
                                                            className="input input-bordered w-full"
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
                                                        <span>Rs {item.purchasePrice}</span>
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            className="input input-bordered w-full"
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
                                                <td className="p-2">Rs {(item.quantity || 0) * (item.purchasePrice || 0)}</td>
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
                                        setIsPaymentMethodCash(true);
                                        setDate(dayjs().format("YYYY-MM-DDTHH:mm"));
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