const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    maxlength: 64,
  },
  email: {
    type: String,
    maxlength: 128,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    maxlength: 64,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
