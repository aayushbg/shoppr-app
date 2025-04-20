const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const dotenv = require("dotenv").config();

//@desc Register New Admin
//@method POST /api/admin/register
//@access public
const registerAdmin = asyncHandler(async (req, res) => {
    const { name, email, password, phone, city, branch, GSTIN } = req.body;
    if (!name || !email || !password || !phone || !city || !branch || !GSTIN) {
        res.status(400);
        throw new Error("All fields (name, email, password, phone, city, branch, GSTIN) are mandatory");
    }
    const userExists = await Admin.findOne({ email: email });
    if (userExists) {
        res.status(400);
        throw new Error("Admin already exists with this email");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await Admin.create({
        name,
        email,
        password: hashedPassword,
        phone,
        city,
        branch,
        GSTIN
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            city: user.city,
            branch: user.branch,
            GSTIN: user.GSTIN
        });
    } else {
        res.status(400);
        throw new Error("Invalid user data provided");
    }
});

//@desc Login Existing Admin
//@method POST /api/admin/login
//@access public
const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400);
        throw new Error("Email and password are required");
    }
    const user = await Admin.findOne({ email: email });

    if (user && (await bcrypt.compare(password, user.password))) {
        const accessToken = jwt.sign(
            {
                admin: {
                    id: user._id,
                    email: user.email
                }
            }, 
            process.env.ACCESS_KEY_SECRET, 
            { expiresIn: "45m" }
        );

        res.status(200).json({
            success: true,
            accessToken: accessToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                city: user.city,
                branch: user.branch,
                GSTIN: user.GSTIN
            }
        });
    } else {
        res.status(401);
        throw new Error("Invalid Email or Password");
    }
});

//@desc Get current Admin profile
//@method GET /api/admin/profile
//@access private (Requires token validation middleware before this controller)
const getAdmin = asyncHandler(async (req, res) => {
    const userId = req.admin?.id;
    if (!userId) {
        res.status(401);
        throw new Error("User not authorized or token invalid");
    }

    const user = await Admin.findById(userId).select("-password");

    if (user) {
        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                city: user.city,
                branch: user.branch,
                GSTIN: user.GSTIN
            }
        });
    } else {
        res.status(404);
        throw new Error("Admin profile not found");
    }
});

//@desc Update current Admin profile
//@method PUT /api/admin/profile
//@access private
const updateAdminProfile = asyncHandler(async (req, res) => {
    const adminId = req.admin?.id;
    if (!adminId) {
        res.status(401);
        throw new Error("User not authorized or token invalid");
    }

    const admin = await Admin.findById(adminId);

    if (!admin) {
        res.status(404);
        throw new Error("Admin profile not found");
    }

    // Fields allowed to be updated (exclude email and password)
    const { name, phone, city, branch, GSTIN } = req.body;

    // Basic validation: Check if at least one field is provided for update
    if (!name && !phone && !city && !branch && !GSTIN) {
         res.status(400);
         throw new Error("No update data provided.");
    }

    // Update fields if they are provided in the request body
    if (name) admin.name = name;
    if (phone) admin.phone = phone;
    if (city) admin.city = city;
    if (branch) admin.branch = branch;
    if (GSTIN) admin.GSTIN = GSTIN;

    // Log the admin object just before saving
    console.log('Admin object state before save:', admin);

    try {
        const updatedAdmin = await admin.save();
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                _id: updatedAdmin._id,
                name: updatedAdmin.name,
                email: updatedAdmin.email, // Keep email in response
                phone: updatedAdmin.phone,
                city: updatedAdmin.city,
                branch: updatedAdmin.branch,
                GSTIN: updatedAdmin.GSTIN
            }
        });
    } catch (error) {
        res.status(500); // Or 400 depending on the error type (e.g., validation)
        console.error("Error saving updated admin profile:", error);
        throw new Error("Failed to update profile. " + error.message);
    }
});

module.exports = {
    registerAdmin,
    loginAdmin,
    getAdmin,
    updateAdminProfile
};