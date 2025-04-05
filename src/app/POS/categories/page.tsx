"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiTrash2 } from "react-icons/fi";

interface Category {
    id: number;
    name: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Sorting Logic
    const handleSort = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    const sortedCategories = [...categories].sort((a, b) => {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

    // Pagination Logic
    const totalPages = Math.ceil(sortedCategories.length / rowsPerPage);
    const paginatedCategories = sortedCategories.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // Delete Category
    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this category?")) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Category deleted successfully");
                fetchCategories();
            } else {
                toast.error("Failed to delete category");
            }
        } catch (error) {
            console.error("Delete error: ", error);
            toast.error("Error deleting category");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Category List</h2>
                <button className="btn btn-primary" onClick={() => setSelectedCategory({ id: 0, name: "" })}>
                    Add Category
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                    <thead>
                        <tr className="bg-base-100 text-base-content">
                            <th className="">#</th>
                            <th className="cursor-pointer" onClick={handleSort}>
                                Name {sortOrder === "asc" ? "↑" : "↓"}
                            </th>
                            <th className="">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedCategories.map((category, index) => (
                            <tr key={category.id}>
                                <td className="">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                <td className="">{category.name}</td>
                                <td className="flex items-center space-x-2">
                                    {/* <button
                                        className="btn btn-warning btn-xs mx-1"
                                        onClick={() => setSelectedCategory(category)}
                                        disabled={isLoading}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-error btn-xs mx-1"
                                        onClick={() => handleDelete(category.id)}
                                        disabled={isLoading}
                                    >
                                        Delete
                                    </button> */}
                                    <FiEdit
                                        className="text-warning cursor-pointer"
                                        size={20}
                                        onClick={() => { setSelectedCategory(category) }}
                                    />
                                    <FiTrash2
                                        className="text-error cursor-pointer"
                                        size={20}
                                        onClick={() => handleDelete(category.id)}
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

            {/* Add/Edit Modal */}
            {selectedCategory && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">{selectedCategory.id ? "Edit Category" : "Add Category"}</h3>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setIsLoading(true);
                                const formData = new FormData(e.target as HTMLFormElement);
                                const categoryData = { name: formData.get("name") };

                                try {
                                    const res = await fetch(
                                        selectedCategory.id ? `/api/categories/${selectedCategory.id}` : "/api/categories",
                                        {
                                            method: selectedCategory.id ? "PUT" : "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(categoryData),
                                        }
                                    );

                                    if (res.ok) {
                                        toast.success(`Category ${selectedCategory.id ? "updated" : "added"} successfully`);
                                        fetchCategories();
                                    } else {
                                        toast.error("Failed to save category");
                                    }
                                } catch (error) {
                                    toast.error("Error saving category: " + error);
                                } finally {
                                    setIsLoading(false);
                                    setSelectedCategory(null);
                                }
                            }}
                        >
                            <label className="block my-2">
                                Name:
                                <input
                                    name="name"
                                    defaultValue={selectedCategory.name}
                                    className="input input-bordered w-full"
                                    required
                                />
                            </label>
                            <div className="modal-action">
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                    {isLoading ? "Saving..." : "Save Changes"}
                                </button>
                                <button type="button" className="btn" onClick={() => setSelectedCategory(null)}>
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