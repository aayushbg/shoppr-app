const express = require('express');
const router = express.Router();
const {
    createTransaction,
    getAdminTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByDateRange
} = require('../controllers/transactionController');
const validateToken = require('../middlewares/validateTokenHandler');

// Apply token validation middleware to all routes in this file
router.use(validateToken);

// Create a new transaction
router.post('/', createTransaction);

// Get all transactions for the currently logged-in admin
router.get('/', getAdminTransactions);

// Get transactions by date range
router.get('/date-range', getTransactionsByDateRange);

// Get a single transaction
router.get('/:id', getTransaction);

// Update a transaction
router.put('/:id', updateTransaction);

// Delete a transaction
router.delete('/:id', deleteTransaction);

module.exports = router; 