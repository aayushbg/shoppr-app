const express = require("express");
const router = express.Router();
const {
    registerAdmin,
    loginAdmin,
    getAdmin,
    updateAdminProfile
} = require("../controllers/adminControllers");
const validateToken = require("../middlewares/validateTokenHandler");

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/profile", validateToken, getAdmin);
router.put("/profile", validateToken, updateAdminProfile);

module.exports = router;