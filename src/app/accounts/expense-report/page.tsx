'use client';

import { formatPKR } from '@/app/utils/amountFormatter';
import { useEffect, useState } from 'react';

type ExpenseSummary = {
    id: number;
    name: string;
    total: number;
};

const ranges = ['daily', 'weekly', 'monthly', 'yearly'];

export default function ExpenseReport() {
    const [range, setRange] = useState('monthly');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ExpenseSummary[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/expenses/expense-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ range }),
            });

            const result = await res.json();
            setData(result);
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [range]);

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-semibold">Expense Summary Report</h1>

            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">
                    Filter by: <span className="font-medium capitalize">{range}</span>
                </p>
                <select
                    className="select select-bordered select-sm"
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                >
                    {ranges.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt[0].toUpperCase() + opt.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto">
                {loading ? (
                    <span className="loading loading-spinner loading-lg" />
                ) : error ? (
                    <div className="text-red-500">{error}</div>
                ) : (
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Ledger Account</th>
                                <th>Total Expense</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center">
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={item.id}>
                                        <td>{idx + 1}</td>
                                        <td>{item.name}</td>
                                        <td>{formatPKR(item.total)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
