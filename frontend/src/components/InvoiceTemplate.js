import React from 'react';

// Helper to format currency (same as in Billing.js, consider moving to a utils file later)
const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '₹0.00';
    return `₹${amount.toFixed(2)}`;
};

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    } catch (e) {
        return dateString; // Fallback
    }
};

const InvoiceTemplate = ({ transaction, admin }) => {
    if (!transaction || !admin) {
        return <div>Loading invoice data...</div>; // Or handle error
    }

    const {
        transaction_id,
        customer_name,
        customer_contact,
        customer_email,
        cart_items = [], // Default to empty array
        extra_charges = [], // Default to empty array
        billing_mode,
        total_amount,
        createdAt // Use createdAt for invoice date
    } = transaction;

    const {
        name: businessName,
        city: businessCity,
        branch: businessBranch,
        GSTIN: businessGSTIN
    } = admin;

    const calculateSubtotal = () => {
         // Recalculate based on cart items in the transaction data
         return cart_items.reduce((sum, item) => {
             // Ensure product and price exist
             const price = item.product?.product_price || 0;
             const quantity = item.quantity || 0;
             return sum + (price * quantity);
         }, 0);
    };

    const subtotal = calculateSubtotal();
    const totalExtraCharges = extra_charges.reduce((sum, charge) => sum + (charge.amount || 0), 0);

    return (
        <div className="p-8 font-sans text-sm bg-white w-[80mm] mx-auto"> {/* Approx width for thermal printer */}
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold uppercase mb-1">{businessName || 'Your Business'}</h1>
                <p className="text-xs">{businessCity || ''}{businessBranch ? `, ${businessBranch}` : ''}</p>
                {businessGSTIN && <p className="text-xs font-medium">GSTIN: {businessGSTIN}</p>}
                <h2 className="text-lg font-semibold mt-2 border-t border-b border-dashed border-black py-1">TAX INVOICE</h2>
            </div>

            {/* Invoice Info */}
            <div className="mb-4 text-xs">
                <div className="flex justify-between mb-1">
                    <span>Invoice No:</span>
                    <span className="font-medium">{transaction_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium">{formatDate(createdAt)}</span>
                </div>
            </div>

             {/* Customer Info */}
             <div className="mb-4 text-xs border-t border-dashed border-black pt-2">
                 <p><span className="font-semibold">Billed To:</span> {customer_name || 'N/A'}</p>
                 <p>Contact: {customer_contact || 'N/A'}</p>
                 {customer_email && <p>Email: {customer_email}</p>}
             </div>

            {/* Items Table */}
            <table className="w-full text-xs mb-4 border-t border-b border-dashed border-black">
                <thead>
                    <tr className="border-b border-dashed border-black">
                        <th className="py-1 text-left font-semibold">Item</th>
                        <th className="py-1 text-center font-semibold">Qty</th>
                        <th className="py-1 text-right font-semibold">Price</th>
                        <th className="py-1 text-right font-semibold">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {cart_items.map((item, index) => (
                        <tr key={item.product?._id || index}>
                            <td className="py-0.5 text-left">{item.product?.product_name || 'Unknown Item'}</td>
                            <td className="py-0.5 text-center">{item.quantity || 0}</td>
                            <td className="py-0.5 text-right">{formatCurrency(item.product?.product_price || 0)}</td>
                            <td className="py-0.5 text-right">{formatCurrency((item.product?.product_price || 0) * (item.quantity || 0))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

             {/* Totals Section */}
             <div className="text-xs mb-4 space-y-1">
                 <div className="flex justify-between">
                     <span>Subtotal:</span>
                     <span>{formatCurrency(subtotal)}</span>
                 </div>
                 {extra_charges.map((charge, index) => (
                     <div key={index} className="flex justify-between">
                         <span>{charge.chargeTitle || 'Extra Charge'}:</span>
                         <span>{formatCurrency(charge.amount || 0)}</span>
                     </div>
                 ))}
                  <div className="flex justify-between font-bold text-base border-t border-dashed border-black pt-1 mt-1">
                     <span>TOTAL:</span>
                     <span>{formatCurrency(total_amount || 0)}</span>
                 </div>
             </div>

            {/* Payment Mode */}
             <div className="text-xs mb-4 border-t border-dashed border-black pt-2">
                 <p>Payment Mode: <span className="font-semibold uppercase">{billing_mode || 'N/A'}</span></p>
             </div>

            {/* Footer */}
            <div className="text-center text-xs mt-6 pt-2 border-t border-dashed border-black">
                <p>Thank you for your purchase!</p>
                {/* Optional: Add address, contact, website etc. */}
            </div>
        </div>
    );
};

export default InvoiceTemplate; 