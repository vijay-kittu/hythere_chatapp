import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// Add CORS headers middleware for auth routes
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Cookie, Set-Cookie"
  );
  res.header("Access-Control-Expose-Headers", "Set-Cookie");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

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
    console.log("Request headers:", req.headers);
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

    // Regenerate session when signing in to prevent fixation
    req.session.regenerate(function (err) {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ error: "Error establishing session" });
      }

      // Store user information in session
      req.session.userId = user._id;

      // Save session before responding
      req.session.save(function (err) {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Error saving session" });
        }

        const sessionInfo = {
          id: req.sessionID,
          userId: req.session.userId,
          cookie: req.session.cookie,
        };
        console.log("Session saved successfully. Details:", sessionInfo);

        // Ensure CORS headers are set
        res.header("Access-Control-Allow-Credentials", "true");
        res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);

        // Send response with debug info
        res.json({
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          bio: user.bio,
          debug: {
            sessionId: req.sessionID,
            cookies: req.cookies,
            headers: req.headers,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Check Authentication Status
router.get("/check", (req, res) => {
  console.log("Checking auth status. Full request details:", {
    session: req.session,
    sessionID: req.sessionID,
    cookies: req.cookies,
    headers: req.headers,
  });

  if (req.session && req.session.userId) {
    console.log("Session is valid for user:", req.session.userId);
    res.json({
      authenticated: true,
      userId: req.session.userId,
      sessionId: req.sessionID,
    });
  } else {
    console.log("No valid session found. Request details:", {
      sessionExists: !!req.session,
      sessionID: req.sessionID,
      cookies: req.cookies,
    });
    res.json({
      authenticated: false,
      debug: {
        sessionExists: !!req.session,
        sessionID: req.sessionID,
        hasCookies: !!req.cookies,
      },
    });
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
