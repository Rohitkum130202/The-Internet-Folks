const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const snowflake = require("@theinternetfolks/snowflake");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB (replace 'your_database_name' with your actual database name)
mongoose
  .connect(process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Mount routes
const authRoutes = require("./routes/auth");
const roleRoutes = require("./routes/role");
const communityRoutes = require("./routes/community");
const memberRoutes = require("./routes/member");

app.use("/v1/auth", authRoutes);
app.use("/v1/role", roleRoutes);
app.use("/v1/community", communityRoutes);
app.use("/v1/member", memberRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
