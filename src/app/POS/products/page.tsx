"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiTrash2 } from "react-icons/fi";
import { Category, Subcategory, Product, ProductSort, Transaction } from '@/app/utils/interfaces';
import { formatPKR } from "@/app/utils/amountFormatter";

export default function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [sortKey, setSortKey] = useState<keyof ProductSort | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | null>(null);

    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [productRecords, setProductRecords] = useState<Transaction[]>([]);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchSubcategories();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories: ", error);
        }
    };

    const fetchSubcategories = async () => {
        try {
            const res = await fetch("/api/subcategories");
            const data = await res.json();
            setSubcategories(data);
        } catch (error) {
            console.error("Error fetching subcategories: ", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
            const data = await res.json();

            if (res.ok) {
                toast.success("Product deleted successfully");
                fetchProducts();
            } else {
                toast.error(data.error || "Failed to delete product");
            }
        } catch (error) {
            console.error("Delete error: ", error);
            toast.error("Error deleting product");
        } finally {
            setIsLoading(false);
        }
    };

    // Sorting Logic
    const handleSort = (key: keyof ProductSort) => {
        setSortKey(key);
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    // const sortedProducts = [...products].sort((a, b) => {
    //     if (!sortKey) return 0;
    //     if (sortKey === "name") {
    //         return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    //     }
    //     if (sortKey === "category" || sortKey === "SubCategory") {
    //         return sortOrder === "asc"
    //             ? (a.Category?.name || "").localeCompare(b.Category?.name || "")
    //             : (b.Category?.name || "").localeCompare(a.Category?.name || "");
    //     }
    //     return sortOrder === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
    // });

    {/* Filtered, Sorted & Paginated Data */ }
    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategoryId ? product.categoryId === selectedCategoryId : true;
        const matchesSubCategory = selectedSubCategoryId ? product.subCategoryId === selectedSubCategoryId : true;
        return matchesSearch && matchesCategory && matchesSubCategory;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (!sortKey) return 0;
        if (sortKey === "name") {
            return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortKey === "category") {
            return sortOrder === "asc"
                ? (a.Category?.name || "").localeCompare(b.Category?.name || "")
                : (b.Category?.name || "").localeCompare(a.Category?.name || "");
        }
        if (sortKey === "SubCategory") {
            return sortOrder === "asc"
                ? (a.SubCategory?.name || "").localeCompare(b.SubCategory?.name || "")
                : (b.SubCategory?.name || "").localeCompare(a.SubCategory?.name || "");
        }
        return sortOrder === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
    });

    // Pagination Logic
    const totalPages = Math.ceil(sortedProducts.length / rowsPerPage);
    const paginatedProducts = sortedProducts.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleCategoryChange = (categoryId: number) => {
        // setSelectedCategory(categoryId);
        // Filter subcategories based on selected category
        setSubcategories(subcategories.filter(subcategory => subcategory.categoryId === categoryId));
    };

    const openModal = async (productId: number) => {
        const res = await fetch(`/api/products/${productId}/transactions`);
        const data = await res.json();
        setProductRecords(data);
        setStockModalOpen(true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Product List</h2>
                <button className="btn btn-primary mb-4" onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}>
                    + Add Product
                </button>
            </div>

            {/* Filters Section */}
            <div className="flex flex-wrap gap-4 mb-4 items-center">
                <input
                    type="text"
                    placeholder="Search by name"
                    className="input input-bordered w-full sm:max-w-xs"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                />

                <select
                    className="select select-bordered w-full sm:max-w-xs"
                    value={selectedCategoryId || ""}
                    onChange={(e) => {
                        const catId = Number(e.target.value);
                        setSelectedCategoryId(catId);
                        setCurrentPage(1);
                        setSelectedSubCategoryId(null);
                        setFilteredSubcategories(subcategories.filter(sc => sc.categoryId == catId));
                    }}
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <select
                    className="select select-bordered w-full sm:max-w-xs"
                    value={selectedSubCategoryId || ""}
                    onChange={(e) => {
                        setSelectedSubCategoryId(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                    disabled={!selectedCategoryId}
                >
                    <option value="">All Subcategories</option>
                    {filteredSubcategories.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra border-2">
                    <thead className="border-2">
                        <tr className="bg-base-100 text-base-content">
                            <th className="">#</th>
                            <th className="cursor-pointer" onClick={() => handleSort("name")}>
                                Name {sortKey === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="cursor-pointer" onClick={() => handleSort("stock")}>
                                Stock {sortKey === "stock" && (sortOrder === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="cursor-pointer" onClick={() => handleSort("price")}>
                                Price {sortKey === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="cursor-pointer">
                                Unit
                            </th>
                            <th className="cursor-pointer" onClick={() => handleSort("category")}>
                                Category {sortKey === "category" && (sortOrder === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="cursor-pointer" onClick={() => handleSort("SubCategory")}>
                                Sub Category {sortKey === "SubCategory" && (sortOrder === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProducts.map((product, index) => (
                            <tr
                                key={product.id}
                                className="border-b border-transparent hover:border-l-4 hover:border-l-blue-500 hover:bg-gray-100 cursor-pointer"
                                onClick={() => openModal(product.id)}
                            >
                                <td className="">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                <td>
                                    {product.name}
                                </td>
                                <td className="">{product.stock}</td>
                                <td className="">{formatPKR(product.price)}</td>
                                <td className="">{product.unit}</td>
                                <td className="">{product.Category?.name || "No Category"}</td>
                                <td className="">{product.SubCategory?.name || "No Subcategory"}</td>
                                <td className="flex items-center space-x-2">
                                    <FiEdit
                                        className="text-warning cursor-pointer"
                                        size={20}
                                        onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setIsModalOpen(true); }}
                                    />
                                    <FiTrash2
                                        className="text-error cursor-pointer"
                                        size={20}
                                        onClick={(e) => { e.stopPropagation(); handleDelete(product.id) }}
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

            {/* Modal */}
            {isModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">
                            {selectedProduct ? "Edit Product" : "Add Product"}
                        </h3>

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setIsLoading(true);

                                const formData = new FormData(e.target as HTMLFormElement);
                                const newProduct = {
                                    name: formData.get("name"),
                                    unit: formData.get("unit"),
                                    stock: Number(formData.get("stock")),
                                    price: Number(formData.get("price")),
                                    categoryId: Number(formData.get("categoryId")),
                                    subCategoryId: Number(formData.get("subCategoryId"))
                                };

                                try {
                                    let res;
                                    if (selectedProduct) {
                                        // Editing existing product
                                        res = await fetch(`/api/products/${selectedProduct.id}`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(newProduct),
                                        });
                                    } else {
                                        // Adding a new product
                                        res = await fetch("/api/products", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(newProduct),
                                        });
                                    }

                                    if (res.ok) {
                                        toast.success(`Product ${selectedProduct ? "updated" : "added"} successfully`);
                                        fetchProducts();
                                    } else {
                                        toast.error(`Failed to ${selectedProduct ? "update" : "add"} product`);
                                    }
                                } catch (error) {
                                    toast.error(`Error ${selectedProduct ? "updating" : "adding"} product: ` + error);
                                } finally {
                                    setIsLoading(false);
                                    setIsModalOpen(false);
                                    setSelectedProduct(null);
                                }
                            }}
                        >
                            <label className="block my-2">
                                Name:
                                <input name="name" defaultValue={selectedProduct?.name || ""} className="input input-bordered w-full" required />
                            </label>
                            <label className="block my-2">
                                Stock:
                                <input name="stock" type="number" step="any" defaultValue={selectedProduct?.stock ?? ""} className="input input-bordered w-full" required />
                            </label>
                            <label className="block my-2">
                                Price:
                                <input name="price" defaultValue={selectedProduct?.price ?? ""} type="number" step="any" className="input input-bordered w-full" required
                                    onBlur={(e) => {
                                        const price = Number(e.target.value);
                                        if (!price || price <= 0) {
                                            toast.error("Price must be greater than zero");
                                            e.target.value = ""; e.target.focus();
                                        }
                                    }}
                                />
                            </label>

                            <label className="block my-2">
                                Unit:
                                <select
                                    name="unit"
                                    defaultValue={selectedProduct?.unit ?? ""}
                                    className="select select-bordered w-full"
                                    required
                                >
                                    <option value="" disabled>Select unit</option>
                                    <option value="pcs">pcs</option>
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="ft">ft</option>
                                </select>
                            </label>

                            <label className="block my-2">
                                Category:
                                <select
                                    name="categoryId"
                                    required
                                    className="select select-bordered w-full"
                                    defaultValue={selectedProduct?.categoryId || ""}
                                    onChange={(e) => handleCategoryChange(Number(e.target.value))}
                                >
                                    <option value="" disabled>Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block my-2">
                                Subcategory:
                                <select
                                    name="subCategoryId"
                                    required
                                    className="select select-bordered w-full"
                                    defaultValue={selectedProduct?.subCategoryId || ""}
                                >
                                    <option value="" disabled>Select a subcategory</option>
                                    {subcategories
                                        // .filter(subcat => subcat.categoryId === selectedCategory)  // Filter subcategories by selected category
                                        .map((subcat) => (
                                            <option key={subcat.id} value={subcat.id}>
                                                {subcat.name}
                                            </option>
                                        ))}
                                </select>
                            </label>

                            <div className="modal-action">
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                    {isLoading ? "Saving..." : selectedProduct ? "Save Changes" : "Add Product"}
                                </button>
                                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {stockModalOpen && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <h3 className="font-bold text-lg mb-4">Stock In/Out History</h3>
                        <div className="overflow-x-auto">
                            <table className="table w-full table-zebra border-2">
                                <thead className="border-2">
                                    <tr>
                                        <th>Type</th>
                                        <th>Date</th>
                                        <th>Price</th>
                                        <th className="text-right">Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productRecords.length > 0 ? productRecords.map((tx, idx) => (
                                        <tr key={idx}>
                                            <td className="flex items-center gap-2">
                                                {tx.type === "Purchase" ? (
                                                    <span className="">Purchase</span>
                                                ) : (
                                                    <span className="">Sale</span>
                                                )}
                                            </td>
                                            <td>{new Date(tx.date).toLocaleDateString()}</td>
                                            <td>{tx.price}</td>
                                            <td className="text-right">
                                                {tx.type === "Purchase" ? (
                                                    <span className="text-green-600">+ {tx.quantity} pcs.</span>
                                                ) : (
                                                    <span className="text-red-600">- {tx.quantity} pcs.</span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (<tr>
                                        <td colSpan={6} className="text-center text-gray-400 py-4">
                                            No Record Found.
                                        </td>
                                    </tr>)}
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-action">
                            <button className="btn" onClick={() => setStockModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </dialog>
            )}
        </div>
    );
}