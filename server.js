const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const friendRoutes = require("./routes/friendRoutes");
const chatRoutes = require("./routes/chatRoutes");
const activityRoutes = require("./routes/activityRoutes");
const apiLimiterMiddleware = require("./middlewares/rateLimiterMiddleware");

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Use Rate Limiting Middleware
app.use(apiLimiterMiddleware);

// Define Routes
app.use("/api/user", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/activity", activityRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
