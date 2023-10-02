const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { verifyAccessToken } = require("./middleware.js");
require("dotenv").config();

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use",
      });
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registration successful",
      data: newUser,
    });
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Signin route
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. User not found.",
      });
    }

    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. Incorrect password.",
      });
    }

    // Create and sign a JSON Web Token (JWT) for authentication
    const token = jwt.sign({ userId: user._id }, process.env.SECRET, {
      expiresIn: "1h", // Token expiration time
    });

    res.status(200).json({
      success: true,
      message: "Authentication successful",
      token: token,
    });
  } catch (error) {
    console.error("Error in signin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get details of the currently signed-in user
router.get("/me", verifyAccessToken, async (req, res) => {
  try {
    // Extract the access token from the request headers
    const accessToken = req.headers.authorization.split(" ")[1]; // Assuming the token is provided in the "Authorization" header
    console.log(accessToken);
    // Verify and decode the access token to get the user's ID
    const decodedToken = jwt.verify(accessToken, process.env.SECRET); // Replace "YOUR_SECRET_KEY" with your actual secret key

    if (!decodedToken.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user not found",
      });
    }

    // Use the user's ID to fetch user details from the database
    const userId = decodedToken.userId;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        // Add other user details here as needed
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
