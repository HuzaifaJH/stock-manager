"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiTrash2 } from "react-icons/fi";

interface Sale {
    id: number;
    productId: number;
    quantity: number;
    price: number;
    date: string;
    product: { name: string };
}

interface Product {
    id: number;
    name: string;
}

export default function SalesPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    useEffect(() => {
        const fetchProducts = async () => {
            const res = await fetch("/api/products");
            const data: Product[] = await res.json();
            setProducts(data);
        };
        fetchSales();
        fetchProducts();
    }, []);

    const fetchSales = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/sales");
            const data = await res.json();
            setSales(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching sales: ", error);
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

    const totalPages = Math.ceil(sortedSales.length / rowsPerPage);
    const paginatedSales = sortedSales.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this sale?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                toast.success("Sale deleted successfully");
                fetchSales();
            } else {
                toast.error(data.error || "Failed to delete sale");
            }
        } catch (error) {
            console.error("Delete error: ", error);
            toast.error("Error deleting sale");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Sales List</h2>
                <button className="btn btn-primary" onClick={() => setSelectedSale({ id: 0, productId: 0, quantity: 1, price: 0, date: new Date().toISOString().split("T")[0], product: { name: "" } })}>
                    Add Sale
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                    <thead>
                        <tr className="bg-base-100 text-base-content">
                            <th>#</th>
                            <th>Product</th>
                            <th className="cursor-pointer" onClick={handleSort}>
                                Date {sortOrder === "asc" ? "↑" : "↓"}
                            </th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSales.map((sale, index) => (
                            <tr key={sale.id}>
                                <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                <td>{sale.product?.name || "Unknown"}</td>
                                <td>{sale.date}</td>
                                <td>{sale.quantity}</td>
                                <td>${sale.price.toFixed(2)}</td>
                                <td className="flex items-center space-x-2">
                                    <FiEdit
                                        className="text-warning cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => setSelectedSale(sale)}
                                    />
                                    <FiTrash2
                                        className="text-error cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => handleDelete(sale.id)}
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

            {selectedSale && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">{selectedSale.id ? "Edit Sale" : "Add Sale"}</h3>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setIsLoading(true);
                                const formData = new FormData(e.target as HTMLFormElement);
                                const saleData = {
                                    productId: Number(formData.get("productId")),
                                    quantity: Number(formData.get("quantity")),
                                    price: Number(formData.get("price")),
                                    date: formData.get("date"),
                                };

                                try {
                                    const res = await fetch(
                                        selectedSale.id ? `/api/sales/${selectedSale.id}` : "/api/sales",
                                        {
                                            method: selectedSale.id ? "PUT" : "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(saleData),
                                        }
                                    );

                                    const data = await res.json();

                                    if (res.ok) {
                                        toast.success(`Sale ${selectedSale.id ? "updated" : "added"} successfully`);
                                        fetchSales();
                                    } else {
                                        toast.error(data.error || "Failed to save sale");
                                    }
                                } catch (error) {
                                    toast.error("Error saving sale: " + error);
                                } finally {
                                    setIsLoading(false);
                                    setSelectedSale(null);
                                }
                            }}
                        >
                            <label className="block my-2">Product:
                                <select name="productId" defaultValue={selectedSale.productId} className="select select-bordered w-full" required>
                                    <option value="">Select Product</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block my-2">Quantity: <input name="quantity" type="number" defaultValue={selectedSale.quantity} className="input input-bordered w-full" required /></label>
                            <label className="block my-2">Price: <input name="price" type="number" defaultValue={selectedSale.price} className="input input-bordered w-full" required /></label>
                            <label className="block my-2">Date: <input name="date" type="date" defaultValue={selectedSale.date} className="input input-bordered w-full" required /></label>
                            <div className="modal-action">
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>Save</button>
                                <button type="button" className="btn" onClick={() => setSelectedSale(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
