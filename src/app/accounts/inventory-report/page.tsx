"use client";
import { Category } from '@/app/utils/interfaces';
import { formatPKR } from '@/app/utils/amountFormatter';
import { useEffect, useState } from 'react';

export default function InventoryReportPage() {
    const [report, setReport] = useState<Category[]>([]);
    const [openCategories, setOpenCategories] = useState<number[]>([]);
    const [openSubcategories, setOpenSubcategories] = useState<number[]>([]);

    useEffect(() => {
        fetch('/api/products/inventory')
            .then((res) => res.json())
            .then(setReport)
            .catch((err) => console.error('Fetch error:', err));
    }, []);

    const toggleCategory = (id: number) => {
        setOpenCategories((prev) =>
            prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
        );
    };

    const toggleSubcategory = (id: number) => {
        setOpenSubcategories((prev) =>
            prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
        );
    };

    const totalInventoryValue = report.reduce(
        (sum, cat) => sum + (cat.categoryTotalValue ?? 0),
        0
    );

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">📦 Inventory Report</h1>

            {report.map((category) => (
                <div key={category.id} className="mb-6 border rounded-lg shadow-sm">
                    <div
                        className="flex justify-between items-center bg-base-200 px-4 py-3 rounded-t-lg cursor-pointer"
                        onClick={() => toggleCategory(category.id)}
                    >
                        <div>
                            <h2 className="text-lg font-semibold">{category.name}</h2>
                            <p className="text-sm text-gray-500">
                                Total Value: <span className="font-bold text-primary">{formatPKR(category.categoryTotalValue ?? 0)}</span>
                            </p>
                        </div>
                        <button className="btn btn-sm btn-ghost">
                            {openCategories.includes(category.id) ? "▲" : "▼"}
                        </button>
                    </div>

                    {openCategories.includes(category.id) && (
                        <div className="p-4 bg-base-100 rounded-b-lg">
                            {category.SubCategories?.map((subcat) => (
                                <div key={subcat.id} className="mb-5 border-l-4 border-primary pl-4">
                                    <div
                                        className="flex justify-between items-center bg-base-200 px-3 py-2 rounded-md cursor-pointer"
                                        onClick={() => toggleSubcategory(subcat.id)}
                                    >
                                        <div>
                                            <h3 className="text-md font-medium">{subcat.name}</h3>
                                            <p className="text-xs text-gray-500">
                                                Subtotal: <span className="font-semibold">{formatPKR(subcat.subTotalValue ?? 0)}</span>
                                            </p>
                                        </div>
                                        <button className="btn btn-xs btn-outline">
                                            {openSubcategories.includes(subcat.id) ? "Hide" : "Show"}
                                        </button>
                                    </div>

                                    {openSubcategories.includes(subcat.id) && (
                                        <div className="mt-2">
                                            <table className="table table-zebra w-full text-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Product</th>
                                                        <th>Stock</th>
                                                        <th>Purchase Price</th>
                                                        <th>Stock Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {subcat.Products?.map((p) => (
                                                        <tr key={p.id}>
                                                            <td>{p.name}</td>
                                                            <td>{p.stock}</td>
                                                            <td>Rs {formatPKR(p.price)}</td>
                                                            <td>Rs {formatPKR(p.stockValue ?? 0)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            <div className="mt-8 text-right text-xl font-bold border-t pt-4">
                Total Inventory Value: <span className="text-primary">{formatPKR(totalInventoryValue)}</span>
            </div>
        </div>
    );
}