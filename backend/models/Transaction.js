const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});

const extraChargeSchema = new mongoose.Schema({
    chargeTitle: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
});

const transactionSchema = new mongoose.Schema({
    transaction_id: {
        type: String,
        required: true,
        unique: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    customer_contact: {
        type: Number,
        required: true
    },
    customer_name: {
        type: String,
        required: true
    },
    cart_items: [cartItemSchema],
    extra_charges: [extraChargeSchema],
    billing_mode: {
        type: String,
        enum: ['online', 'cash', 'card'],
        required: true
    },
    total_amount: {
        type: Number,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate total amount before saving
transactionSchema.pre('save', async function(next) {
    try {
        let total = 0;
        
        // Sum up product prices
        for (const item of this.cart_items) {
            const product = await mongoose.model('Product').findById(item.product);
            if (!product) {
                throw new Error(`Product not found for ID: ${item.product}`);
            }
            total += product.product_price * item.quantity;
        }
        
        // Add extra charges
        for (const charge of this.extra_charges) {
            total += charge.amount;
        }
        
        this.total_amount = total;
        next();
    } catch (error) {
        next(error);
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 