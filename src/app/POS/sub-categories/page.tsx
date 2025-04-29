"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeftCircle, FiArrowRightCircle, FiEdit, FiTrash2 } from "react-icons/fi";

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

export default function SubcategoriesPage() {
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | "">("");

    useEffect(() => {
        fetchSubcategories();
        fetchCategories();
    }, []);

    const fetchSubcategories = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/subcategories");
            const data = await res.json();
            setSubcategories(data);
        } catch (error) {
            console.error("Error fetching subcategories: ", error);
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

    const filteredSubcategories = subcategories.filter(sub => {
        const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "" || sub.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const sortedSubcategories = [...filteredSubcategories].sort((a, b) =>
        sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );

    const totalPages = Math.ceil(sortedSubcategories.length / rowsPerPage);
    const paginatedSubcategories = sortedSubcategories.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this subcategory?")) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/subcategories/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Subcategory deleted successfully");
                fetchSubcategories();
            } else {
                toast.error("Failed to delete subcategory");
            }
        } catch (error) {
            toast.error("Error deleting subcategory: " + error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Subcategory List</h2>
                <button
                    className="btn btn-primary"
                    onClick={() =>
                        setSelectedSubcategory({ id: 0, name: "", categoryId: 0 })
                    }
                >
                    Add Subcategory
                </button>
            </div>

            <div className="flex flex-wrap gap-4 mb-4 items-center">
                <input
                    type="text"
                    placeholder="Search by subcategory name"
                    className="input input-bordered w-full sm:max-w-sm"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                />

                <select
                    className="select select-bordered w-full sm:max-w-xs"
                    value={selectedCategory}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSelectedCategory(value === "" ? "" : Number(value));
                        setCurrentPage(1);
                    }}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                    <thead>
                        <tr className="bg-base-100 text-base-content">
                            <th>#</th>
                            <th className="cursor-pointer" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>Name {sortOrder === "asc" ? "↑" : "↓"}</th>
                            <th>Category</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSubcategories.map((sub, index) => (
                            <tr key={sub.id}>
                                <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                <td>{sub.name}</td>
                                <td>{categories.find(c => c.id === sub.categoryId)?.name}</td>
                                <td className="flex items-center space-x-2">
                                    <FiEdit className="text-warning cursor-pointer" size={20} onClick={() => setSelectedSubcategory(sub)} />
                                    <FiTrash2 className="text-error cursor-pointer" size={20} onClick={() => handleDelete(sub.id)} />
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
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                    <span>Page {currentPage} of {totalPages}</span>
                    <div>
                        <button className="mr-4" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}><FiArrowLeftCircle size={24} /></button>
                        <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}><FiArrowRightCircle size={24} /></button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selectedSubcategory && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">{selectedSubcategory.id ? "Edit Subcategory" : "Add Subcategory"}</h3>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setIsLoading(true);
                                const formData = new FormData(e.target as HTMLFormElement);
                                const subcategoryData = {
                                    name: formData.get("name"),
                                    categoryId: Number(formData.get("categoryId")),
                                };
                                try {
                                    const res = await fetch(
                                        selectedSubcategory.id ? `/api/subcategories/${selectedSubcategory.id}` : "/api/subcategories",
                                        {
                                            method: selectedSubcategory.id ? "PUT" : "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(subcategoryData),
                                        }
                                    );
                                    if (res.ok) {
                                        toast.success(`Subcategory ${selectedSubcategory.id ? "updated" : "added"} successfully`);
                                        fetchSubcategories();
                                    } else {
                                        toast.error("Failed to save subcategory");
                                    }
                                } catch (error) {
                                    toast.error("Error saving subcategory");
                                    console.log(error);
                                } finally {
                                    setIsLoading(false);
                                    setSelectedSubcategory(null);
                                }
                            }}
                        >
                            <label className="block my-2">
                                Name:
                                <input name="name" defaultValue={selectedSubcategory.name} className="input input-bordered w-full" required />
                            </label>
                            <label className="block my-2">
                                Category:
                                <select
                                    name="categoryId"
                                    defaultValue={selectedSubcategory.categoryId || ""}
                                    className="select select-bordered w-full"
                                    required
                                >
                                    <option value="" disabled>Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="modal-action">
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                    {isLoading ? "Saving..." : "Save Changes"}
                                </button>
                                <button type="button" className="btn" onClick={() => setSelectedSubcategory(null)}>
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