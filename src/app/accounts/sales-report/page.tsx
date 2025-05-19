"use client";
import { formatPKR } from "@/app/utils/amountFormatter";
import { FinalSalesReportCategory, FinalSalesReportProduct, FinalSalesReportSubCategory, SalesReportResponse } from "@/app/utils/interfaces";
import { useEffect, useState } from "react";

const rangeOptions = ["daily", "weekly", "monthly", "yearly"];

export default function SalesReport() {
  const [range, setRange] = useState("monthly");
  const [report, setReport] = useState<SalesReportResponse>();
  const [loading, setLoading] = useState(false);
  const [openCategories, setOpenCategories] = useState<number[]>([]);
  const [openSubcategories, setOpenSubcategories] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetch("/api//sales/sales-report", {
        method: "POST",
        body: JSON.stringify({ range }),
      });
      const data = await res.json();
      setReport(data);
      setLoading(false);
    };

    fetchData();
  }, [range]);

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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">📈 Sales Report</h1>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          Filter by: <span className="font-medium capitalize">{range}</span>
        </p>
        <select
          className="select select-bordered select-sm"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          {rangeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt[0].toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-center py-10 text-base-content/60">Loading...</p>
      ) : (
        <>
          {report?.byCategory?.map((category: FinalSalesReportCategory) => (
            <div
              key={category.id}
              className="mb-6 border rounded-lg shadow-sm"
            >
              <div
                className="flex justify-between items-center bg-base-200 px-4 py-3 rounded-t-lg cursor-pointer"
                onClick={() => toggleCategory(category.id)}
              >
                <div>
                  <h2 className="text-lg font-semibold">{category.name}</h2>
                  <p className="text-sm text-gray-500">
                    Revenue:{" "}
                    <span className="font-bold text-primary">
                      {formatPKR(category.revenue)}
                    </span>{" "}
                    | Profit:{" "}
                    <span className="font-bold text-success">
                      {formatPKR(category.profit)}
                    </span>
                  </p>
                </div>
                <button className="btn btn-sm btn-ghost">
                  {openCategories.includes(category.id) ? "▲" : "▼"}
                </button>
              </div>

              {openCategories.includes(category.id) && (
                <div className="p-4 bg-base-100 rounded-b-lg">
                  {category.subcategories?.map((sub: FinalSalesReportSubCategory) => (
                    <div
                      key={sub.id}
                      className="mb-5 border-l-4 border-primary pl-4"
                    >
                      <div
                        className="flex justify-between items-center bg-base-200 px-3 py-2 rounded-md cursor-pointer"
                        onClick={() => toggleSubcategory(sub.id)}
                      >
                        <div>
                          <h3 className="text-md font-medium">{sub.name}</h3>
                          <p className="text-xs text-gray-500">
                            Revenue:{" "}
                            <span className="font-semibold">
                              {formatPKR(sub.revenue)}
                            </span>{" "}
                            | Profit:{" "}
                            <span className="text-success font-semibold">
                              {formatPKR(sub.profit)}
                            </span>
                          </p>
                        </div>
                        <button className="btn btn-xs btn-outline">
                          {openSubcategories.includes(sub.id) ? "Hide" : "Show"}
                        </button>
                      </div>

                      {openSubcategories.includes(sub.id) && (
                        <div className="mt-2">
                          <table className="table table-zebra w-full text-sm">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Revenue</th>
                                <th>Profit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sub.products?.map((prod: FinalSalesReportProduct) => (
                                <tr key={prod.id}>
                                  <td>{prod.name}</td>
                                  <td>{prod.quantity}</td>
                                  <td>{formatPKR(prod.revenue)}</td>
                                  <td>{formatPKR(prod.profit)}</td>
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
            Total Revenue:{" "}
            <span className="text-primary">
              {formatPKR(report?.totalRevenue || 0)}
            </span>{" "}
            | Total Profit:{" "}
            <span className="text-success">
              {formatPKR(report?.totalProfit || 0)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
