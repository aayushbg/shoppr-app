import React, { useState, useEffect } from 'react';
import DashboardSidePanel from "../components/DashboardSidePanel";
import { IoNotifications } from "react-icons/io5";
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Helper function to format currency
const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '₹0.00';
    return `₹${amount.toFixed(2)}`;
};

// Helper function to format date (e.g., YYYY-MM-DD)
const formatDate = (date) => {
    if (!(date instanceof Date)) { // Add check if date is valid
        try {
            date = new Date(date);
            if (isNaN(date.getTime())) return 'Invalid Date'; // Check if conversion was successful
        } catch (e) {
            return 'Invalid Date';
        }
    }
    return date.toISOString().split('T')[0];
};

const Dashboard = () => {
    const { user, token, loading: authLoading, authError, logout } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);

    // State for calculated data
    const [summaryData, setSummaryData] = useState({
        todaySales: 0,
        totalSales: 0,
        totalCustomers: 0,
        avgSpend: 0,
    });
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [],
    });
    const [trendingItems, setTrendingItems] = useState([]);
    const [topTransactions, setTopTransactions] = useState([]);

    // Fetch transactions on mount after auth check
    useEffect(() => {
        if (!authLoading && token) {
            fetchTransactions();
        } else if (!authLoading && !token) {
            setLoadingData(false); // Not logged in
        }
    }, [authLoading, token]);

    // Calculate data once transactions are fetched
    useEffect(() => {
        if (transactions.length > 0) {
            calculateDashboardData();
        } else {
            // Reset data if transactions are empty (e.g., after logout or error)
            setSummaryData({ todaySales: 0, totalSales: 0, totalCustomers: 0, avgSpend: 0 });
            setChartData({ labels: [], datasets: [] });
            setTrendingItems([]);
            setTopTransactions([]);
        }
    }, [transactions]);

    const fetchTransactions = async () => {
        setLoadingData(true);
        setError(null);
        if (!token) {
            setError("Authentication token not found.");
            setLoadingData(false);
            return;
        }
        try {
            const response = await fetch('http://localhost:4000/api/transactions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    logout(); // Logout if token is invalid
                    setError("Session expired. Please log in again.");
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP error ${response.status}`);
                }
                 setLoadingData(false);
                 setTransactions([]); // Clear transactions on error
                 return;
            }
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                setTransactions(data.data);
            } else {
                setTransactions([]); // Clear transactions on invalid data
                throw new Error("Invalid transaction data format from server.");
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
             if (!error) { // Avoid overwriting logout error
                 setError(err.message);
             }
            setTransactions([]); // Clear transactions on error
        } finally {
            setLoadingData(false);
        }
    };

    // Function to calculate all dashboard metrics
    const calculateDashboardData = () => {
        const today = new Date();
        const todayDateStr = formatDate(today); // Get today's date string

        let todaySales = 0;
        let totalSales = 0;
        const customerSet = new Set();
        const productCounts = {};
        const salesByDay = {}; // For chart

        transactions.forEach(t => {
            const transactionDate = new Date(t.createdAt);
            const transactionDateStr = formatDate(transactionDate);
            const transactionTotal = typeof t.total_amount === 'number' ? t.total_amount : 0;
            
            // Total Sales
            totalSales += transactionTotal;

            // Today's Sales
            if (transactionDateStr === todayDateStr) {
                todaySales += transactionTotal;
            }

            // Total Customers (using contact as identifier)
            if (t.customer_contact) {
                customerSet.add(t.customer_contact);
            }

            // Product Counts for Trending Items
            if (t.cart_items && Array.isArray(t.cart_items)) {
                t.cart_items.forEach(item => {
                    if (item.product && item.product._id) { // Check if product and _id exist
                        const productId = item.product._id;
                        productCounts[productId] = (productCounts[productId] || { count: 0, name: item.product.product_name || 'Unknown Product' });
                        productCounts[productId].count += item.quantity;
                    }
                });
            }
            
            // Aggregate Sales by Day for Chart
             salesByDay[transactionDateStr] = (salesByDay[transactionDateStr] || 0) + transactionTotal;
        });

        const totalCustomers = customerSet.size;
        const avgSpend = totalCustomers > 0 ? totalSales / totalCustomers : 0;

        setSummaryData({
            todaySales,
            totalSales,
            totalCustomers,
            avgSpend,
        });

        // Prepare Chart Data (last 7 days including today)
        const labels = [];
        const dataPoints = [];
        const chartEndDate = new Date(); // Today
        for (let i = 6; i >= 0; i--) { 
            const date = new Date(chartEndDate);
            date.setDate(chartEndDate.getDate() - i);
            const dayKey = formatDate(date);
            labels.push(dayKey);
            dataPoints.push(salesByDay[dayKey] || 0); // Use aggregated sales for the day
        }
        setChartData({
            labels,
            datasets: [
                {
                    label: 'Daily Sales',
                    data: dataPoints,
                    borderColor: 'rgb(53, 162, 235)',
                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    tension: 0.1 // Add slight curve to the line
                },
            ],
        });

        // Prepare Trending Items (Top 5)
        const sortedProducts = Object.entries(productCounts)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 5);
        setTrendingItems(sortedProducts.map(([id, data]) => ({ id, name: data.name, count: data.count })));

        // Prepare Top Transactions (Top 5 most recent)
        const sortedTransactions = [...transactions]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        setTopTransactions(sortedTransactions);
    };
    
    // Render loading/error states
    if (authLoading) {
        return <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-gray-700 dark:text-gray-300">Authenticating...</p></div>;
    }
    if (!token && !authLoading) {
        return <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-gray-700 dark:text-gray-300">Please <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">log in</a>.</p></div>;
    }
     if (authError) {
        return <div className="flex h-screen w-full items-center justify-center p-4 bg-gray-100 dark:bg-gray-900"><p className="text-red-600 dark:text-red-400">Auth Error: {authError}</p></div>;
     }
     // Render specific dashboard error or loading state within the layout
     const renderContent = () => {
         if (error) {
             return <div className="p-6 text-center text-red-600 dark:text-red-400">Error loading dashboard data: {error}</div>;
         }
         if (loadingData) {
             return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading Dashboard Data...</div>;
         }
         // Render the actual dashboard content when data is loaded
         return (
             <div className="space-y-6">
                 {/* Summary Cards - Responsive Grid */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                     {/* Card: Today's Sales */}
                     <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg border border-gray-200 dark:border-gray-700 dark:shadow-dark-md hover:shadow-md dark:hover:shadow-dark-lg transition-shadow duration-200">
                         <h1 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today's Sales</h1>
                         <h1 className="mt-2 font-bold text-2xl sm:text-3xl text-blue-600 dark:text-blue-400">{formatCurrency(summaryData.todaySales)}</h1>
                     </div>
                     {/* Card: Total Sales */}
                     <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg border border-gray-200 dark:border-gray-700 dark:shadow-dark-md hover:shadow-md dark:hover:shadow-dark-lg transition-shadow duration-200">
                         <h1 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Sales</h1>
                         <h1 className="mt-2 font-bold text-2xl sm:text-3xl text-green-600 dark:text-green-400">{formatCurrency(summaryData.totalSales)}</h1>
                     </div>
                     {/* Card: Total Customers */}
                     <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg border border-gray-200 dark:border-gray-700 dark:shadow-dark-md hover:shadow-md dark:hover:shadow-dark-lg transition-shadow duration-200">
                         <h1 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Customers</h1>
                         <h1 className="mt-2 font-bold text-2xl sm:text-3xl text-purple-600 dark:text-purple-400">{summaryData.totalCustomers}</h1>
                     </div>
                     {/* Card: Average Spend */}
                     <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg border border-gray-200 dark:border-gray-700 dark:shadow-dark-md hover:shadow-md dark:hover:shadow-dark-lg transition-shadow duration-200">
                         <h1 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg. Spend</h1>
                         <h1 className="mt-2 font-bold text-2xl sm:text-3xl text-orange-600 dark:text-orange-400">{formatCurrency(summaryData.avgSpend)}</h1>
                     </div>
                 </div>

                 {/* Chart and Lists Section - Responsive Layout */}
                 <div className="flex flex-col lg:flex-row gap-6">
                     {/* Sales Report Chart (Takes more space on larger screens) */}
                     <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg border border-gray-200 dark:border-gray-700 dark:shadow-dark-md w-full lg:w-2/3">
                         <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Sales Report (Last 7 Days)</h2>
                         <div className="relative h-64 sm:h-80"> {/* Chart container with fixed height */}
                             {chartData.labels && chartData.labels.length > 0 ? (
                                 <Line options={{ responsive: true, maintainAspectRatio: false }} data={chartData} />
                             ) : (
                                 <p className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">No sales data available for chart.</p>
                             )}
                         </div>
                     </div>

                     {/* Trending Items (Takes less space) */}
                     <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg border border-gray-200 dark:border-gray-700 dark:shadow-dark-md w-full lg:w-1/3">
                         <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Trending Items (Top 5)</h2>
                         <div className="space-y-2 text-sm overflow-y-auto max-h-80"> {/* Scrollable list */}
                             {trendingItems.length > 0 ? trendingItems.map((item) => (
                                 <div key={item.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                     <span className="text-gray-800 dark:text-gray-200 truncate pr-2">{item.name}</span>
                                     <span className="font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full text-xs">{item.count} sold</span>
                                 </div>
                             )) : (
                                 <p className="text-gray-500 dark:text-gray-400">No trending items data.</p>
                             )}
                         </div>
                     </div>
                 </div>

                 {/* Top Transactions Table */}
                 <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg border border-gray-200 dark:border-gray-700 dark:shadow-dark-md">
                     <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Recent Transactions (Top 5)</h2>
                     <div className="overflow-x-auto"> {/* Make table horizontally scrollable on small screens */}
                         <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                             <thead className="bg-gray-50 dark:bg-gray-700/50">
                                 <tr>
                                     <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                                     <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                     <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                     <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                     <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mode</th>
                                 </tr>
                             </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                 {topTransactions.length > 0 ? topTransactions.map((t) => (
                                     <tr key={t._id} className="hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors duration-150">
                                         <td className="px-4 py-2 whitespace-nowrap text-gray-600 dark:text-gray-400 font-mono text-xs">...{t.transaction_id?.slice(-8)}</td>
                                         <td className="px-4 py-2 whitespace-nowrap text-gray-800 dark:text-gray-200">{t.customer_name}</td>
                                         <td className="px-4 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">{formatDate(t.createdAt)}</td>
                                         <td className="px-4 py-2 whitespace-nowrap text-right font-medium text-gray-800 dark:text-gray-100">{formatCurrency(t.total_amount)}</td>
                                         <td className="px-4 py-2 whitespace-nowrap">
                                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ 
                                                  t.billing_mode === 'cash' 
                                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                                                  : t.billing_mode === 'card' 
                                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' 
                                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' 
                                              }`}>
                                                  {t.billing_mode}
                                              </span>
                                         </td>
                                     </tr>
                                 )) : (
                                     <tr><td colSpan="5" className="text-center py-4 text-gray-500 dark:text-gray-400">No recent transactions found.</td></tr>
                                 )}
                             </tbody>
                         </table>
                     </div>
                 </div>
             </div>
         );
     };

    // Main Dashboard Layout Render
    return (
        <div className="flex h-screen w-full font-[Inter] bg-gray-100 dark:bg-gray-900">
            <DashboardSidePanel />
            {/* Main Content Area - Responsive Width */}
            <div className="flex-grow overflow-auto p-6 lg:w-[calc(100%-16rem)] dark:text-gray-300">
                {/* Header (Optional: Add dashboard specific header if needed) */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
                    {/* Maybe add date range selector or notifications icon here */}
                    <div className="flex items-center space-x-4">
                        <button className="relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <span className="sr-only">View notifications</span>
                            <IoNotifications size={20} />
                        </button>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hi, {user?.name || 'Admin'}!</span>
                    </div>
                </div>

                {/* Content Loading/Error States */}
                {loadingData && <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading Dashboard Data...</div>}
                {error && <div className="p-6 text-center text-red-600 dark:text-red-400">Error loading dashboard data: {error}</div>}
                
                {/* Dashboard Content (Only render if not loading and no error) */}
                {!loadingData && !error && (
                    renderContent()
                )}
            </div>
        </div>
    );
};

export default Dashboard;