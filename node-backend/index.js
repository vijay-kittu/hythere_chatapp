import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import session from "express-session";
import { connectDB } from "./lib/db.js";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// Session middleware - MUST be before routes
const sessionMiddleware = session({
  secret: "chat-app-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to false for development
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: "lax",
  },
  name: "sessionId", // Add a custom name to track the cookie easier
});

app.use(sessionMiddleware);

// Add session debugging middleware
app.use((req, res, next) => {
  console.log("Session Debug:", {
    id: req.session.id,
    userId: req.session.userId,
    cookie: req.session.cookie,
  });
  next();
});

// Socket.io middleware to share session
io.engine.use(sessionMiddleware);

// Socket.io middleware
io.use((socket, next) => {
  const session = socket.request.session;
  if (!session?.userId) {
    return next(new Error("Unauthorized"));
  }
  socket.userId = session.userId;
  next();
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Join user to their personal room
  socket.join(socket.userId);

  // Handle private messages
  socket.on("private_message", async (data) => {
    const { to, message } = data;
    io.to(to).emit("private_message", {
      from: socket.userId,
      message,
      timestamp: new Date(),
    });
  });

  // Handle global messages
  socket.on("global_message", (message) => {
    io.emit("global_message", {
      from: socket.userId,
      message,
      timestamp: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Static file serving for uploads
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
