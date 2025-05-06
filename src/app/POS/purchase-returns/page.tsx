"use client";

import { SearchDropdown } from "@/components/search-dropdown";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiEye, FiPlusCircle, FiTrash2 } from "react-icons/fi";
import { Category, Subcategory, Product, Supplier, PurchaseReturn, PurchaseReturnItem } from '@/app/utils/interfaces';

export default function PurchaseReturnPage() {

    const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    // const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    // const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPurchaseReturn, setSelectedPurchaseReturn] = useState<PurchaseReturn | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [purchaseReturnItems, setPurchaseReturnItems] = useState<PurchaseReturnItem[]>([]);
    const [supplierId, setSupplierId] = useState<number | "">("");
    const [isPaymentMethodCash, setIsPaymentMethodCash] = useState<boolean>(true);
    const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [viewMode, setViewMode] = useState(false);
    const [reason, setReason] = useState<string>("");

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [purchaseReturnRes, suppliersRes, productsRes, categoriesRes, subcategoriesRes] = await Promise.all([
                fetch("/api/purchase-returns"),
                fetch("/api/suppliers"),
                fetch("/api/products"),
                fetch("/api/categories"),
                fetch("/api/subcategories"),
            ]);
            const [purchaseReturnsData, suppliersData, productsData, categoriesData, subcategoriesData] = await Promise.all([
                purchaseReturnRes.json(),
                suppliersRes.json(),
                productsRes.json(),
                categoriesRes.json(),
                subcategoriesRes.json()
            ]);
            setPurchaseReturns(purchaseReturnsData);
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
        if (!confirm("Are you sure you want to delete this purchase return?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/purchase-returns/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Purchase Return deleted successfully");
                fetchData();
            } else {
                toast.error("Failed to delete purchase return");
            }
        } catch (error) {
            toast.error("Error deleting purchase return: " + error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    const sortedPurchaseReturns = [...purchaseReturns].sort((a, b) => {
        return sortOrder === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    });

    const totalPages = Math.ceil(sortedPurchaseReturns.length / rowsPerPage) == 0 ? 1 : Math.ceil(sortedPurchaseReturns.length / rowsPerPage);
    const paginatedPurchaseReturns = sortedPurchaseReturns.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const addItem = () => {
        setPurchaseReturnItems([...purchaseReturnItems, { productId: "", quantity: null, purchaseReturnPrice: null, categoryId: "", subCategoryId: "" }]);
    };

    const updateItem = (index: number, field: keyof PurchaseReturnItem, value: number | null) => {
        const newItems = [...purchaseReturnItems];

        // newItems[index][field] = value as never;
        if (field === "quantity" || field === "purchaseReturnPrice") {
            newItems[index][field] = value;
        } else if ((field === "productId" || field === "categoryId" || field === "subCategoryId") && value !== null) {
            newItems[index][field] = value;
        }

        setPurchaseReturnItems(newItems);
    };

    const removeItem = (index: number) => {
        setPurchaseReturnItems(purchaseReturnItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        if (purchaseReturnItems.length === 0) {
            toast.error("Please add at least one purchase return item.");
            return;
        }
        try {
            const res = await fetch(
                selectedPurchaseReturn?.id ? `/api/purchase-returns/${selectedPurchaseReturn.id}` : "/api/purchase-returns",
                {
                    method: selectedPurchaseReturn?.id ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ supplierId, date, items: purchaseReturnItems, isPaymentMethodCash, reason }),
                });
            if (res.ok) {
                toast.success(`Purchase Return ${selectedPurchaseReturn?.id ? "updated" : "added"} successfully`);
                setSupplierId("");
                setIsPaymentMethodCash(true);
                setDate(new Date().toISOString().split("T")[0]);
                setPurchaseReturnItems([]);
                setSelectedPurchaseReturn(null);
                fetchData();
            } else {
                toast.error("Failed to add purchase return");
            }
        } catch (error) {
            console.error("Error adding purchase return:", error);
            toast.error("Error adding purchase return");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCategoryChange = (index: number, categoryId: number) => {
        const newItems = [...purchaseReturnItems];

        newItems[index].categoryId = categoryId;
        newItems[index].subCategoryId = "";
        newItems[index].productId = "";
        newItems[index].filteredSubcategories = subcategories.filter(sc => sc.categoryId === categoryId);
        newItems[index].filteredProducts = [];

        setPurchaseReturnItems(newItems);
    };

    const handleSubCategoryChange = (index: number, subCategoryId: number) => {
        const newItems = [...purchaseReturnItems];

        newItems[index].subCategoryId = subCategoryId;
        newItems[index].productId = "";
        newItems[index].filteredProducts = products.filter(p => p.subCategoryId === subCategoryId);

        setPurchaseReturnItems(newItems);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Purchase Returns</h2>
                <button className="btn btn-primary" onClick={() => setSelectedPurchaseReturn({ id: 0, supplierId: supplierId, date: date, isPaymentMethodCash: isPaymentMethodCash, reason: reason })}>
                    Add Purchase Return
                </button>
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
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPurchaseReturns.map((purchaseReturns, index) => (
                            <tr key={purchaseReturns.id}>
                                <td>{index + 1}</td>
                                <td>PR#{purchaseReturns.id}</td>
                                <td>{purchaseReturns.Supplier?.name}</td>
                                <td>{new Date(purchaseReturns.date).toLocaleDateString("en-GB")}</td>
                                <td>{purchaseReturns.totalPrice}</td>
                                <td className="flex items-center space-x-2">
                                    <FiEye
                                        className="text-blue-500 cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => {
                                            setSelectedPurchaseReturn(purchaseReturns);
                                            setViewMode(true);
                                            setPurchaseReturnItems(purchaseReturns.PurchaseReturnItems || []);
                                            setSupplierId(purchaseReturns.supplierId);
                                            setIsPaymentMethodCash(purchaseReturns.isPaymentMethodCash);
                                            setDate(new Date(purchaseReturns.date).toISOString().split("T")[0]);
                                            setReason(purchaseReturns.reason);
                                        }}
                                    />
                                    <FiEdit
                                        className="text-warning cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => {
                                            setSelectedPurchaseReturn(purchaseReturns);
                                            setViewMode(false);

                                            const enrichedItems = purchaseReturns.PurchaseReturnItems?.map((item) => {
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
                                            setPurchaseReturnItems(enrichedItems || []);
                                            setSupplierId(purchaseReturns.supplierId);
                                            setIsPaymentMethodCash(purchaseReturns.isPaymentMethodCash);
                                            setDate(new Date(purchaseReturns.date).toISOString().split("T")[0]);
                                            setReason(purchaseReturns.reason);
                                        }
                                        }
                                    />
                                    <FiTrash2
                                        className="text-error cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => handleDelete(purchaseReturns.id)}
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

            {selectedPurchaseReturn && (
                <div className="modal modal-open flex items-center justify-center">
                    <div className="modal-box w-[90%] h-[90%] max-w-[90vw] max-h-[90vh] flex flex-col">
                        <h3 className="font-bold text-lg">
                            {viewMode ? "View Purchase Return" + " - PR#" + selectedPurchaseReturn.id : selectedPurchaseReturn.id ? "Edit Purchase Return" + " - PR#" + selectedPurchaseReturn.id : "Add Purchase Return"}
                        </h3>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
                            <div className="flex flex-wrap gap-6 mt-3 items-center">
                                {/* Supplier */}
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Supplier:</span>
                                    {viewMode ? (
                                        <span>{selectedPurchaseReturn.Supplier?.name || "N/A"}</span>
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
                                        <span>{new Date(selectedPurchaseReturn.date).toLocaleDateString("en-GB")}</span>
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
                                        <span>{selectedPurchaseReturn.reason || "N/A"}</span>
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
                                <h4 className="font-semibold">Purchase Return Items</h4>
                                {!viewMode && <FiPlusCircle className="cursor-pointer text-green-500 ml-4" size={25} onClick={addItem} />}
                            </div>

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
                                    {purchaseReturnItems?.map((item, index) => (
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
                                                    <span>Rs {item.purchaseReturnPrice}</span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        className="input input-bordered w-full"
                                                        value={item.purchaseReturnPrice === null ? "" : item.purchaseReturnPrice}
                                                        onChange={(e) => updateItem(index, "purchaseReturnPrice", e.target.value ? Number(e.target.value) : null)}
                                                        onBlur={() => {
                                                            if (item.purchaseReturnPrice === null || item.purchaseReturnPrice <= 0) {
                                                                toast.error("Purchase Return price must be greater than zero");
                                                                updateItem(index, "purchaseReturnPrice", null);
                                                            }
                                                        }}
                                                        required
                                                        placeholder="Enter Price"
                                                    />
                                                )}
                                            </td>
                                            <td className="p-2">Rs {(item.quantity || 0) * (item.purchaseReturnPrice || 0)}</td>
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
                                {purchaseReturnItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.purchaseReturnPrice || 0), 0).toFixed(2)}
                            </div>

                            <div className="modal-action mt-auto">
                                {!viewMode && <button type="submit" className="btn btn-primary" disabled={isLoading}>Save</button>}
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => {
                                        setSelectedPurchaseReturn(null);
                                        setPurchaseReturnItems([]);
                                        setSupplierId("");
                                        setIsPaymentMethodCash(true);
                                        setDate(new Date().toISOString().split("T")[0]);
                                        setViewMode(false);
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