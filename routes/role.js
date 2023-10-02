const express = require("express");
const router = express.Router();
const Role = require("../models/role");

// Create a new role
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    // Check if the role name is already taken
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Role name is already in use",
      });
    }

    // Create a new role
    const newRole = new Role({
      name,
    });

    await newRole.save();

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: newRole,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all roles with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page (default: 1)
    const limit = parseInt(req.query.limit) || 10; // Documents per page (default: 10)

    // Calculate skip value to paginate results
    const skip = (page - 1) * limit;

    // Query to retrieve roles with pagination
    const query = Role.find({});
    const roles = await query.skip(skip).limit(limit);
    const totalRoles = await Role.countDocuments();

    const totalPages = Math.ceil(totalRoles / limit);

    res.status(200).json({
      success: true,
      message: "All roles fetched with pagination",
      data: roles,
      meta: {
        total: totalRoles,
        pages: totalPages,
        page: page,
      },
    });
  } catch (error) {
    console.error("Error fetching roles with pagination:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
