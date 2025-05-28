import { Sales, SalesItem } from '@/app/utils/interfaces';
import dayjs from "dayjs";
import { formatPKR } from './amountFormatter';

interface InvoiceTemplateProps {
    sale: Sales;
}

export default function InvoiceTemplate({ sale }: InvoiceTemplateProps) {
    const totalBeforeDiscount = (sale.SalesItems ?? []).reduce(
        (sum, item) => sum + (item.quantity ?? 0) * (item.sellingPrice ?? 0),
        0
    );

    const discount = sale.discount ?? 0;
    const totalAfterDiscount = totalBeforeDiscount - discount;

    return (
        <div
            id="invoice"
            style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                margin: 0,
                padding: 0,
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Inventory Management System
                </h2>
                <span>Karachi, Pakistan</span>
                <br />
                <span>Phone: +92 xxx xxxxxxx / +92 xxx xxxxxxx</span>
                <br />
                <br />
                <hr style={{ margin: '0.5rem 0', borderStyle: 'dashed', borderTop: '1px solid #000' }} />
            </div>

            {/* <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Burhani Wooden & Timber Mart
                </h2>
                <span>Shop # 3 Sector 11-B Up More Near Bohri Masjid, North Karachi, Pakistan</span>
                <br />
                <span>Phone: +92 321 2275956 / +92 334 3727466</span>
                <br />
                <br />
                <hr style={{ margin: '0.5rem 0', borderStyle: 'dashed', borderTop: '1px solid #000' }} />
            </div> */}

            <div style={{ fontSize: '12px', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Date: {dayjs(sale.date).format("YYYY-MM-DD")}</span>
                    <span>Time: {dayjs(sale.date).format("HH:mm")}</span>
                </div>
                <div>Invoice #: {sale.id}</div>
                <div>Customer: {sale.customerName}</div>
            </div>

            <br />
            <br />

            <table style={{ width: '100%', fontSize: '12px', marginBottom: '0.5rem', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderTop: '1px dashed black', borderBottom: '1px dashed black' }}>
                        <th style={{ textAlign: 'left' }}>Item</th>
                        <th style={{ textAlign: 'right' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Rate</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {(sale.SalesItems ?? []).map((item: SalesItem) => (
                        <tr key={item.productId}>
                            <td>{item.Product?.name || "N/A"}</td>
                            <td style={{ textAlign: 'right' }}>{item.quantity} {item.Product?.unit}</td>
                            <td style={{ textAlign: 'right' }}>{
                                new Intl.NumberFormat("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                }).format(item.sellingPrice ?? 0)
                            }</td>
                            <td style={{ textAlign: 'right' }}>
                                {
                                    new Intl.NumberFormat("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }).format(item.quantity && item.sellingPrice
                                        ? item.quantity * item.sellingPrice
                                        : 0
                                    )
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <hr style={{ margin: '0.25rem 0', borderStyle: 'dashed', borderTop: '1px solid #000' }} />

            <br />
            <br />

            <div style={{ fontSize: '12px', margin: '0.5rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span>{formatPKR(totalBeforeDiscount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Discount:</span>
                    <span>-{formatPKR(discount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                    <span>Total:</span>
                    <span>{formatPKR(totalAfterDiscount)}</span>
                </div>
            </div>

            <p>Payment Mode: {sale.isPaymentMethodCash ? "CASH" : "CREDIT"}</p>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <span>No returns/exchange accepted after 3 days from the date of purchase.</span>
                <br />
                <span>Thank you for your purchase!</span>
            </div>
        </div >
    );
}