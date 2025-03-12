"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiTrash2 } from "react-icons/fi";

interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    categoryId: number;
    Category: Category;
}

interface ProductSort {
    name: string;
    price: number;
    stock: number;
    category: string;
}

interface Category {
    id: number;
    name: string;
}

export default function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false); // ✅ Loading state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [sortKey, setSortKey] = useState<keyof ProductSort | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
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
        // setIsLoading(true);
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories: ", error);
        } finally {
            // setIsLoading(false);
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
                fetchProducts(); // Refresh list
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

    const sortedProducts = [...products].sort((a, b) => {
        if (!sortKey) return 0;
        if (sortKey === "name") {
            return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortKey === "category") {
            return sortOrder === "asc"
                ? (a.Category?.name || "").localeCompare(b.Category?.name || "")
                : (b.Category?.name || "").localeCompare(a.Category?.name || "");
        }
        return sortOrder === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
    });

    // Pagination Logic
    const totalPages = Math.ceil(sortedProducts.length / rowsPerPage);
    const paginatedProducts = sortedProducts.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Product List</h2>
                <button className="btn btn-primary mb-4" onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}>
                    + Add Product
                </button>
            </div>

            {/* ✅ Show spinner */}
            {/* {isLoading && <span className="loading loading-spinner text-primary"></span>} */}

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                    <thead>
                        <tr className="bg-base-100 text-base-content">
                            <th className="">#</th>
                            <th className="cursor-pointer" onClick={() => handleSort("name")}>
                                Name {sortKey === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="cursor-pointer" onClick={() => handleSort("price")}>
                                Price {sortKey === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="cursor-pointer" onClick={() => handleSort("stock")}>
                                Stock {sortKey === "stock" && (sortOrder === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="cursor-pointer" onClick={() => handleSort("category")}>
                                Category {sortKey === "category" && (sortOrder === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProducts.map((product, index) => (
                            <tr key={product.id}>
                                {/* <td>{product.id}</td> */}
                                <td className="">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                <td className="">{product.name}</td>
                                <td className="">${product.price.toFixed(2)}</td>
                                <td className="">{product.stock}</td>
                                <td className="">{product.Category?.name || "No Category"}</td>
                                <td className="flex items-center space-x-2">
                                    <FiEdit
                                        className="text-warning cursor-pointer"
                                        size={20}
                                        onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }}
                                    />
                                    <FiTrash2
                                        className="text-error cursor-pointer"
                                        size={20}
                                        onClick={() => handleDelete(product.id)}
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
                                    price: Number(formData.get("price")),
                                    stock: Number(formData.get("stock")),
                                    categoryId: Number(formData.get("categoryId"))
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
                                    setIsModalOpen(false); // ✅ Close modal
                                    setSelectedProduct(null); // Reset product selection
                                }
                            }}
                        >
                            <label className="block my-2">
                                Name:
                                <input name="name" defaultValue={selectedProduct?.name || ""} className="input input-bordered w-full" required />
                            </label>
                            <label className="block my-2">
                                Price:
                                <input name="price" type="number" defaultValue={selectedProduct?.price || ""} className="input input-bordered w-full" required />
                            </label>
                            <label className="block my-2">
                                Stock:
                                <input name="stock" type="number" defaultValue={selectedProduct?.stock || ""} className="input input-bordered w-full" required />
                            </label>
                            <label className="block my-2">
                                Category:
                                <select
                                    name="categoryId"
                                    required
                                    className="select select-bordered w-full"
                                    defaultValue={selectedProduct?.categoryId || ""}
                                >
                                    <option value="" disabled>Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
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
        </div>
    );
}