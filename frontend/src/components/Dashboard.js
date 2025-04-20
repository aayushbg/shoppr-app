import React, { useState, useEffect } from 'react';
import DashboardSidePanel from "./DashboardSidePanel";
import { IoNotifications } from "react-icons/io5";
import { useAuth } from '../context/AuthContext'; // Import useAuth
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
                 return;
            }
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                setTransactions(data.data);
            } else {
                throw new Error("Invalid transaction data format from server.");
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
            setError(err.message);
        } finally {
            setLoadingData(false);
        }
    };

    // Function to calculate all dashboard metrics
    const calculateDashboardData = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        let todaySales = 0;
        let totalSales = 0;
        const customerSet = new Set();
        const productCounts = {};
        const salesByDay = {}; // For chart

        transactions.forEach(t => {
            const transactionDate = new Date(t.createdAt);
            const transactionTotal = typeof t.total_amount === 'number' ? t.total_amount : 0;
            
            // Total Sales
            totalSales += transactionTotal;

            // Today's Sales
            if (transactionDate >= today && transactionDate < tomorrow) {
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
            
            // Sales by Day for Chart (e.g., last 7 days)
             const dayKey = formatDate(transactionDate);
             salesByDay[dayKey] = (salesByDay[dayKey] || 0) + transactionTotal;
        });

        const totalCustomers = customerSet.size;
        const avgSpend = totalCustomers > 0 ? totalSales / totalCustomers : 0;

        setSummaryData({
            todaySales,
            totalSales,
            totalCustomers,
            avgSpend,
        });

        // Prepare Chart Data (e.g., last 7 days)
        const labels = [];
        const dataPoints = [];
        for (let i = 6; i >= 0; i--) { 
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dayKey = formatDate(date);
            labels.push(dayKey);
            dataPoints.push(salesByDay[dayKey] || 0);
        }
        setChartData({
            labels,
            datasets: [
                {
                    label: 'Daily Sales',
                    data: dataPoints,
                    borderColor: 'rgb(53, 162, 235)',
                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
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
        return <div className="flex h-screen w-full items-center justify-center"><p>Authenticating...</p></div>;
    }
    if (!token && !authLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><p>Please <a href="/login" className="text-blue-600 hover:underline">log in</a>.</p></div>;
    }
     if (authError) {
        return <div className="flex h-screen w-full items-center justify-center p-4"><p className="text-red-600">Auth Error: {authError}</p></div>;
     }
     if (error) {
          return <div className="flex h-screen w-full items-center justify-center p-4"><p className="text-red-600">Error loading dashboard: {error}</p></div>;
     }
     if (loadingData) {
         return (
             <div className="flex h-screen w-full font-[Inter] bg-white">
                <DashboardSidePanel />
                <div className="w-10/12 flex items-center justify-center">
                    <p>Loading Dashboard Data...</p>
                </div>
             </div>
          );
     }

    // Main Dashboard Render
    return (
        <div className="flex h-screen w-full font-[Inter] bg-gray-100">
            <DashboardSidePanel />
            <div className="w-10/12 overflow-auto">
                {/* Header */}
                <div className="w-full h-16 border-b-2 border-gray-200 flex shadow-lg bg-white sticky top-0 z-10">
                    <div className="w-9/12 flex justify-start items-center ml-10">
                        {/* Display logged-in user's name if available */}
                        <h1 className="text-lg font-bold">Hello {user?.name || 'User'}!</h1> 
                    </div>
                    {/* ... other header elements ... */}
                     <div className="w-1/12"></div>
                     <div className="w-1/12 flex justify-center items-center text-3xl"><IoNotifications /></div>
                     <div className="w-1/12 flex justify-center items-center">
                         <img 
                             src={user?.profilePic || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqf0Wx4wmsKfLYsiLdBx6H4D8bwQBurWhx5g&s"} // Placeholder or user profile pic
                             className="w-10 h-10 rounded-full object-cover"
                             alt="Profile"
                         />
                     </div>
                </div>
                
                {/* Main Content Area */}
                <div className="p-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 shadow-md rounded-lg border border-gray-200">
                            <h1 className="font-semibold text-sm text-gray-500">TODAY'S SALES</h1>
                            <h1 className="mt-2 font-extrabold text-3xl text-blue-600">{formatCurrency(summaryData.todaySales)}</h1>
                        </div>
                        <div className="bg-white p-4 shadow-md rounded-lg border border-gray-200">
                            <h1 className="font-semibold text-sm text-gray-500">TOTAL SALES</h1>
                            <h1 className="mt-2 font-extrabold text-3xl text-green-600">{formatCurrency(summaryData.totalSales)}</h1>
                        </div>
                        <div className="bg-white p-4 shadow-md rounded-lg border border-gray-200">
                            <h1 className="font-semibold text-sm text-gray-500">TOTAL CUSTOMERS</h1>
                            <h1 className="mt-2 font-extrabold text-3xl text-purple-600">{summaryData.totalCustomers}</h1>
                        </div>
                        <div className="bg-white p-4 shadow-md rounded-lg border border-gray-200">
                            <h1 className="font-semibold text-sm text-gray-500">AVG. SPEND</h1>
                            <h1 className="mt-2 font-extrabold text-3xl text-orange-600">{formatCurrency(summaryData.avgSpend)}</h1>
                        </div>
                    </div>
                    
                    {/* Sales Report & Trending Items */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="lg:col-span-2 bg-white p-4 shadow-md rounded-lg border border-gray-200 min-h-[350px]">
                            <h1 className="font-bold mb-4 text-gray-700">Sales Report (Last 7 Days)</h1>
                            {chartData.labels.length > 0 ? (
                                <Line options={{ responsive: true, maintainAspectRatio: false }} data={chartData} />
                            ) : (
                                <p className="text-gray-500 text-center mt-10">No sales data available for the chart.</p>
                            )}
                        </div>
                        <div className="bg-white p-4 shadow-md rounded-lg border border-gray-200 min-h-[350px]">
                            <h1 className="font-bold mb-4 text-gray-700">Trending Items</h1>
                            {trendingItems.length > 0 ? (
                                <ul className="space-y-2">
                                    {trendingItems.map((item) => (
                                        <li key={item.id} className="text-sm flex justify-between border-b pb-1">
                                            <span>{item.name}</span>
                                            <span className="font-medium">{item.count} sold</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-center mt-10">No trending items data available.</p>
                            )}
                        </div>
                    </div>
                    
                    {/* Recent Transactions Table */}
                    <div className="bg-white p-4 shadow-md rounded-lg border border-gray-200">
                        <h1 className="font-bold mb-4 text-gray-700">Recent Transactions</h1>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {topTransactions.length > 0 ? (
                                        topTransactions.map((t) => (
                                            <tr key={t._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{formatDate(new Date(t.createdAt))}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{t.customer_name || 'N/A'}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{formatCurrency(t.total_amount)}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm capitalize text-gray-700">{t.billing_mode || 'N/A'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-4 text-center text-sm text-gray-500">No recent transactions found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 