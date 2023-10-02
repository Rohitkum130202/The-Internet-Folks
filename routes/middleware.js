const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

// Middleware to verify the access token
const verifyAccessToken = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  console.log(token);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token is missing",
    });
  }

  // Verify the access token
  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
        err,
      });
    }

    // Store the user ID from the decoded token in the request
    req.userId = decoded.userId;
    next();
  });
};

module.exports = { verifyAccessToken };
