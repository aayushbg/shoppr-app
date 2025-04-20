const mongoose = require("mongoose");

const adminSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
        },
        city: {
            type: String,
            required: [true, "City is required"],
        },
        branch: {
            type: String,
            required: [true, "Branch is required"],
        },
        GSTIN: {
            type: String,
            required: [true, "GSTIN is required"],
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Admin", adminSchema);