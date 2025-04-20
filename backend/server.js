const express = require("express");
const dotenv = require("dotenv").config();
const connectDB = require("./config/dbConnection");
const errorHandler = require("./middlewares/errorHandler");
const validateToken = require("./middlewares/validateTokenHandler");
const cors = require("cors");

const app = express();

connectDB();

const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/products", validateToken, require("./routes/productRoutes"));
app.use("/api/transactions", validateToken, require("./routes/transactionRoutes"));

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server is Running on Port ${port}`);
});