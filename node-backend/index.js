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

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  },
});

// Middleware
app.use(express.json());

// Add trust proxy setting BEFORE other middleware
app.set("trust proxy", 1);

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "Set-Cookie"],
    exposedHeaders: ["Set-Cookie"],
  })
);

// Session middleware - MUST be before routes
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "chat-app-secret",
  resave: true,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    domain:
      process.env.NODE_ENV === "production"
        ? process.env.COOKIE_DOMAIN
        : undefined,
  },
  name: "sessionId",
  rolling: true, // Refresh cookie on each request
});

app.use(sessionMiddleware);

// Add session debugging middleware
app.use((req, res, next) => {
  const debugInfo = {
    sessionId: req.sessionID,
    userId: req.session?.userId,
    cookies: req.cookies,
    secure: req.secure,
    protocol: req.protocol,
    hostname: req.hostname,
    headers: {
      origin: req.headers.origin,
      host: req.headers.host,
      cookie: req.headers.cookie,
    },
  };
  console.log("Request Debug Info:", debugInfo);
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
