
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const runRoutes = require("./routes/runRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(express.json());

/* ===== DATABASE ===== */
mongoose
  .connect("mongodb://127.0.0.1:27017/minivscode")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB connection error:", err.message));

/* ===== ROUTES ===== */
app.use("/api/auth", authRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/run", runRoutes);
app.use("/api/ai", aiRoutes);

/* ===== SOCKET SERVER ===== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Existing socket logic for the Java terminal
require("./socket")(io);

/* ===== START SERVER ===== */
server.on("error", (err) => {
  console.error("Server error:", err.message);
});

server.listen(5000, () => {
  console.log("Server + Socket.IO running on port 5000");
});
