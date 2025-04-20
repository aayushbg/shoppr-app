import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardSidePanel from '../components/DashboardSidePanel';
import { FaSearch, FaPlus, FaEdit, FaTrashAlt, FaTimes } from 'react-icons/fa'; // Import necessary icons

// Custom Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FaTimes />
                    </button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Custom Notification Component
const Notification = ({ message, type, onClose }) => {
    if (!message) return null;

    const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700';

    return (
        <div className={`border px-4 py-3 rounded relative mb-4 ${bgColor}`} role="alert">
            <span className="block sm:inline">{message}</span>
            <button onClick={onClose} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <FaTimes className="h-4 w-4"/>
            </button>
        </div>
    );
};

const Inventory = () => {
    const { user, token, loading: authLoading, authError, logout } = useAuth();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null); // null for add, product object for edit
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingData, setLoadingData] = useState(true); // Specific loading state for inventory data
    const [submitError, setSubmitError] = useState(''); // Error specifically for the modal form
    const [notification, setNotification] = useState({ message: '', type: '' }); // { message: string, type: 'success' | 'error' }

    const initialFormData = {
        product_name: '',
        product_price: '',
        product_quantity: '',
        // cloudinary_id: '' // Optional: Add if needed
    };
    const [formData, setFormData] = useState(initialFormData);

    // Fetch products only when authenticated and token is available
    useEffect(() => {
        // Don't fetch if auth context is loading or if there's no token
        if (!authLoading && token) {
            fetchProducts();
        } else if (!authLoading && !token) {
             // Handle case where user is definitely logged out
             setLoadingData(false); 
             setProducts([]);
             // Optionally redirect or show message
        }
        // If authLoading is true, wait for it to finish
    }, [authLoading, token]); // Depend on authLoading and token

    // Filter products based on search term
    useEffect(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const filtered = products.filter(product =>
            product.product_name.toLowerCase().includes(lowerCaseSearchTerm)
        );
        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    const fetchProducts = async () => {
        setLoadingData(true);
        setNotification({ message: '', type: '' }); 
        if (!token) { // Double check token just before fetch
             setNotification({ message: 'Cannot fetch data: Not authenticated.', type: 'error' });
             setLoadingData(false);
             return;
        }
        try {
            // Use environment variable for base URL
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/products`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Use token from context
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Token might be invalid/expired, trigger logout from context
                    logout();
                    setNotification({ message: 'Session expired. Please log in again.', type: 'error' });
                } else {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch inventory' }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                 setLoadingData(false);
                 return; // Exit if token was invalid or other error
            }

            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                setProducts(data.data);
            } else {
                console.error('Invalid inventory data format:', data);
                setProducts([]);
                throw new Error('Received invalid inventory data from server.');
            }
        } catch (err) {
            console.error('Error fetching inventory:', err);
            // Avoid setting notification if it was handled by logout() already
            if (!notification.message) { 
                 setNotification({ message: `Error fetching inventory: ${err.message}`, type: 'error' });
            }
            setProducts([]);
        } finally {
            setLoadingData(false);
        }
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    // --- Modal Handling ---
    const handleOpenModal = (product = null) => {
        setSubmitError(''); // Clear previous form errors
        if (product) {
            setSelectedProduct(product); // Editing existing product
            setFormData({
                product_name: product.product_name || '',
                product_price: product.product_price || '',
                product_quantity: product.product_quantity || ''
                // cloudinary_id: product.cloudinary_id || '' 
            });
        } else {
            setSelectedProduct(null); // Adding new product
            setFormData(initialFormData);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
        setFormData(initialFormData);
        setSubmitError('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(''); // Clear previous errors
        setNotification({ message: '', type: '' });
        
        if (!token) { // Check token before submitting
            setSubmitError('Authentication error. Please log in again.');
            return;
        }

        // Basic validation
        if (!formData.product_name || !formData.product_price || !formData.product_quantity) {
            setSubmitError('Please fill in all required fields (Name, Price, Quantity).');
            return;
        }
        if (isNaN(parseFloat(formData.product_price)) || parseFloat(formData.product_price) < 0) {
             setSubmitError('Please enter a valid non-negative price.');
            return;
        }
        if (isNaN(parseInt(formData.product_quantity, 10)) || parseInt(formData.product_quantity, 10) < 0) {
             setSubmitError('Please enter a valid non-negative quantity.');
            return;
        }

        const method = selectedProduct ? 'PUT' : 'POST';
        // Use environment variable for base URL
        const url = selectedProduct
            ? `${process.env.REACT_APP_API_BASE_URL}/api/products/${selectedProduct._id}`
            : `${process.env.REACT_APP_API_BASE_URL}/api/products`;
        
        const productData = {
            ...formData,
            // Ensure price and quantity are numbers
            product_price: parseFloat(formData.product_price),
            product_quantity: parseInt(formData.product_quantity, 10),
             // Add shop_id if required by your backend API for creation
            // shop_id: user?._id, 
        };
        // Remove cloudinary_id if it's empty and optional
        // if (!productData.cloudinary_id) delete productData.cloudinary_id;

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Use token from context
                },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                 if (response.status === 401 || response.status === 403) {
                     logout(); // Logout on auth error
                     setSubmitError('Session expired. Please log in again.');
                 } else {
                     const errorData = await response.json().catch(() => ({ message: `Failed to ${selectedProduct ? 'update' : 'add'} product` }));
                     throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                 }
                  return; // Stop processing on error
            }

            // Success
            fetchProducts(); // Refresh the list
            handleCloseModal();
            setNotification({
                message: `Product ${selectedProduct ? 'updated' : 'added'} successfully!`,
                type: 'success'
            });

        } catch (err) {
            console.error(`Error ${selectedProduct ? 'updating' : 'adding'} product:`, err);
             // Avoid setting submitError if logout already handled it
             if (!submitError) { 
                  setSubmitError(`Error: ${err.message}`); 
             }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            setNotification({ message: '', type: '' });
            if (!token) { // Check token
                 setNotification({ message: 'Authentication error.', type: 'error' });
                 return;
            }
            try {
                // Use environment variable for base URL
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/products/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}` // Use token from context
                    }
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        logout();
                        setNotification({ message: 'Session expired. Please log in again.', type: 'error' });
                    } else {
                        const errorData = await response.json().catch(() => ({ message: 'Failed to delete product' }));
                        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                    }
                    return; // Stop on error
                }
                
                // Success
                fetchProducts(); // Refresh list
                setNotification({ message: 'Product deleted successfully!', type: 'success' });

            } catch (err) {
                console.error('Error deleting product:', err);
                 // Avoid setting notification if logout handled it
                 if (!notification.message) { 
                    setNotification({ message: `Error deleting product: ${err.message}`, type: 'error' });
                 }
            }
        }
    };
    
    const formatCurrency = (amount) => {
        if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
        return <span className="dark:text-gray-300">{`₹${amount.toFixed(2)}`}</span>;
    };

    const formatQuantity = (quantity) => {
        const num = parseInt(quantity, 10);
        if (isNaN(num)) return 'N/A';
        const colorClass = num > 10 ? 'text-green-600 dark:text-green-400' : num > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400';
        return <span className={colorClass}>{num}</span>;
    };

    // --- Render Logic --- 
    if (authLoading) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
                 <p className="text-gray-700 dark:text-gray-300">Authenticating...</p> 
             </div>
        );
    }
    
    if (!token && !authLoading) {
         return (
             <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
                 <p className="text-gray-700 dark:text-gray-300">Please <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">log in</a> to access this page.</p>
             </div>
          );
    }
    
     if (authError) {
         return (
             <div className="flex h-screen w-full items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
                 <p className="text-red-600 dark:text-red-400">Authentication Error: {authError}. Please try logging in again.</p>
             </div>
          );
     }

    // Main component render when authenticated
    return (
        <div className="flex h-screen w-full font-[Inter] bg-gray-100 dark:bg-gray-900">
            <DashboardSidePanel />
            <div className="flex-grow overflow-auto p-4 sm:p-6 lg:w-[calc(100%-16rem)] text-gray-800 dark:text-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Inventory Management</h1>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        </div>
                        <button 
                            onClick={() => handleOpenModal()} 
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-md shadow-sm text-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                        >
                            <FaPlus /> Add Product
                        </button>
                    </div>
                </div>

                <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-dark-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {loadingData ? (
                        <p className="p-6 text-center text-gray-500 dark:text-gray-400">Loading inventory...</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                                        <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                                    {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                                        <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-800 dark:text-gray-100">{product.product_name}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-right text-gray-600 dark:text-gray-300">{formatCurrency(product.product_price)}</td>
                                            <td className={`px-3 py-2 whitespace-nowrap text-right font-medium`}>
                                                {formatQuantity(product.product_quantity)}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-center space-x-2">
                                                <button 
                                                    onClick={() => handleOpenModal(product)} 
                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors"
                                                    title="Edit Product"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(product._id)} 
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-500 p-1 rounded hover:bg-red-100 dark:hover:bg-gray-700 transition-colors"
                                                    title="Delete Product"
                                                >
                                                    <FaTrashAlt />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" className="text-center py-4 text-gray-500 dark:text-gray-400">No products found matching your search.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedProduct ? 'Edit Product' : 'Add New Product'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {submitError && <p className="text-sm text-red-600">{submitError}</p>}
                    <div>
                        <label htmlFor="product_name" className="block text-sm font-medium text-gray-700">Product Name</label>
                        <input
                            type="text"
                            id="product_name"
                            name="product_name"
                            value={formData.product_name}
                            onChange={handleInputChange}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="product_price" className="block text-sm font-medium text-gray-700">Price (₹)</label>
                        <input
                            type="number"
                            id="product_price"
                            name="product_price"
                            value={formData.product_price}
                            onChange={handleInputChange}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            required
                            step="0.01"
                            min="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="product_quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input
                            type="number"
                            id="product_quantity"
                            name="product_quantity"
                            value={formData.product_quantity}
                            onChange={handleInputChange}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            required
                            min="0"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium">
                            {selectedProduct ? 'Update Product' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Inventory; 