// Backend/controller/Auth.controller.js
import User from "../models/User.model.js";
import jwt from "jsonwebtoken";

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Signup Controller
export const signup = async (req, res) => {
  try {
    const { username, email, password, company, phone } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username, email, and password",
      });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      company: company || null,
      phone: phone || null,
    });

    // Generate token
    const token = generateToken(user._id);

    // Return response
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({
      success: false,
      message: "Error creating user",
      error: err.message,
    });
  }
};

// Signin Controller
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user by email and select password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is deactivated",
      });
    }

    // Compare password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signin error:", err);
    return res.status(500).json({
      success: false,
      message: "Error logging in",
      error: err.message,
    });
  }
};

// Get Current User
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("Get current user error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: err.message,
    });
  }
};

// Update User Profile
export const updateProfile = async (req, res) => {
  try {
    const { username, company, phone } = req.body;
    const userId = req.userId;

    const updateData = {};
    if (username) updateData.username = username;
    if (company) updateData.company = company;
    if (phone) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: err.message,
    });
  }
};

export const getTeam = async (req, res) => {
  const user = await User.findById(req.userId).select("username email role teamMembers");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  return res.status(200).json({
    success: true,
    data: {
      owner: { name: user.username, email: user.email, role: user.role, status: "active" },
      members: user.teamMembers || [],
    },
  });
};

export const inviteTeamMember = async (req, res) => {
  try {
    const { name, email, role = "viewer" } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, error: "Name and email are required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, error: "Enter a valid email address" });
    if (!["admin", "agent", "viewer"].includes(role)) return res.status(400).json({ success: false, error: "Invalid team role" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    if (user.email.toLowerCase() === email.toLowerCase() || user.teamMembers.some((member) => member.email === email.toLowerCase())) {
      return res.status(409).json({ success: false, error: "This email is already in your team" });
    }

    user.teamMembers.push({ name, email, role, status: "pending" });
    await user.save();
    return res.status(201).json({ success: true, data: user.teamMembers[user.teamMembers.length - 1], message: "Team invitation added" });
  } catch (error) {
    console.error("Invite team member error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const removeTeamMember = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ success: false, error: "User not found" });
  const member = user.teamMembers.id(req.params.memberId);
  if (!member) return res.status(404).json({ success: false, error: "Team member not found" });
  member.deleteOne();
  await user.save();
  return res.status(200).json({ success: true, message: "Team member removed" });
};