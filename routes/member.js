const express = require("express");
const router = express.Router();
const Member = require("../models/member");
const Community = require("../models/community");
const User = require("../models/user");
const Role = require("../models/role");

// Add a user as a member to a community
router.post("/", async (req, res) => {
  try {
    const { userId, communityId, roleId } = req.body;

    // Check if the user, community, and role exist
    const user = await User.findById(userId);
    const community = await Community.findById(communityId);
    const role = await Role.findById(roleId);

    if (!user || !community || !role) {
      return res.status(404).json({
        success: false,
        message: "User, community, or role not found",
      });
    }

    // Check if the user is already a member of the community
    const existingMember = await Member.findOne({
      user: userId,
      community: communityId,
    });
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of the community",
      });
    }

    // Create a new member
    const newMember = new Member({
      user: userId,
      community: communityId,
      role: roleId,
    });

    await newMember.save();

    res.status(201).json({
      success: true,
      message: "User added as a member to the community",
      data: newMember,
    });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Remove a member from a community
router.delete("/:id", async (req, res) => {
  try {
    const memberId = req.params.id;

    // Check if the member exists
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // Delete the member
    await Member.findByIdAndDelete(memberId);

    res.status(200).json({
      success: true,
      message: "Member removed from the community",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
