const router = require("express").Router();
const {
    getAllProducts,
    getProductByID,
    createProduct,
    updateProduct,
    deleteProduct // Import deleteProduct
} = require("../controllers/productControllers");
const validateToken = require('../middlewares/validateTokenHandler'); // Import middleware

// Apply token validation middleware to all product routes
router.use(validateToken);

// --- Routes defined AFTER middleware --- 

// GET /api/products/ (Get all products for the logged-in admin)
router.get("/", getAllProducts);

// POST /api/products/ (Create a new product for the logged-in admin)
router.post("/", createProduct);

// GET /api/products/:id (Get a specific product by ID, ensuring ownership)
router.get("/:id", getProductByID);

// PUT /api/products/:id (Optional: Add route for updating)
router.put("/:id", updateProduct);

// DELETE /api/products/:id (Optional: Add route for deleting)
router.delete("/:id", deleteProduct);

module.exports = router;