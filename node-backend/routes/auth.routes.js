import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName, bio } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      fullName,
      bio,
    });

    if (user) {
      console.log("Setting session for new user:", user._id);
      req.session.userId = user._id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Error saving session" });
        }
        console.log("Session saved successfully for new user");
        res.status(201).json({
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          bio: user.bio,
        });
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    console.log("Login attempt for:", req.body.email);
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Invalid password for:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("Setting session for user:", user._id);
    console.log("Current session:", req.session);
    req.session.userId = user._id;

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: "Error saving session" });
      }
      console.log("Session saved successfully. Session details:", {
        id: req.session.id,
        userId: req.session.userId,
        cookie: req.session.cookie,
      });
      res.json({
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        bio: user.bio,
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Check Authentication Status
router.get("/check", (req, res) => {
  console.log("Checking auth status. Session details:", {
    id: req.session?.id,
    userId: req.session?.userId,
    cookie: req.session?.cookie,
  });

  if (req.session && req.session.userId) {
    console.log("Session is valid for user:", req.session.userId);
    res.json({ authenticated: true, userId: req.session.userId });
  } else {
    console.log("No valid session found");
    res.json({ authenticated: false });
  }
});

// Logout
router.post("/logout", (req, res) => {
  console.log("Logout attempt for session:", req.session.id);
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Error during logout" });
    }
    console.log("Session destroyed successfully");
    res.json({ message: "Logged out successfully" });
  });
});

// Update bio
router.put("/update-bio", isAuthenticated, async (req, res) => {
  try {
    const { bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.session.userId,
      { bio },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Update bio error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update password
router.put("/update-password", isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
