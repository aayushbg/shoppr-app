const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const asyncHandler = require("express-async-handler"); // Import asyncHandler
const { v4: uuidv4 } = require('uuid'); // Import uuid

// Create a new transaction
// Added asyncHandler for consistent error handling
exports.createTransaction = asyncHandler(async (req, res) => {
    // Assuming the middleware adds req.admin.id for the logged-in admin
    const adminId = req.admin?.id;
    if (!adminId) {
        res.status(401);
        throw new Error("Not authorized to create transaction");
    }

    const { 
        customer_name, 
        customer_contact, 
        cart_items, 
        extra_charges, 
        billing_mode 
    } = req.body;

    // Basic validation for required fields sent from frontend
    if (!customer_name || !customer_contact || !cart_items || !billing_mode) {
        res.status(400);
        throw new Error("Missing required fields for transaction");
    }
    if (!Array.isArray(cart_items) || cart_items.length === 0) {
        res.status(400);
        throw new Error("Cart cannot be empty");
    }

    // Map frontend extra_charges structure to backend schema structure
    const formattedExtraCharges = (extra_charges || []).map(charge => ({
        chargeTitle: charge.title, // Map title to chargeTitle
        amount: parseFloat(charge.amount) // Ensure amount is a number
    }));

    // Generate a unique transaction ID
    const transaction_id = `TXN-${Date.now()}-${uuidv4().substring(0, 6)}`;

    // Construct data for the model
    const transactionData = {
        transaction_id: transaction_id,
        admin: adminId,
        customer_name: customer_name,
        customer_contact: Number(customer_contact), // Ensure contact is a number
        cart_items: cart_items, // Assuming frontend sends correct {product, quantity}
        extra_charges: formattedExtraCharges, // Use the mapped charges
        billing_mode: billing_mode,
        total_amount: 0 // Add placeholder value to pass initial validation
    };

    const transaction = new Transaction(transactionData);
    await transaction.save(); // This will trigger the pre-save hook
    
    // --- Start: Update product stock --- 
    try {
        for (const item of transaction.cart_items) {
            const productId = item.product; // Get product ID from cart item
            const quantitySold = item.quantity;
            
            // Find the product and decrement its quantity
            // Using findOneAndUpdate is atomic for the decrement operation
            const updatedProduct = await Product.findByIdAndUpdate(
                productId, 
                { $inc: { product_quantity: -quantitySold } }, // Decrement quantity
                { new: true } // Option to return the updated document (optional here)
            );

            if (!updatedProduct) {
                // Log an error if a product couldn't be found/updated (though it should exist if it was in the cart)
                console.error(`Failed to update stock for product ID: ${productId}. Product not found.`);
                // Decide on error handling: Continue? Throw an error that might be caught later?
                // For now, we log and continue, as the transaction is already saved.
            } else if (updatedProduct.product_quantity < 0) {
                // Optional: Log a warning if stock becomes negative (indicates overselling)
                console.warn(`Stock for product ID: ${productId} went negative after transaction ${transaction_id}.`);
                // You might want to reset it to 0 or handle this case more strictly
                // await Product.findByIdAndUpdate(productId, { product_quantity: 0 });
            }
        }
    } catch (stockUpdateError) {
        // Log error if stock update fails for any reason
        console.error(`Error updating product stock after transaction ${transaction_id}:`, stockUpdateError);
        // Note: The transaction is already saved at this point.
        // Depending on requirements, you might need a more robust compensation mechanism
        // (e.g., marking the transaction for review, using database transactions if supported).
    }
    // --- End: Update product stock ---

    // Fetch the saved transaction again to get populated fields if needed
    // Note: The pre-save hook calculates total_amount, but it might not be reflected 
    // in the initial 'transaction' object returned by new Transaction() or even transaction.save() directly
    // depending on Mongoose version. Fetching again ensures we have the calculated total.
    const savedTransaction = await Transaction.findById(transaction._id)
                                        .populate('admin', 'name email')
                                        .populate('cart_items.product', 'product_name product_price');
    
    res.status(201).json({
        success: true,
        data: savedTransaction // Send the saved transaction with populated fields
    });
});

// Get all transactions for the LOGGED-IN admin
// Added asyncHandler and uses req.admin.id from middleware
exports.getAdminTransactions = asyncHandler(async (req, res) => {
    const adminId = req.admin?.id; // Get admin ID from middleware
    if (!adminId) {
        res.status(401);
        throw new Error("User not authorized");
    }

    // Find transactions associated with the logged-in admin
    const transactions = await Transaction.find({ admin: adminId })
        // .populate('admin', 'name email') // Usually not needed if fetching for self
        .populate('cart_items.product', 'product_name product_price') // Populate product details
        .sort({ createdAt: -1 }); // Sort by creation date, newest first
        
    res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions
    });
});

// Get a single transaction by ID
// Added asyncHandler and ensures the transaction belongs to the logged-in admin
exports.getTransaction = asyncHandler(async (req, res) => {
    const adminId = req.admin?.id;
    if (!adminId) {
        res.status(401);
        throw new Error("User not authorized");
    }

    const transaction = await Transaction.findById(req.params.id)
        // .populate('admin', 'name email')
        .populate('cart_items.product', 'product_name product_price');
    
    if (!transaction) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    // Check if the transaction belongs to the requesting admin
    if (transaction.admin.toString() !== adminId) {
         res.status(403); // Forbidden
         throw new Error("User not authorized to view this transaction");
    }

    res.status(200).json({
        success: true,
        data: transaction
    });
});

// Update a transaction
// Added asyncHandler and ownership check
exports.updateTransaction = asyncHandler(async (req, res) => {
     const adminId = req.admin?.id;
    if (!adminId) {
        res.status(401);
        throw new Error("User not authorized");
    }

    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    // Check ownership
    if (transaction.admin.toString() !== adminId) {
        res.status(403);
        throw new Error("User not authorized to update this transaction");
    }

    // Prevent changing the admin ID during update
    if (req.body.admin && req.body.admin !== adminId) {
        res.status(400);
        throw new Error("Cannot change the admin associated with the transaction");
    }

    transaction = await Transaction.findByIdAndUpdate(
        req.params.id,
        req.body, // Apply updates from request body
        { new: true, runValidators: true }
    )
    // .populate('admin', 'name email')
    .populate('cart_items.product', 'product_name product_price');

    res.status(200).json({
        success: true,
        data: transaction
    });
});

// Delete a transaction
// Added asyncHandler and ownership check
exports.deleteTransaction = asyncHandler(async (req, res) => {
    const adminId = req.admin?.id;
    if (!adminId) {
        res.status(401);
        throw new Error("User not authorized");
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    // Check ownership
    if (transaction.admin.toString() !== adminId) {
         res.status(403);
         throw new Error("User not authorized to delete this transaction");
    }

    await Transaction.findByIdAndDelete(req.params.id); // Use findByIdAndDelete

    res.status(200).json({
        success: true,
        data: {} // Indicate successful deletion
    });
});

// Get transactions by date range for the logged-in admin
// Added asyncHandler and uses req.admin.id
exports.getTransactionsByDateRange = asyncHandler(async (req, res) => {
    const adminId = req.admin?.id;
    if (!adminId) {
        res.status(401);
        throw new Error("User not authorized");
    }
    
    const { startDate, endDate } = req.query; // Get dates from query params
    
    if (!startDate || !endDate) {
        res.status(400);
        throw new Error('Start date and end date are required query parameters');
    }

    // Basic date validation can be added here

    const transactions = await Transaction.find({
        admin: adminId, // Filter by logged-in admin
        createdAt: { // Ensure you use the correct date field (createdAt or custom)
            $gte: new Date(startDate), 
            $lte: new Date(endDate) 
        }
    })
    // .populate('admin', 'name email')
    .populate('cart_items.product', 'product_name product_price')
    .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions
    });
}); 