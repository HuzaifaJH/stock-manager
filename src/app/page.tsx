export default function Dashboard() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome to your stock management system!</p>
    </main>
  );
}


// "use client";
// import { useEffect, useState } from "react";
// import axios from "axios";
// import { Bar, Line, Pie } from "recharts";
// import { FiDollarSign, FiShoppingCart, FiLayers, FiCreditCard} from "react-icons/fi";
// import { TbCash } from "react-icons/tb";

// export default function Dashboard() {
//   const [stats, setStats] = useState<any>(null);

//   useEffect(() => {
//     axios.get("/api/dashboard").then((response) => {
//       setStats(response.data);
//       console.log(response.data)
//     });
//   }, []);

//   if (!stats) return <div>Loading...</div>;

//   return (
//     <main className="p-6">
//       <h1 className="text-2xl font-bold">Dashboard</h1>

//       {/* Key Stats */}
//       <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
//         <div className="bg-blue-500 text-white shadow-lg p-6 rounded-lg flex flex-col justify-center items-center">
//           <FiDollarSign className="w-10 h-10 mb-2" />
//           <h3 className="text-lg font-semibold">Total Sales</h3>
//           <p className="text-2xl">Rs. {stats.sales.totalSalesYTD}</p>
//         </div>

//         <div className="bg-green-500 text-white shadow-lg p-6 rounded-lg flex flex-col justify-center items-center">
//           <FiShoppingCart className="w-10 h-10 mb-2" />
//           <h3 className="text-lg font-semibold">Total Purchases</h3>
//           <p className="text-2xl">Rs. {stats.purchases.totalPurchasesYTD}</p>
//         </div>

//         <div className="bg-yellow-500 text-white shadow-lg p-6 rounded-lg flex flex-col justify-center items-center">
//           <FiLayers className="w-10 h-10 mb-2" />
//           <h3 className="text-lg font-semibold">Stock Balance</h3>
//           <p className="text-2xl">Rs. {stats.stockBalance}</p>
//         </div>

//         <div className="bg-red-500 text-white shadow-lg p-6 rounded-lg flex flex-col justify-center items-center">
//           <FiCreditCard className="w-10 h-10 mb-2" />
//           <h3 className="text-lg font-semibold">Payables</h3>
//           <p className="text-2xl">Rs. {stats.outstanding.payables}</p>
//         </div>

//         <div className="bg-purple-500 text-white shadow-lg p-6 rounded-lg flex flex-col justify-center items-center">
//           <TbCash className="w-10 h-10 mb-2" />
//           <h3 className="text-lg font-semibold">Receivables</h3>
//           <p className="text-2xl">Rs. {stats.outstanding.receivables}</p>
//         </div>
//       </div>


//       {/* Sales & Purchases Trend */}
//       {/* <div className="col-span-2">
//           <h2 className="text-xl font-bold mb-2">Sales & Purchases Trend</h2>
//           <Line data={stats.salesPurchasesTrend} />
//         </div> */}

//       {/* Revenue vs. Expenses */}
//       {/* <div className="col-span-1">
//           <h2 className="text-xl font-bold mb-2">Revenue vs. Expenses</h2>
//           <Bar data={stats.revenueVsExpenses} dataKey={""} />
//         </div> */}

//       {/* Category-wise Sales Distribution */}
//       {/* <div className="col-span-1">
//           <h2 className="text-xl font-bold mb-2">Category-wise Sales</h2>
//           <Pie data={stats.categorySalesDistribution} dataKey={""} />
//         </div> */}
//     </main>
//   );
// }