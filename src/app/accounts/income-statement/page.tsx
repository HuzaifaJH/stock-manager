"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function IncomeStatement() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const fetchIncomeStatement = async () => {
        if (!startDate || !endDate) return;
        setLoading(true);
        setError("");
        try {
            const response = await axios.get("/api/income-statement", {
                params: { startDate, endDate },
            });
            setData(response.data);
        } catch (err) {
            setError("Failed to fetch income statement");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchIncomeStatement();
    }, [startDate, endDate]);

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Income Statement</h2>
            <div className="flex gap-4 mb-4">
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input input-bordered"
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input input-bordered"
                />
                <button onClick={fetchIncomeStatement} className="btn btn-primary">Fetch</button>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {data && (
                <div className="p-4 shadow rounded-lg">
                    <table className="table w-full">
                        <tbody>
                            <tr>
                                <td className="font-semibold">Total Revenue:</td>
                                <td className="text-right">Rs.{data.totalRevenue.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="font-semibold">Cost of Goods Sold:</td>
                                <td className="text-right">Rs.{data.totalCOGS.toFixed(2)}</td>
                            </tr>
                            <tr className="font-bold">
                                <td>Gross Profit:</td>
                                <td className="text-right">Rs.{data.grossProfit.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="font-semibold">Total Expenses:</td>
                                <td className="text-right">Rs.{data.totalExpenses.toFixed(2)}</td>
                            </tr>
                            <tr className="font-bold border-t">
                                <td>Net Profit:</td>
                                <td className="text-right">Rs.{data.netProfit.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
