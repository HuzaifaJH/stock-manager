"use client";

import { formatPKR } from "@/app/utils/amountFormatter";
import { useEffect, useState } from "react";
import { TbCreditCardPay } from "react-icons/tb";
import toast from "react-hot-toast";

interface CreditSale {
    date: string;
    customerName: string;
    payableAmount: number;
    id: number;
}

export default function CreditSalesList() {
    const [sales, setSales] = useState<CreditSale[]>([]);
    const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSales, setSelectedSales] = useState<CreditSale | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/sales/receivable");
            const data = await res.json();
            setSales(data);
        }
        catch (error) {
            console.error("Error fetching sales: ", error);
        }
        finally {
            setIsLoading(false);
        }
    };

    const filteredSales = sales.filter((sale) =>
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Recievables</h2>

            <div className="form-control mb-4 flex justify-between items-center flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    placeholder="Search by customer name"
                    className="input input-bordered w-full sm:max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Customer Name</th>
                            <th>Payable Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.map((sale, index) => (
                            <tr key={index}>
                                <td>{new Date(sale.date).toLocaleString("en-US", { hour12: true })}</td>
                                <td>{sale.customerName || "-"}</td>
                                <td>{formatPKR(sale.payableAmount ?? 0)}</td>
                                <td className="flex items-center space-x-2">
                                    <TbCreditCardPay
                                        className="text-primary cursor-pointer mx-1"
                                        size={18}
                                        onClick={() => { setSelectedSales(sale); setShowPayoutModal(true) }}
                                    />
                                </td>
                            </tr>
                        ))}
                        {filteredSales.length === 0 && (
                            <tr>
                                <td colSpan={3} className="text-center">
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showPayoutModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Receive from Customer</h3>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setIsLoading(true);
                                const formData = new FormData(e.target as HTMLFormElement);
                                const salesData = {
                                    amount: formData.get("amount"),
                                    id: selectedSales?.id,
                                    customerName: selectedSales?.customerName
                                };

                                try {
                                    const res = await fetch(
                                        "/api/sales/receivable",
                                        {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(salesData),
                                        }
                                    );

                                    if (res.ok) {
                                        toast.success("Payment Posted Successfully");
                                        fetchSales();
                                    } else {
                                        toast.error("Failed to Post Payment");
                                    }
                                } catch (error) {
                                    toast.error("Error saving record: " + error);
                                } finally {
                                    setIsLoading(false);
                                    setShowPayoutModal(false);
                                    setSelectedSales(null);
                                }
                            }}
                        >
                            <label className="block my-2">Amount: <input name="amount" defaultValue={""} className="input input-bordered w-full" required
                                onBlur={(e) => {
                                    const amount = Number(e.target.value);
                                    if (selectedSales?.payableAmount && selectedSales?.payableAmount < amount) {
                                        toast.error("Amount cannot be geater than Receivable Amount");
                                        e.target.value = ""; e.target.focus();
                                    }
                                }}
                            /></label>
                            <div className="modal-action">
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>Save</button>
                                <button type="button" className="btn" onClick={() => { setShowPayoutModal(false); setSelectedSales(null); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}