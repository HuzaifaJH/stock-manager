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
import { useState, useEffect } from "react";


interface Product {
  id: number;
  name: string;
  stock: number;
  SubCategory: SubCategory;
}

interface salesItem {
  productId: number;
  totalSold: number;
  Product: Product;
}

interface SubCategory {
  id: number;
  name: string
}

export default function Dashboard() {

  const [isLoading, setIsLoading] = useState(false);
  const [topSellingProducts, setTopSellingProducts] = useState<salesItem[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [totalSales, setTotalSales] = useState<number>(0);
  const [totalProfit, setTotalProfit] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [chartData, setChartData] = useState({
    labels: [],
    sales: [],
    profit: [],
  });

  const [filter, setFilter] = useState("month");

  // useEffect(() => {
  //   const fetchChartData = async () => {
  //     const res = await fetch(`/api/stats?groupBy=${filter}`);
  //     const data = await res.json();
  //   };

  //   fetchChartData();
  // }, [filter]);

  const filteredLowStockProducts = selectedSubCategory === "all"
    ? lowStockProducts
    : lowStockProducts.filter(
      (product) => product.SubCategory?.id.toString() === selectedSubCategory
    );

  // Extract unique subcategories for dropdown
  const uniqueSubCategories = [
    ...new Map(
      lowStockProducts.map((p) => [p.SubCategory?.id, p.SubCategory])
    ).values(),
  ];


  useEffect(() => {
    fetchStats();
  }, [filter]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/stats?groupBy=${filter}`);
      const data = await res.json();

      setTotalOrders(data.totalOrders)
      setTotalProfit(data.totalProfit)
      setTotalSales(data.totalSales);
      setTopSellingProducts(data.topSellingProducts);
      setLowStockProducts(data.lowStockProducts);
      setChartData(data.chartData);
    } catch (error) {
      console.error("Error fetching stats: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-4 sm:p-6">
      <div className="w-full space-y-6">

        {/* Top row boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="stats bg-base-100 shadow">
            <div className="stat">
              <div className="stat-title">Monthly Sales</div>
              {/* <div className="stat-value">${0}</div> */}
              <div className="stat-value">{totalSales} Rs.</div>
            </div>
          </div>
          <div className="stats bg-base-100 shadow">
            <div className="stat">
              <div className="stat-title">Total Profit</div>
              <div className="stat-value">{totalProfit} Rs.</div>
            </div>
          </div>
          {/* <div className="stats bg-base-100 shadow">
            <div className="stat">
              <div className="stat-title">Total Expenses</div>
              <div className="stat-value">${0}</div>
              <div className="stat-value text-red-500">${totalExpense}</div>
            </div>
          </div> */}
          <div className="stats bg-base-100 shadow">
            <div className="stat">
              <div className="stat-title">Total Orders</div>
              <div className="stat-value">{totalOrders}</div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Sales & Profit Chart */}
          <div className="bg-base-100 p-4 rounded shadow min-h-[300px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Sales & Profit</h2>
              <select className="select select-sm select-bordered" value={filter} onChange={(e) => setFilter(e.target.value)}>
                {/* <option value="day">Day</option> */}
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
            <SalesProfitChart data={chartData} />
          </div>

          {/* Low Stock Products Table */}
          <div className="bg-base-100 p-4 rounded shadow min-h-[300px]">
            <h2 className="text-lg font-semibold mb-2">Low Stock Products</h2>

            {/* Subcategory Filter Dropdown */}
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

            {/* Table View */}
            <div className="overflow-y-auto max-h-64">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Stock</th>
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
                            <div>{product.name}</div>
                            <div className="text-xs text-gray-500">{product.SubCategory?.name || "N/A"}</div>
                          </div>
                        </td>
                        <td className={`text-right ${product.stock === 0 ? "text-red-600 font-semibold" : ""}`}>
                          {product.stock} pcs
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>


          {/* Top Selling Products */}
          <div className="bg-base-100 p-4 rounded shadow min-h-[300px]">
            <h2 className="text-lg font-semibold mb-2">Top Selling (This Month)</h2>
            <div className="overflow-y-auto max-h-64 space-y-1">
              {topSellingProducts.length > 0 ? (
                <table className="table table-zebra table-sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellingProducts.map((salesItem: salesItem) => (
                      <tr key={salesItem.productId}>
                        <td>{salesItem.Product.name}</td>
                        <td className="text-right">{salesItem.totalSold} pcs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center text-gray-400 py-4">No products found.</div>
              )}
            </div>
          </div>

        </div>
      </div>
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
