import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useAuth } from '../context/AuthContext';
import DashboardSidePanel from '../components/DashboardSidePanel';
import InvoiceTemplate from '../components/InvoiceTemplate';
import { FaTrashAlt, FaSearch, FaPrint } from 'react-icons/fa';

const Transactions = () => {
    const { user, token, loading: authLoading, authError, logout } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [billingMode, setBillingMode] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingData, setLoadingData] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: '' });

    useEffect(() => {
        if (!authLoading && token) {
            fetchTransactions();
        } else if (!authLoading && !token) {
            setLoadingData(false);
            setTransactions([]);
            setFilteredTransactions([]);
        }
    }, [authLoading, token]);

    useEffect(() => {
        filterTransactionsLogic();
    }, [searchTerm, startDate, endDate, billingMode, transactions]);

    const fetchTransactions = async () => {
        setLoadingData(true);
        setNotification({ message: '', type: '' });
        if (!token) {
            setNotification({ message: 'Cannot fetch data: Not authenticated.', type: 'error' });
            setLoadingData(false);
            return;
        }
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/transactions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    logout();
                    setNotification({ message: 'Session expired. Please log in again.', type: 'error' });
                } else {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch transactions' }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                setLoadingData(false);
                return;
            }
            
            const data = await response.json();
            
            if (data.success && Array.isArray(data.data)) {
                setTransactions(data.data);
            } else {
                console.error('Invalid data format received:', data);
                setTransactions([]);
                throw new Error('Received invalid transaction data from server.');
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            if (!notification.message) {
                setNotification({ message: `Error fetching transactions: ${error.message}`, type: 'error' });
            }
            setTransactions([]);
        } finally {
            setLoadingData(false);
        }
    };

    const filterTransactionsLogic = () => {
        let filtered = [...transactions];
        const search = searchTerm.toLowerCase();

        if (search) {
            filtered = filtered.filter(t => 
                (t.customer_name && t.customer_name.toLowerCase().includes(search)) ||
                (t.transaction_id && t.transaction_id.toLowerCase().includes(search))
            );
        }

        if (startDate) {
            const startDateObj = new Date(startDate);
            startDateObj.setHours(0, 0, 0, 0);
            filtered = filtered.filter(t => new Date(t.createdAt) >= startDateObj);
        }

        if (endDate) {
            const endDateObj = new Date(endDate);
            endDateObj.setHours(23, 59, 59, 999);
            filtered = filtered.filter(t => new Date(t.createdAt) <= endDateObj);
        }

        if (billingMode !== 'all') {
            filtered = filtered.filter(t => t.billing_mode === billingMode);
        }

        setFilteredTransactions(filtered);
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleDateChange = (date, type) => {
        if (type === 'start') {
            setStartDate(date);
        } else {
            setEndDate(date);
        }
    };

    const handleBillingModeChange = (event) => {
        setBillingMode(event.target.value);
    };

    const handleDeleteTransaction = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            setNotification({ message: '', type: '' });
            if (!token) {
                setNotification({ message: 'Authentication error.', type: 'error' });
                return;
            }
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/transactions/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        logout();
                        setNotification({ message: 'Session expired. Please log in again.', type: 'error' });
                    } else {
                        const errorData = await response.json().catch(() => ({ message: 'Failed to delete transaction' }));
                        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                    }
                    return;
                }
                setNotification({ message: 'Transaction deleted.', type: 'success' });
                fetchTransactions();
            } catch (error) {
                console.error('Error deleting transaction:', error);
                if (!notification.message) {
                    setNotification({ message: `Error deleting transaction: ${error.message}`, type: 'error' });
                }
            }
        }
    };

    const handleViewInvoice = (transaction) => {
        if (!transaction || !user) {
            alert('Transaction or user data is missing.');
            return;
        }

        const invoiceWindow = window.open('', '_blank', 'width=800,height=800');
        if (!invoiceWindow) {
            alert('Please allow popups for this website to print the invoice.');
            return;
        }

        invoiceWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice - ${transaction.transaction_id}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                 <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        @page { margin: 0.5cm; size: 80mm auto; }
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
        invoiceWindow.document.close();

        setTimeout(() => {
            const invoiceRoot = invoiceWindow.document.getElementById('invoice-root');
            if (invoiceRoot) {
                try {
                    const root = createRoot(invoiceRoot);
                    root.render(<InvoiceTemplate transaction={transaction} admin={user} />);
                } catch (renderError) {
                    console.error("Error rendering React component in popup:", renderError);
                    if (invoiceWindow.document.body) {
                        invoiceWindow.document.body.innerHTML = `<p style="color: red; font-family: sans-serif;">Error rendering invoice component: ${renderError.message}</p>`;
                    }
                }
            } else {
                console.error("Could not find invoice-root element in the popup window after delay.");
                if (invoiceWindow.document.body) {
                    invoiceWindow.document.body.innerHTML = '<p style="color: red; font-family: sans-serif;">Error: Could not find the root element (#invoice-root) to render the invoice.</p>';
                }
            }
        }, 150);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const options = { 
                year: 'numeric', month: 'short', day: 'numeric', 
                hour: '2-digit', minute: '2-digit', hour12: true
            };
            return new Date(dateString).toLocaleString('en-IN', options);
        } catch (error) {
            console.error("Error formatting date:", dateString, error);
            return 'Invalid Date';
        }
    };

    const formatCurrency = (amount) => {
        if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
        return `₹${amount.toFixed(2)}`;
    };

    if (authLoading) {
        return <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-gray-700 dark:text-gray-300">Authenticating...</p></div>;
    }
    if (!token && !authLoading) {
        return <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-gray-700 dark:text-gray-300">Please <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">log in</a>.</p></div>;
    }
    if (authError) {
        return <div className="flex h-screen w-full items-center justify-center p-4 bg-gray-100 dark:bg-gray-900"><p className="text-red-600 dark:text-red-400">Auth Error: {authError}</p></div>;
    }

    const inputBaseStyle = "block w-full text-sm rounded-md shadow-sm";
    const inputBorderStyle = "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400";
    const inputColorStyle = "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500";
    const inputPaddingStyle = "px-3 py-2";

    return (
        <div className="flex h-screen w-full font-[Inter] bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <DashboardSidePanel /> 
            <div className="flex-grow overflow-auto p-4 sm:p-6 lg:w-[calc(100%-16rem)]">
                <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Transactions</h1>

                {notification.message && (
                    <div className={`mb-4 p-3 rounded-md text-sm ${notification.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>
                        {notification.message}
                    </div>
                )}

                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-dark-md border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search (Name/ID)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="search"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    placeholder="Enter customer name or transaction ID..."
                                    className={`${inputBaseStyle} ${inputBorderStyle} ${inputColorStyle} pl-10 ${inputPaddingStyle}`}
                                />
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                            <input 
                                type="date" 
                                id="startDate" 
                                value={startDate}
                                onChange={(e) => handleDateChange(e.target.value, 'start')}
                                className={`${inputBaseStyle} ${inputBorderStyle} ${inputColorStyle} ${inputPaddingStyle}`}
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                            <input 
                                type="date" 
                                id="endDate" 
                                value={endDate}
                                onChange={(e) => handleDateChange(e.target.value, 'end')}
                                className={`${inputBaseStyle} ${inputBorderStyle} ${inputColorStyle} ${inputPaddingStyle}`}
                            />
                        </div>
                        <div>
                            <label htmlFor="billingMode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Mode</label>
                            <select 
                                id="billingMode" 
                                value={billingMode}
                                onChange={handleBillingModeChange}
                                className={`${inputBaseStyle} ${inputBorderStyle} ${inputColorStyle} ${inputPaddingStyle}`}
                            >
                                <option value="all">All</option>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="upi">UPI</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 dark:shadow-dark-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Mode</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {loadingData ? (
                                    <tr><td colSpan="6" className="text-center py-4 text-gray-500 dark:text-gray-400">Loading transactions...</td></tr>
                                ) : filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                                    <tr key={t._id} className="hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors duration-150">
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400 font-mono text-xs">...{t.transaction_id?.slice(-8)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-800 dark:text-gray-200">{t.customer_name || 'N/A'} <span className="text-gray-500 dark:text-gray-400">({t.customer_contact || 'N/A'})</span></td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{formatDate(t.createdAt)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-gray-800 dark:text-gray-100">{formatCurrency(t.total_amount)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ 
                                                t.billing_mode === 'cash' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                                                : t.billing_mode === 'card' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' 
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' 
                                            }`}>
                                                {t.billing_mode || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <button 
                                                onClick={() => handleViewInvoice(t)} 
                                                title="Print Invoice"
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-2 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                            >
                                                <FaPrint size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteTransaction(t._id)} 
                                                title="Delete Transaction"
                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                            >
                                                <FaTrashAlt size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="6" className="text-center py-4 text-gray-500 dark:text-gray-400">No transactions found matching your filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Transactions; 