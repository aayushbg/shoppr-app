const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");

//@desc Get All Products for the logged-in admin
//@method GET /api/products/
//@access private
const getAllProducts = asyncHandler(async (req, res) => {
    // Get admin ID from validated token
    const adminId = req.admin?.id; 
    if (!adminId) {
        res.status(401);
        throw new Error("User not authorized");
    }

    // Fetch products belonging to this admin
    const products = await Product.find({ shop_id: adminId })
                            .sort({ createdAt: -1 }); // Optional: sort by creation date
    
    // Format response correctly
    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
});

//@desc Get Product By Id for the logged-in admin
//@method GET /api/products/:id
//@access private
const getProductByID = asyncHandler(async (req, res) => {
    const adminId = req.admin?.id;
    if (!adminId) {
        res.status(401);
        throw new Error("User not authorized");
    }
    
    const productId = req.params.id;
    // Simple validation for ObjectId format can be added if needed
    // if (!mongoose.Types.ObjectId.isValid(productId)) { ... }

    const product = await Product.findById(productId);
    
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    // Check ownership: Ensure product's shop_id matches the logged-in admin's ID
    if (product.shop_id.toString() !== adminId) {
        res.status(403); // Forbidden
        throw new Error("User not authorized to access this product");
    }

    // Format response correctly
    res.status(200).json({
        success: true,
        data: product
    });
});

//@desc Create New Product for the logged-in admin
//@method POST /api/products/
//@access private
const createProduct = asyncHandler(async (req, res) => {
    const adminId = req.admin?.id;
    if (!adminId) {
        res.status(401);
        throw new Error("User not authorized");
    }

    const { product_name, product_price, product_quantity /*, cloudinary_id */ } = req.body;
    
    // Validate required fields
    if (!product_name || product_price === undefined || product_quantity === undefined) {
        res.status(400);
        throw new Error("Product name, price, and quantity are mandatory");
    }
    // Add more specific validation (e.g., price/quantity non-negative)
     if (isNaN(parseFloat(product_price)) || parseFloat(product_price) < 0) {
         res.status(400);
         throw new Error('Valid non-negative price is required.');
     }
     if (isNaN(parseInt(product_quantity, 10)) || parseInt(product_quantity, 10) < 0) {
         res.status(400);
         throw new Error('Valid non-negative quantity is required.');
     }

    const productData = {
        shop_id: adminId, // Associate with logged-in admin
        product_name: product_name,
        product_price: parseFloat(product_price), // Ensure type is number
        product_quantity: parseInt(product_quantity, 10), // Ensure type is number
       // cloudinary_id: cloudinary_id || null // Handle optional field
    };

    const product = await Product.create(productData);
    
    // Format response correctly
    res.status(201).json({
        success: true,
        data: product
    });
});

//@desc Update a product
//@route PUT /api/products/:id
//@access private
const updateProduct = asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const adminId = req.admin.id; // From validateToken middleware

    const product = await Product.findById(productId);

    // Check if product exists
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    // Check if the product belongs to the logged-in admin
    if (product.shop_id.toString() !== adminId) {
        res.status(403); // Forbidden
        throw new Error("User not authorized to update this product");
    }

    // Fields allowed to be updated from the request body
    const { product_name, product_price, product_quantity } = req.body;

    // Basic validation for provided update fields
    if (product_price !== undefined && (isNaN(parseFloat(product_price)) || parseFloat(product_price) < 0)) {
        res.status(400);
        throw new Error('Invalid price provided for update.');
    }
    if (product_quantity !== undefined && (isNaN(parseInt(product_quantity, 10)) || parseInt(product_quantity, 10) < 0)) {
        res.status(400);
        throw new Error('Invalid quantity provided for update.');
    }

    // Prepare update object - only include fields that were actually sent in req.body
    const updateData = {};
    if (product_name !== undefined) updateData.product_name = product_name;
    if (product_price !== undefined) updateData.product_price = parseFloat(product_price);
    if (product_quantity !== undefined) updateData.product_quantity = parseInt(product_quantity, 10);

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
        res.status(400);
        throw new Error("No valid fields provided for update.");
    }

    // Perform the update
    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        updateData, 
        { 
            new: true, // Return the modified document
            runValidators: true // Run schema validators on update
        }
    );

    if (!updatedProduct) {
         // This shouldn't typically happen if the findById check passed, but handle just in case
         res.status(404); 
         throw new Error("Product found initially but failed to update.");
    }

    res.status(200).json({ 
        success: true, 
        message: "Product updated successfully",
        data: updatedProduct 
    });
});

//@desc Delete a product
//@route DELETE /api/products/:id
//@access private
const deleteProduct = asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const adminId = req.admin.id; // From validateToken middleware

    const product = await Product.findById(productId);

    // Check if product exists
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    // Check if the product belongs to the logged-in admin (VERIFY shop_id vs admin_id in your model)
    if (product.shop_id.toString() !== adminId) { 
        res.status(403); // Forbidden
        throw new Error("User not authorized to delete this product");
    }

    // Perform the deletion
    await Product.findByIdAndDelete(productId);

    // Optional: Find alternative methods if findByIdAndDelete is deprecated or causes issues
    // await product.deleteOne(); // Alternative if you already have the product document

    res.status(200).json({ 
        success: true, 
        message: "Product deleted successfully",
        data: { id: productId } // Send back ID of deleted product
    }); 
    // Or use status 204 (No Content) which doesn't require a body
    // res.status(204).send(); 
});

module.exports = {
    getAllProducts,
    getProductByID,
    createProduct,
    updateProduct,
    deleteProduct
};
