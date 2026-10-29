const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        msg: "Username and password are required."
      });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(409).json({
        msg: "Username already exists. Please log in."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashedPassword
    });

    return res.status(201).json({
      msg: "Registered successfully."
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      msg: "Registration failed due to a server error."
    });
  }
});

// Log in an existing user
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        msg: "Username and password are required."
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({
        msg: "User not found. Please register first."
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(400).json({
        msg: "Wrong password."
      });
    }

    const jwtSecret = process.env.JWT_SECRET || "secret123";

    const token = jwt.sign(
      { id: user._id },
      jwtSecret,
      { expiresIn: "1d" }
    );

    return res.json({
      msg: "Login successful.",
      token
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      msg: "Login failed due to a server error."
    });
  }
});

module.exports = router;