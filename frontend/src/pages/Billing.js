import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot for React 18+ new window rendering
import { useAuth } from '../context/AuthContext';
import DashboardSidePanel from '../components/DashboardSidePanel';
import InvoiceTemplate from '../components/InvoiceTemplate'; // Import the invoice template
import { FaPlus, FaMinus, FaTrashAlt, FaTimes, FaPrint } from 'react-icons/fa'; // Added FaPrint

const Billing = () => {
    // Get auth state
    const { user, token, loading: authLoading, authError, logout } = useAuth();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]); // Add state for filtered products
    const [productSearchTerm, setProductSearchTerm] = useState(''); // State for product search
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerContact, setCustomerContact] = useState('');
    const [billingMode, setBillingMode] = useState('cash');
    const [extraCharges, setExtraCharges] = useState([]);
    const [newCharge, setNewCharge] = useState({ title: '', amount: '' });
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [creatingBill, setCreatingBill] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' }); // Combined error/notification state
    const [lastCreatedBillData, setLastCreatedBillData] = useState(null); // State for last successful bill

    // Fetch products only when authenticated
    useEffect(() => {
        if (!authLoading && token) {
            fetchProducts();
        } else if (!authLoading && !token) {
            setLoadingProducts(false);
            setProducts([]);
        }
    }, [authLoading, token]);

    // Update filtered products when products or search term change
    useEffect(() => {
        let filtered = [...products];
        if (productSearchTerm) {
            filtered = filtered.filter(p => 
                p.product_name.toLowerCase().includes(productSearchTerm.toLowerCase())
            );
        }
        setFilteredProducts(filtered);
    }, [products, productSearchTerm]);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        setNotification({ message: '', type: '' }); // Clear notification
        if (!token) {
             setNotification({ message: 'Cannot fetch data: Not authenticated.', type: 'error' });
             setLoadingProducts(false);
             return;
        }
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/products`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Use token from context
                }
            });

            if (!response.ok) {
                 if (response.status === 401 || response.status === 403) {
                     logout();
                     setNotification({ message: 'Session expired. Please log in again.', type: 'error' });
                 } else {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch products' }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                 }
                  setLoadingProducts(false);
                  return;
            }

            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                setProducts(data.data);
            } else {
                console.error('Invalid product data format:', data);
                setProducts([]);
                throw new Error('Received invalid product data from server.');
            }
        } catch (err) {
            console.error('Error fetching products:', err);
             if (!notification.message) {
                 setNotification({ message: `Error fetching products: ${err.message}`, type: 'error' });
             }
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    };
    
     const handleProductSearch = (event) => {
        setProductSearchTerm(event.target.value);
    };

    const handleAddToCart = (product) => {
        if (product.product_quantity <= 0) {
            alert(`${product.product_name} is out of stock.`);
            return;
        }
    
        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(item => item.product._id === product._id);
            if (existingItemIndex > -1) {
                const updatedCart = [...prevCart];
                const currentItem = updatedCart[existingItemIndex];
                // Check if adding more exceeds stock
                if (currentItem.quantity < product.product_quantity) {
                    updatedCart[existingItemIndex] = { ...currentItem, quantity: currentItem.quantity + 1 };
                } else {
                    alert(`Cannot add more ${product.product_name}. Stock limit reached.`);
                }
                return updatedCart;
            } else {
                // Ensure we don't add more than available stock when adding initially
                 const quantityToAdd = Math.min(1, product.product_quantity);
                return [...prevCart, { product, quantity: quantityToAdd }];
            }
        });
    };

    const handleRemoveFromCart = (productId) => {
        setCart(cart.filter(item => item.product._id !== productId));
    };

    const handleUpdateQuantity = (productId, newQuantityStr) => {
        const newQuantity = parseInt(newQuantityStr, 10);
        
        if (isNaN(newQuantity) || newQuantity < 1) {
            // Optionally remove item if quantity is invalid or less than 1
            // handleRemoveFromCart(productId);
            return; // Or keep the existing quantity
        }

        setCart(prevCart => {
            return prevCart.map(item => {
                if (item.product._id === productId) {
                    // Check against available stock
                    if (newQuantity <= item.product.product_quantity) {
                        return { ...item, quantity: newQuantity };
                    } else {
                        alert(`Only ${item.product.product_quantity} units of ${item.product.product_name} available.`);
                        // Revert to max available stock or keep current quantity?
                        return { ...item, quantity: item.product.product_quantity }; 
                    }
                }
                return item;
            });
        });
    };

    const handleAddExtraCharge = () => {
        const amount = parseFloat(newCharge.amount);
        if (newCharge.title && !isNaN(amount) && amount >= 0) {
            setExtraCharges([...extraCharges, { title: newCharge.title, amount: amount }]);
            setNewCharge({ title: '', amount: '' });
        } else {
            alert('Please enter a valid title and non-negative amount for the extra charge.');
        }
    };

    const handleRemoveExtraCharge = (index) => {
        setExtraCharges(extraCharges.filter((_, i) => i !== index));
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + (item.product.product_price * item.quantity), 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const extraChargesTotal = extraCharges.reduce((sum, charge) => sum + Number(charge.amount), 0);
        return subtotal + extraChargesTotal;
    };

    const handleCreateBill = async () => {
        if (!customerName || !customerContact || cart.length === 0) {
            alert('Please enter customer name and contact.');
            return;
        }
        if (!token) {
            alert('Authentication error. Please log in again.');
            return;
        }

        setCreatingBill(true);
        setNotification({ message: '', type: '' }); // Clear notification
        setLastCreatedBillData(null); // Clear previous invoice data on new attempt
        try {
            const transactionData = {
                // Use user ID from context if available
                admin: user?._id || 'admin_id_placeholder', 
                customer_name: customerName,
                customer_contact: customerContact,
                cart_items: cart.map(item => ({ product: item.product._id, quantity: item.quantity })),
                extra_charges: extraCharges,
                billing_mode: billingMode,
                total_amount: calculateTotal()
            };

            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Use token from context
                },
                body: JSON.stringify(transactionData)
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                     logout();
                     setNotification({ message: 'Session expired. Please log in again.', type: 'error' });
                 } else {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to create bill' }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                 }
                 setCreatingBill(false);
                 return;
            }

            const result = await response.json(); // Get the response data
            
            // Check backend success flag in the result
            if (result.success && result.data) {
                 // Bill created successfully
                setNotification({ message: 'Bill created successfully!', type: 'success' });
                setLastCreatedBillData(result.data); // *** Store the successful transaction data ***
                
                // Reset form state
                setCart([]);
                setCustomerName('');
                setCustomerContact('');
                setBillingMode('cash');
                setExtraCharges([]);
                setNewCharge({ title: '', amount: '' });
                fetchProducts(); // Refresh product stock
            } else {
                // Handle cases where response is OK but backend indicates failure
                 throw new Error(result.message || 'Backend indicated failure, but response was OK.');
            }

        } catch (err) {
            console.error('Error creating bill:', err);
             if (!notification.message) {
                setNotification({ message: `Error creating bill: ${err.message}`, type: 'error' });
             }
        } finally {
            setCreatingBill(false);
        }
    };

    const handlePrintInvoice = () => {
        if (!lastCreatedBillData || !user) {
            alert('No invoice data available or user data missing.');
            return;
        }

        const invoiceWindow = window.open('', '_blank', 'width=800,height=800');
        if (!invoiceWindow) {
            alert('Please allow popups for this website to print the invoice.');
            return;
        }

        // Basic HTML structure for the new window
        invoiceWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice - ${lastCreatedBillData.transaction_id}</title>
                <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                 <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        @page { margin: 0.5cm; size: 80mm auto; } /* Adjust print margins/size */
                        /* Hide button in print view */
                        .print-button { display: none; }
                     }
                 </style>
            </head>
            <body>
                <div id="invoice-root"></div>
                 <button class="print-button fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded shadow-lg" onclick="window.print()">Print</button>
             </body>
            </html>
        `);
        invoiceWindow.document.close(); // Important: Close the document stream

        // Delay checking for the element and rendering
        setTimeout(() => {
            const invoiceRoot = invoiceWindow.document.getElementById('invoice-root');
            console.log("Popup window invoice-root element (after delay):", invoiceRoot);

            if (invoiceRoot) {
                try {
                    const root = createRoot(invoiceRoot);
                    console.log("Data passed to InvoiceTemplate:", { transaction: lastCreatedBillData, admin: user });
                    root.render(<InvoiceTemplate transaction={lastCreatedBillData} admin={user} />);
                } catch (renderError) {
                    console.error("Error rendering React component in popup:", renderError);
                    // Try writing error to body, but check if body exists first
                    if (invoiceWindow.document.body) {
                         invoiceWindow.document.body.innerHTML = `<p style="color: red; font-family: sans-serif;">Error rendering invoice component: ${renderError.message}</p>`;
                     } else {
                         console.error("Popup body not available even after delay to report render error.");
                     }
                }
            } else {
                console.error("Could not find invoice-root element in the popup window after delay.");
                 // Try writing error to body, but check if body exists first
                 if (invoiceWindow.document.body) {
                     invoiceWindow.document.body.innerHTML = '<p style="color: red; font-family: sans-serif;">Error: Could not find the root element (#invoice-root) to render the invoice.</p>';
                 } else {
                     console.error("Popup body not available even after delay to report missing root element.");
                 }
            }
        }, 750); // Increased delay slightly just in case
    };
    
    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return 'N/A';
         // Added dark:text-gray-200 for consistency, though usually overridden
        return <span className="dark:text-gray-200">{`₹${amount.toFixed(2)}`}</span>; 
   };

    // Render logic
     // --- Loading/Error States (with dark styles) ---
    if (authLoading) {
         return <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-gray-700 dark:text-gray-300">Authenticating...</p></div>;
    }
    if (!token && !authLoading) {
          return <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-gray-700 dark:text-gray-300">Please <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">log in</a>.</p></div>;
    }
     if (authError) {
          return <div className="flex h-screen w-full items-center justify-center p-4 bg-gray-100 dark:bg-gray-900"><p className="text-red-600 dark:text-red-400">Auth Error: {authError}</p></div>;
     }

    return (
         // Added dark styles
        <div className="flex h-screen w-full font-[Inter] bg-gray-100 dark:bg-gray-900">
            <DashboardSidePanel />
             {/* Added dark styles */}
            <div className="flex-grow overflow-auto p-6 lg:w-[calc(100%-16rem)] text-gray-800 dark:text-gray-200">
                 {/* Added dark styles */}
                <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Billing</h1>
                
                {/* Notification - Added dark styles */}
                 {notification.message && (
                      <div className={`border px-4 py-3 rounded relative mb-4 text-sm ${notification.type === 'success' 
                          ? 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600/50 dark:text-green-300' 
                          : 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-600/50 dark:text-red-300'}`} role="alert">
                        <span className="block sm:inline">{notification.message}</span>
                         {/* Added dark styles */}
                        <button onClick={() => setNotification({ message: '', type: '' })} className="absolute top-0 bottom-0 right-0 px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                            <FaTimes className="h-4 w-4"/>
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Products Section (Left/Main) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Product List Card - Added dark styles */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-dark-md border border-gray-200 dark:border-gray-700">
                             {/* Added dark styles */}
                             <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-100">Available Products</h2>
                              {/* Product Search Input - Added dark styles */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={productSearchTerm}
                                    onChange={handleProductSearch}
                                     className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                                />
                            </div>
                             {/* Added dark styles */}
                            {loadingProducts ? (
                                <p className="text-gray-500 dark:text-gray-400">Loading products...</p>
                            ) : (
                                 <div className="max-h-96 overflow-y-auto overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md">
                                     <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
                                         {/* Table Head - Added dark styles */}
                                         <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                             <tr>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                                             </tr>
                                         </thead>
                                         {/* Table Body - Added dark styles */}
                                         <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                                             {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                                                 <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                     <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{product.product_name}</td>
                                                     <td className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{formatCurrency(product.product_price)}</td>
                                                     {/* Stock Color - Added dark styles */}
                                                     <td className={`px-3 py-2 whitespace-nowrap ${product.product_quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{product.product_quantity > 0 ? `${product.product_quantity} units` : 'Out of Stock'}</td>
                                                     <td className="px-3 py-2 whitespace-nowrap">
                                                         {/* Add Button - Added dark styles */}
                                                         <button
                                                             onClick={() => handleAddToCart(product)}
                                                             disabled={product.product_quantity <= 0}
                                                             className={`px-3 py-1 rounded-md text-white text-xs transition duration-150 ease-in-out ${product.product_quantity > 0 
                                                                 ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800' 
                                                                 : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'}`}
                                                         >
                                                             Add
                                                         </button>
                                                     </td>
                                                 </tr>
                                             )) : (
                                                 <tr><td colSpan="4" className="text-center py-4 text-gray-500 dark:text-gray-400">No products found.</td></tr>
                                             )}
                                         </tbody>
                                     </table>
                                 </div>
                            )}
                        </div>

                        {/* Cart Section Card - Added dark styles */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-dark-md border border-gray-200 dark:border-gray-700">
                             {/* Added dark styles */}
                             <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-100">Shopping Cart</h2>
                             {/* Added dark styles */}
                             {cart.length === 0 ? (
                                  <p className="text-gray-500 dark:text-gray-400">Your cart is empty.</p>
                             ) : (
                                  <div className="max-h-96 overflow-y-auto overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md">
                                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
                                           {/* Table Head - Added dark styles */}
                                          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                              <tr>
                                                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                                                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                                                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                                                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                                              </tr>
                                          </thead>
                                           {/* Table Body - Added dark styles */}
                                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                                              {cart.map((item) => (
                                                  <tr key={item.product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                      <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{item.product.product_name}</td>
                                                      <td className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{formatCurrency(item.product.product_price)}</td>
                                                      <td className="px-3 py-2 whitespace-nowrap">
                                                          <div className="flex items-center">
                                                               {/* +/- Buttons - Added dark styles */}
                                                              <button onClick={() => handleUpdateQuantity(item.product._id, item.quantity - 1)} className="p-1 rounded text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600">
                                                                  <FaMinus size={12} />
                                                              </button>
                                                              {/* Quantity Input - Added dark styles */}
                                                              <input 
                                                                  type="number"
                                                                  min="1"
                                                                  value={item.quantity}
                                                                  onChange={(e) => handleUpdateQuantity(item.product._id, e.target.value)}
                                                                   className="w-12 mx-1 text-center border border-gray-300 dark:border-gray-600 rounded text-sm py-0.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                                                               />
                                                               {/* +/- Buttons - Added dark styles */}
                                                              <button onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)} className="p-1 rounded text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600">
                                                                  <FaPlus size={12} />
                                                              </button>
                                                          </div>
                                                      </td>
                                                      <td className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{formatCurrency(item.product.product_price * item.quantity)}</td>
                                                      <td className="px-3 py-2 whitespace-nowrap">
                                                           {/* Remove Button - Added dark styles */}
                                                          <button 
                                                              onClick={() => handleRemoveFromCart(item.product._id)} 
                                                               className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                                                           >
                                                              <FaTrashAlt size={14} />
                                                          </button>
                                                      </td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                             )}
                        </div>
                    </div>

                    {/* Billing Summary Section (Right) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Customer Details Card - Added dark styles */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-dark-md border border-gray-200 dark:border-gray-700">
                             {/* Added dark styles */}
                             <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-100">Customer Details</h2>
                            <div className="space-y-3">
                                <div>
                                     {/* Added dark styles */}
                                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                     {/* Added dark styles */}
                                    <input
                                        type="text"
                                        id="customerName"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                         className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                                        required
                                    />
                                </div>
                                <div>
                                     {/* Added dark styles */}
                                    <label htmlFor="customerContact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact</label>
                                     {/* Added dark styles */}
                                    <input
                                        type="text" // Use text for flexibility, consider tel type with pattern for validation
                                        id="customerContact"
                                        value={customerContact}
                                        onChange={(e) => setCustomerContact(e.target.value)}
                                         className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                                        required
                                    />
                                </div>
                                <div>
                                     {/* Added dark styles */}
                                    <label htmlFor="billingMode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Mode</label>
                                     {/* Added dark styles */}
                                    <select
                                        id="billingMode"
                                        value={billingMode}
                                        onChange={(e) => setBillingMode(e.target.value)}
                                         className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="online">Online</option> {/* Changed UPI to Online to match original? Keep online for now */}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Extra Charges Card - Added dark styles */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-dark-md border border-gray-200 dark:border-gray-700">
                             {/* Added dark styles */}
                             <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-100">Extra Charges</h2>
                            <div className="space-y-3 mb-4">
                                {extraCharges.map((charge, index) => (
                                     // Added dark styles
                                    <div key={index} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-200 dark:border-gray-600">
                                         {/* Added dark styles */}
                                        <span className="text-gray-800 dark:text-gray-200">{charge.title}: {formatCurrency(charge.amount)}</span>
                                         {/* Added dark styles */}
                                        <button onClick={() => handleRemoveExtraCharge(index)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30">
                                            <FaTrashAlt size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                 {/* Added dark styles */}
                                <input
                                    type="text"
                                    placeholder="Charge Title"
                                    value={newCharge.title}
                                    onChange={(e) => setNewCharge({ ...newCharge, title: e.target.value })}
                                     className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm min-w-[100px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                                />
                                 {/* Added dark styles */}
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={newCharge.amount}
                                    onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })}
                                     className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                                />
                                 {/* Add Charge Button - Added dark styles */}
                                <button 
                                    onClick={handleAddExtraCharge} 
                                     className="px-3 py-1 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-md text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                         {/* Summary Card - Added dark styles */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-dark-md border border-gray-200 dark:border-gray-700">
                             {/* Added dark styles */}
                             <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-100">Summary</h2>
                            <div className="space-y-2 text-sm">
                                 {/* Added dark styles */}
                                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(calculateSubtotal())}</span>
                                </div>
                                 {/* Added dark styles */}
                                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                    <span>Extra Charges:</span>
                                    <span>{formatCurrency(extraCharges.reduce((sum, charge) => sum + Number(charge.amount), 0))}</span>
                                </div>
                                 {/* Added dark styles */}
                                <hr className="my-2 border-gray-200 dark:border-gray-600" />
                                 {/* Added dark styles */}
                                <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-gray-100">
                                    <span>Total:</span>
                                    <span>{formatCurrency(calculateTotal())}</span>
                                </div>
                            </div>
                             {/* Create Bill Button - Added dark styles */}
                            <button
                                onClick={handleCreateBill}
                                disabled={creatingBill || cart.length === 0}
                                 className={`w-full mt-4 py-2 px-4 rounded-md text-white font-semibold transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    (creatingBill || cart.length === 0) 
                                     ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                                     : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:ring-indigo-500 dark:focus:ring-offset-gray-800'
                                }`}
                            >
                                {creatingBill ? 'Creating Bill...' : 'Create Bill'}
                            </button>
                            
                            {/* Print Invoice Button - Added dark styles */}
                            {lastCreatedBillData && (
                                <button
                                    onClick={handlePrintInvoice}
                                     className="w-full mt-2 py-2 px-4 rounded-md text-white font-semibold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition duration-150 ease-in-out flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
                                >
                                     <FaPrint /> View / Print Last Invoice
                                 </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Billing; 