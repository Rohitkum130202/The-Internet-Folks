const express = require("express");
const router = express.Router();
const Community = require("../models/community");
const User = require("../models/user");
const Member = require("../models/member");
const { verifyAccessToken } = require("./middleware");
const jwt = require("jsonwebtoken");
const Role = require("../models/role");
require("dotenv").config();

// Create a new community
router.post("/", async (req, res) => {
  try {
    const { name, slug, ownerId } = req.body;

    // Check if the owner (user) exists
    const owner = await User.findById(ownerId);
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    // Create a new community
    const newCommunity = new Community({
      name,
      slug,
      owner: ownerId,
    });

    // Save the community to the database
    await newCommunity.save();

    // Add the owner as a member with the "owner" role
    const ownerRole = await Role.findOne({ name: "owner" }); // Assuming "owner" is the role name
    if (ownerRole) {
      const newMember = new Member({
        user: ownerId,
        community: newCommunity._id,
        role: ownerRole._id,
      });

      await newMember.save();
    } else {
      const owner = new Role({ name: "owner" });
      await owner.save();
      const newMember = new Member({
        user: ownerId,
        community: newCommunity._id,
        role: ownerRole._id,
      });

      await newMember.save();
    }

    res.status(201).json({
      success: true,
      message: "Community created successfully",
      data: newCommunity,
    });
  } catch (error) {
    console.error("Error creating community:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all communities with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page (default: 1)
    const limit = parseInt(req.query.limit) || 10; // Documents per page (default: 10)

    // Calculate skip value to paginate results
    const skip = (page - 1) * limit;

    // Query to retrieve communities with pagination
    const query = Community.find({});
    query.select("-__v"); // Exclude the __v field
    query.populate("owner", "id name"); // Populate the owner with only id and name
    const communities = await query.skip(skip).limit(limit);
    const totalCommunities = await Community.countDocuments();

    const totalPages = Math.ceil(totalCommunities / limit);

    res.status(200).json({
      success: true,
      message: "All communities fetched with pagination",
      data: communities,
      meta: {
        total: totalCommunities,
        pages: totalPages,
        page: page,
      },
    });
  } catch (error) {
    console.error("Error fetching communities with pagination:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Getting owned community with pagination
router.get("/me/owner", verifyAccessToken, async (req, res) => {
  try {
    const accessToken = req.headers.authorization.split(" ")[1]; // Assuming the token is provided in the "Authorization" header
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
    const page = parseInt(req.query.page) || 1; // Current page (default: 1)
    const limit = parseInt(req.query.limit) || 10; // Documents per page (default: 10)

    // Calculate skip value to paginate results
    const skip = (page - 1) * limit;

    // Query to retrieve owned communities with pagination
    const query = Community.find({ owner: userId });
    query.select("-__v"); // Exclude the __v field
    query.populate("owner", "id name"); // Populate the owner with only id and name
    const ownedCommunities = await query.skip(skip).limit(limit);
    const totalOwnedCommunities = await Community.countDocuments({
      owner: userId,
    });

    const totalPages = Math.ceil(totalOwnedCommunities / limit);

    res.status(200).json({
      success: true,
      message: "Owned communities fetched with pagination",
      data: ownedCommunities,
      meta: {
        total: totalOwnedCommunities,
        pages: totalPages,
        page: page,
      },
    });
  } catch (error) {
    console.error("Error fetching owned communities with pagination:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get communities where a user is a member with pagination
router.get("/me/member", async (req, res) => {
  try {
    const accessToken = req.headers.authorization.split(" ")[1]; // Assuming the token is provided in the "Authorization" header
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
    const page = parseInt(req.query.page) || 1; // Current page (default: 1)
    const limit = parseInt(req.query.limit) || 10; // Documents per page (default: 10)

    // Calculate skip value to paginate results
    const skip = (page - 1) * limit;

    // Find all community IDs where the user is a member
    const memberCommunityIds = await Member.find({ user: userId }).distinct(
      "community"
    );

    // Query to retrieve member communities with pagination
    const query = Community.find({ _id: { $in: memberCommunityIds } });
    query.select("-__v"); // Exclude the __v field
    query.populate("owner", "id name"); // Populate the owner with only id and name
    const memberCommunities = await query.skip(skip).limit(limit);

    res.status(200).json({
      success: true,
      message: "Member communities fetched with pagination",
      data: memberCommunities,
    });
  } catch (error) {
    console.error("Error fetching member communities with pagination:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all members of a community with pagination
router.get("/:id/members", async (req, res) => {
  try {
    const Id = req.params.id;
    const page = parseInt(req.query.page) || 1; // Current page (default: 1)
    const limit = parseInt(req.query.limit) || 10; // Documents per page (default: 10)

    // Calculate skip value to paginate results
    const skip = (page - 1) * limit;

    // Query to retrieve members of the specified community with pagination
    const query = Member.find({ community: Id });
    console.log(query);
    query.select("-__v"); // Exclude the __v field
    query.populate("user", "id name"); // Populate the user with only id and name
    const members = await query.skip(skip).limit(limit);
    const totalMembers = await Member.countDocuments({ community: Id });

    const totalPages = Math.ceil(totalMembers / limit);

    res.status(200).json({
      success: true,
      message: "All members of the community fetched with pagination",
      data: members,
      meta: {
        total: totalMembers,
        pages: totalPages,
        page: page,
      },
    });
  } catch (error) {
    console.error(
      "Error fetching members of the community with pagination:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
