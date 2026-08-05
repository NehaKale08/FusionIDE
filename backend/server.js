const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const runRoutes = require("./routes/runRoutes");

const app = express();

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(express.json());

/* ===== DATABASE ===== */
mongoose
  .connect("mongodb://127.0.0.1:27017/minivscode")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* ===== ROUTES ===== */
app.use("/api/auth", authRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/run", runRoutes);

/* ===== SOCKET SERVER ===== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// socket logic (Java terminal)
require("./socket")(io);

/* ===== START SERVER ===== */
server.listen(5000, () => {
  console.log("Server + Socket.IO running on port 5000");
});