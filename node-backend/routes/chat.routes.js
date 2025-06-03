import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import PrivateMessage from "../models/PrivateMessage.js";
import GlobalMessage from "../models/GlobalMessage.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Send friend request
router.post("/friend-request", isAuthenticated, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.session.userId;

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ error: "Cannot send friend request to yourself" });
    }

    const existingRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    const request = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get friend requests
router.get("/friend-requests", isAuthenticated, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.session.userId,
      status: "pending",
    }).populate("sender", "fullName email");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Accept/Reject friend request
router.put("/friend-request/:requestId", isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await FriendRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.receiver.toString() !== req.session.userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    request.status = status;
    await request.save();

    if (status === "accepted") {
      // Add each user to the other's friends list
      await User.findByIdAndUpdate(request.sender, {
        $addToSet: { friends: request.receiver },
      });
      await User.findByIdAndUpdate(request.receiver, {
        $addToSet: { friends: request.sender },
      });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get friends list
router.get("/friends", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate(
      "friends",
      "fullName email"
    );
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get chat history with a friend
router.get("/messages/:friendId", isAuthenticated, async (req, res) => {
  try {
    const messages = await PrivateMessage.find({
      $or: [
        { sender: req.session.userId, receiver: req.params.friendId },
        { sender: req.params.friendId, receiver: req.session.userId },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Send message with optional image
router.post(
  "/messages/:friendId",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    try {
      const { text } = req.body;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

      const message = await PrivateMessage.create({
        sender: req.session.userId,
        receiver: req.params.friendId,
        content: {
          text: text || "",
          image: imageUrl,
        },
      });

      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get global chat messages
router.get("/global", isAuthenticated, async (req, res) => {
  try {
    const messages = await GlobalMessage.find()
      .populate("sender", "fullName email")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Send global message
router.post(
  "/global",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    try {
      const { text } = req.body;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

      const message = await GlobalMessage.create({
        sender: req.session.userId,
        content: {
          text: text || "",
          image: imageUrl,
        },
      });

      const populatedMessage = await message.populate(
        "sender",
        "fullName email"
      );
      res.status(201).json(populatedMessage);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
