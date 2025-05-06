// export default function Dashboard() {
//   return (
//     <main className="p-6">
//       <h1 className="text-2xl font-bold">Dashboard</h1>
//       <p>Welcome to your stock management system!</p>
//     </main>
//   );
// }

"use client"

import SalesProfitChart from "@/components/salesProfitChart";
import { useState, useEffect, useCallback } from "react";
import { AiOutlineRise } from "react-icons/ai";
import { FaClipboardList, FaMoneyBillWave } from "react-icons/fa";
import { FcSalesPerformance } from "react-icons/fc";
import { Product, SalesItem } from "./utils/interfaces";

export default function Dashboard() {

  const [isLoading, setIsLoading] = useState(false);
  const [topSellingProducts, setTopSellingProducts] = useState<SalesItem[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [totalSales, setTotalSales] = useState<number>(0);
  const [totalProfit, setTotalProfit] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [chartData, setChartData] = useState({
    labels: [],
    sales: [],
    profit: [],
  });

  const [filter, setFilter] = useState("month");

  // Memoize fetchStats with useCallback
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/stats?groupBy=${filter}`);
      const data = await res.json();

      setTotalOrders(data.totalOrders);
      setTotalProfit(data.totalProfit);
      setTotalExpense(data.totalExpense);
      setTotalSales(data.totalSales);
      setTopSellingProducts(data.topSellingProducts);
      setLowStockProducts(data.lowStockProducts);
      setChartData(data.chartData);
    } catch (error) {
      console.error("Error fetching stats: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]); // Re-run fetchStats only when filter changes

  useEffect(() => {
    fetchStats();
  }, [fetchStats]); // Re-run useEffect when fetchStats changes (only when filter changes)

  return (
    <main className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome to your stock management system!</p>
      {!isLoading && (
        <div className="w-full space-y-6 mt-5">
          {/* Top row boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Monthly Sales */}
            <div className="bg-base-100 rounded-xl shadow p-4 relative border-2 border-base-content/50">
              <div className="absolute top-4 right-4 bg-yellow-100 p-2 rounded-lg">
                <FcSalesPerformance className="text-purple-600 text-xl" />
              </div>
              <div className="text-base-content text-sm font-medium">Monthly Sales</div>
              <div className="text-2xl font-bold text-base-content">{totalSales} Rs.</div>
            </div>

            {/* Total Profit */}
            <div className="bg-base-100 rounded-xl shadow p-4 relative border-2 border-base-content/50">
              <div className="absolute top-4 right-4 bg-green-100 p-2 rounded-lg">
                <AiOutlineRise className="text-green-600 text-xl" />
              </div>
              <div className="text-base-content text-sm font-medium">Total Profit</div>
              <div className="text-2xl font-bold text-base-content">{totalProfit} Rs.</div>
            </div>

            {/* Total Expenses */}
            <div className="bg-base-100 rounded-xl shadow p-4 relative border-2 border-base-content/50">
              <div className="absolute top-4 right-4 bg-red-100 p-2 rounded-lg">
                <FaMoneyBillWave className="text-red-600 text-xl" />
              </div>
              <div className="text-base-content text-sm font-medium">Total Expenses</div>
              <div className="text-2xl font-bold text-base-content">{totalExpense} Rs.</div>
            </div>

            {/* Total Orders */}
            <div className="bg-base-100 rounded-xl shadow p-4 relative border-2 border-base-content/50">
              <div className="absolute top-4 right-4 bg-blue-100 p-2 rounded-lg">
                <FaClipboardList className="text-blue-600 text-xl" />
              </div>
              <div className="text-base-content text-sm font-medium">Total Orders</div>
              <div className="text-2xl font-bold text-base-content">{totalOrders}</div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sales & Profit Chart */}
            <div className="bg-base-100 p-4 rounded-xl shadow border-2 border-base-content/50">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-base-content">Sales & Profit</h2>
                <select
                  className="select select-sm select-bordered"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>
              <SalesProfitChart data={chartData} />
            </div>

            {/* Low Stock Products Table */}
            <div className="bg-base-100 p-4 rounded-xl shadow border-2 border-base-content/50">
              <h2 className="text-lg font-semibold mb-2 text-base-content">Low Stock Products</h2>

              <select
                className="select select-sm select-bordered mb-3"
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
              >
                <option value="">All Subcategories</option>
                {[...new Set(lowStockProducts.map((p) => p.SubCategory?.name))].map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <div className="overflow-y-auto no-scrollbar max-h-64">
                <table className="table table-zebra table-sm">
                  <thead>
                    <tr>
                      <th className="text-base-content">Product</th>
                      <th className="text-right text-base-content">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...lowStockProducts]
                      .filter((p) => !selectedSubCategory || p.SubCategory?.name === selectedSubCategory)
                      .sort((a, b) => a.stock - b.stock)
                      .map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div>
                              <div className="text-base-content">{product.name}</div>
                              <div className="text-xs text-base-content/70">{product.SubCategory?.name || "N/A"}</div>
                            </div>
                          </td>
                          <td
                            className={`text-right ${product.stock === 0
                              ? "text-red-600 font-semibold"
                              : "text-base-content"
                              }`}
                          >
                            {product.stock} pcs
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="bg-base-100 p-4 rounded-xl shadow border-2 border-base-content/50">
              <h2 className="text-lg font-semibold mb-13 text-base-content">Top Selling (This Month)</h2>
              <div className="overflow-y-auto no-scrollbar max-h-64 space-y-1">
                {topSellingProducts.length > 0 ? (
                  <table className="table table-zebra table-sm">
                    <thead>
                      <tr>
                        <th className="text-base-content">Product</th>
                        <th className="text-right text-base-content">Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSellingProducts.map((salesItem: SalesItem) => (
                        <tr key={salesItem.productId}>
                          <td>
                            <div>
                              <div className="text-base-content">{salesItem.Product?.name}</div>
                              <div className="text-xs text-base-content/70">
                                {salesItem.Product?.SubCategory?.name || "N/A"}
                              </div>
                            </div>
                          </td>
                          <td className="text-right text-base-content">
                            {salesItem.totalSold} pcs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center text-base-content/50 py-4">No products found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}



{/* Top Selling Products */ }
{/* <div className="bg-base-100 p-4 rounded shadow">
  <h2 className="text-lg font-semibold mb-2">Top Selling (This Month)</h2>

  <div className="overflow-y-auto max-h-64">
    {topSellingProducts.length > 0 ? (
      <table className="table table-zebra table-sm">
        <thead>
          <tr>
            <th>Product</th>
            <th className="text-right">Sold</th>
          </tr>
        </thead>
        <tbody>
          {[...topSellingProducts]
            .sort((a, b) => b.totalSold - a.totalSold)
            .map((salesItem) => (
              <tr key={salesItem.productId}>
                <td>
                  <div>
                    <div>{salesItem.Product.name}</div>
                    <div className="text-xs text-gray-500">{salesItem.Product?.SubCategory?.name || "N/A"}</div>
                  </div>
                </td>
                <td className="text-right">{salesItem.totalSold} pcs</td>
              </tr>
            ))}
        </tbody>
      </table>
    ) : (
      <div className="text-center text-gray-400 py-4">No products found.</div>
    )}
  </div>
</div> */}
