import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardSidePanel from '../components/DashboardSidePanel';
import { FaRupeeSign, FaUsers, FaShoppingCart, FaChartPie } from 'react-icons/fa'; // Icons for metrics
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    ArcElement, 
    Tooltip, 
    Legend, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title
);

const Accounts = () => {
    const { token, loading: authLoading, authError, logout } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [metrics, setMetrics] = useState({
        totalSales: 0,
        totalTransactions: 0,
        uniqueCustomers: 0,
        averageTransactionValue: 0,
        salesByPaymentMode: { Cash: 0, Card: 0, UPI: 0 }
    });

    // Fetch transactions
    useEffect(() => {
        const fetchTransactions = async () => {
            if (!token) {
                setError("Authentication required.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('http://localhost:4000/api/transactions', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) logout();
                    throw new Error(data.message || `HTTP Error ${response.status}`);
                }
                if (data.success && Array.isArray(data.data)) {
                    setTransactions(data.data);
                } else {
                    throw new Error("Invalid transaction data received.");
                }
            } catch (err) {
                console.error("Error fetching transactions:", err);
                setError(err.message);
                setTransactions([]); // Clear data on error
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && token) {
            fetchTransactions();
        } else if (!authLoading && !token) {
            setLoading(false); // No token, stop loading
        }
    }, [authLoading, token, logout]);

    // Calculate metrics when transactions change
    useEffect(() => {
        if (transactions.length > 0) {
            const totalSales = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
            const totalTransactions = transactions.length;
            const uniqueCustomers = new Set(transactions.map(t => t.customer_contact)).size;
            const averageTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
            
            const salesByPaymentMode = transactions.reduce((acc, t) => {
                const mode = t.billing_mode || 'Unknown'; // Handle potential missing mode
                acc[mode] = (acc[mode] || 0) + (t.total_amount || 0);
                return acc;
            }, { Cash: 0, Card: 0, UPI: 0 }); // Initialize with expected modes

            setMetrics({
                totalSales,
                totalTransactions,
                uniqueCustomers,
                averageTransactionValue,
                salesByPaymentMode
            });
        } else {
            // Reset metrics if no transactions
            setMetrics({
                totalSales: 0,
                totalTransactions: 0,
                uniqueCustomers: 0,
                averageTransactionValue: 0,
                salesByPaymentMode: { Cash: 0, Card: 0, UPI: 0 }
            });
        }
    }, [transactions]);

    // --- Chart Data --- 
    const paymentModeData = {
        labels: Object.keys(metrics.salesByPaymentMode),
        datasets: [
            {
                label: 'Sales by Payment Mode',
                data: Object.values(metrics.salesByPaymentMode),
                backgroundColor: [
                    'rgba(34, 197, 94, 0.6)',  // Green-500
                    'rgba(59, 130, 246, 0.6)',  // Blue-500
                    'rgba(168, 85, 247, 0.6)', // Purple-500
                    'rgba(107, 114, 128, 0.6)' // Gray-500
                ],
                borderColor: [
                    '#16a34a', // Green-600
                    '#2563eb', // Blue-600
                    '#9333ea', // Purple-600
                    '#4b5563'  // Gray-600
                ],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false, // Allow chart to fill container height
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#4b5563', // slate-300 : gray-600
                }
            },
            title: {
                display: true,
                text: 'Sales Distribution by Payment Mode',
                color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151', // gray-200 : gray-700
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
            tooltip: {
                backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)', // gray-800 : white
                titleColor: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937', // gray-100 : gray-800
                bodyColor: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151', // gray-300 : gray-700
                borderColor: document.documentElement.classList.contains('dark') ? '#4b5563' : '#e5e7eb', // gray-600 : gray-200
                borderWidth: 1
            }
        },
    };

    // --- Render Logic --- 
    if (authLoading) return <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-gray-700 dark:text-gray-300">Authenticating...</p></div>;
    if (!token && !authLoading) return <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-gray-700 dark:text-gray-300">Please <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">log in</a>.</p></div>;
    if (authError) return <div className="flex h-screen w-full items-center justify-center p-4 bg-gray-100 dark:bg-gray-900"><p className="text-red-600 dark:text-red-400">Auth Error: {authError}</p></div>;
    
    return (
        <div className="flex h-screen w-full font-[Inter] bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <DashboardSidePanel />
            <div className="flex-grow overflow-auto p-4 sm:p-6 lg:w-[calc(100%-16rem)]">
                <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Accounts Overview</h1>

                {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600/50 text-red-700 dark:text-red-300 rounded-md text-sm">Error fetching data: {error}</div>}

                {loading ? (
                    <p className="text-center text-gray-500 dark:text-gray-400">Loading financial data...</p>
                ) : transactions.length === 0 && !error ? (
                    <p className="text-center text-gray-500 dark:text-gray-400">No transaction data available to generate accounts overview.</p>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-dark-md border border-gray-200 dark:border-gray-700 flex items-center gap-3 sm:gap-4 hover:shadow-md dark:hover:shadow-dark-lg transition-shadow duration-200">
                                <FaRupeeSign className="text-2xl sm:text-3xl text-green-500 dark:text-green-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Sales</p>
                                    <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">{metrics.totalSales.toFixed(2)}</p>
                                </div>
                            </div>
                             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-dark-md border border-gray-200 dark:border-gray-700 flex items-center gap-3 sm:gap-4 hover:shadow-md dark:hover:shadow-dark-lg transition-shadow duration-200">
                                <FaShoppingCart className="text-2xl sm:text-3xl text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Transactions</p>
                                    <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">{metrics.totalTransactions}</p>
                                </div>
                            </div>
                             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-dark-md border border-gray-200 dark:border-gray-700 flex items-center gap-3 sm:gap-4 hover:shadow-md dark:hover:shadow-dark-lg transition-shadow duration-200">
                                <FaUsers className="text-2xl sm:text-3xl text-purple-500 dark:text-purple-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unique Customers</p>
                                    <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">{metrics.uniqueCustomers}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-dark-md border border-gray-200 dark:border-gray-700 flex items-center gap-3 sm:gap-4 hover:shadow-md dark:hover:shadow-dark-lg transition-shadow duration-200">
                                <FaRupeeSign className="text-2xl sm:text-3xl text-orange-500 dark:text-orange-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg. Transaction</p>
                                    <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">{metrics.averageTransactionValue.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow dark:shadow-dark-md border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <FaChartPie /> Payment Method Distribution
                            </h2>
                            <div className="relative h-64 sm:h-72 md:h-80">
                                {Object.values(metrics.salesByPaymentMode).some(v => v > 0) ? (
                                    <Doughnut data={paymentModeData} options={chartOptions} />
                                ) : (
                                    <p className="text-center text-gray-500 dark:text-gray-400 pt-10">No sales data for payment mode chart.</p>
                                )}
                           </div>
                        </div>
                       
                        {/* TODO: Add more charts/tables as needed (e.g., Sales over time Bar chart, Recent High-Value Transactions table) */}

                    </div>
                )}
            </div>
        </div>
    );
};

export default Accounts; 