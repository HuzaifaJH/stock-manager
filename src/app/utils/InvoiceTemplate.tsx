// components/InvoiceTemplate.tsx
interface InvoiceTemplateProps {
    sale: Sales;
}

interface Sales {
    id: number;
    date: string;
    SalesItems?: salesItem[];
    totalPrice?: number;
    customerName: string;
    isPaymentMethodCash: boolean;
}

interface salesItem {
    productId: number | "";
    categoryId: number | "";
    subCategoryId: number | "";
    quantity: number | null;
    sellingPrice: number | null;
    Product?: Product;
}

interface Product {
    name: string;
}

export default function InvoiceTemplate({ sale }: InvoiceTemplateProps) {
    const totalPrice = (sale.SalesItems ?? []).reduce(
        (sum, item) => sum + (item.quantity ?? 0) * (item.sellingPrice ?? 0),
        0
    );

    return (
        <div id="invoice" className="p-4 text-xs font-mono w-[280px]">
            <div className="text-center">
                <h2 className="text-sm font-bold">Your Store Name</h2>
                <p>123 Main Street, City</p>
                <p>Phone: 123-456-7890</p>
                <hr className="my-2" />
            </div>

            <div className="flex justify-between text-[10px]">
                <span>Date: {sale.date}</span>
                <span>Invoice #: {sale.id}</span>
            </div>

            <div className="mb-2 text-[10px]">Customer: {sale.customerName}</div>

            <table className="w-full text-[10px]">
                <thead>
                    <tr className="border-y border-dashed">
                        <th className="text-left">Item</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {(sale.SalesItems ?? []).map((item: salesItem) => (
                        <tr key={item.productId}>
                            <td>{item.Product?.name || "N/A"}</td>
                            <td className="text-right">{item.quantity}</td>
                            <td className="text-right">{item.sellingPrice && item.sellingPrice.toFixed(2)}</td>
                            <td className="text-right">
                                {item.sellingPrice && item.quantity && (item.quantity * item.sellingPrice).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <hr className="my-2" />

            <div className="flex justify-between font-semibold text-[11px]">
                <span>Total:</span>
                <span>{totalPrice.toFixed(2)}</span>
            </div>

            <div className="text-center mt-4 text-[10px]">
                <p>Payment: {sale.isPaymentMethodCash ? "CASH" : "CREDIT"}</p>
                <p>Thank you for shopping!</p>
            </div>
        </div>
    );
}  