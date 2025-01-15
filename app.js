const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const errorHandler = require("./middlewares/errorHandler");
const connectDB = require("./config/db");

// Route files
const categoryRoute = require("./routes/categoryRoute");
const authRoute = require("./routes/authRoute");
const postRoute = require("./routes/postRoute");

// load env variables
dotenv.config({ path: "./config/config.env" });

// connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Mount routers
app.use("/api/v1/categories", categoryRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/posts", postRoute);

// global management middleware errors
app.use(errorHandler);

module.exports = app;
