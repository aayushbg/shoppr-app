// product: {
//     product_id: String,
//     shop_id: shop.id,
//     product_name: String,
//     product_price: String,
//     product_quantity: Number,
// }

const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
    {
        shop_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Admin"
        },
        product_name: {
            type: String,
            required: true,
        },
        product_price: {
            type: Number,
            required: true,
        },
        product_quantity: {
            type: Number,
            required: true,
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Product", productSchema);