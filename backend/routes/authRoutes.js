const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Register
router.post("/register", async (req,res)=>{
  const {username, password} = req.body;

  const hashed = await bcrypt.hash(password,10);

  await User.create({username, password: hashed});
  res.json({msg:"Registered"});
});

// Login
router.post("/login", async (req,res)=>{
  const {username, password} = req.body;

  const user = await User.findOne({username});
  if(!user) return res.status(400).json({msg:"User not found"});

  const match = await bcrypt.compare(password, user.password);
  if(!match) return res.status(400).json({msg:"Wrong password"});

  const token = jwt.sign({id:user._id},"secret123");

  res.json({token});
});

module.exports = router;