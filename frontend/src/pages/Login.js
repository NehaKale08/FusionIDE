import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function Login() {
  const [username, setUsername] = useState("Neha Kale");
  const [password, setPassword] = useState("");
  const [move, setMove] = useState(false);

  const nav = useNavigate();

  const login = async () => {
    if (!username.trim() || !password) {
      alert("Please enter username and password.");
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/api/auth/login`, {
        username,
        password,
      });

      alert("Login successful!");
      nav("/home");
    } catch (err) {
      console.error("Login error:", err);
      alert(
  err.response?.data?.message ||
    "Login failed. Please check your credentials or backend connection."
);
    }
  };

  const register = async () => {
    if (!username.trim() || !password) {
      alert("Please enter username and password.");
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/api/auth/register`, {
        username,
        password,
      });

      alert("Registered successfully. Now login.");
    } catch (err) {
      console.error("Registration error:", err);
      alert(
  err.response?.data?.msg ||
    err.response?.data?.message ||
    err.message ||
    "Registration failed. Please try again."
);
    }
  };

  const handleHover = () => {
    if (!username || !password) {
      setMove((prev) => !prev);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        overflow: "hidden",
        fontFamily: "Segoe UI, sans-serif",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      {/* Background blur circles */}
      <div
        style={{
          position: "absolute",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "rgba(37, 99, 235, 0.35)",
          filter: "blur(120px)",
          top: "10%",
          left: "15%",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "rgba(6, 182, 212, 0.35)",
          filter: "blur(120px)",
          bottom: "10%",
          right: "15%",
        }}
      />

      {/* Glass login card */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "40px",
          borderRadius: "25px",
          textAlign: "center",
          position: "relative",
          zIndex: 10,
          boxSizing: "border-box",
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0px 8px 30px rgba(0,0,0,0.6)",
        }}
      >
        <h2
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "white",
            marginBottom: "30px",
            textShadow: "0px 0px 15px rgba(255,255,255,0.3)",
          }}
        >
          ✨ FusionIDE LOGIN ✨
        </h2>

        {/* Username */}
        <input
          placeholder="Username"
          value={username}
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "15px",
            borderRadius: "12px",
            outline: "none",
            boxSizing: "border-box",
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "white",
            fontSize: "16px",
          }}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "20px",
            borderRadius: "12px",
            outline: "none",
            boxSizing: "border-box",
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "white",
            fontSize: "16px",
          }}
        />

        {/* Login button */}
        <div style={{ position: "relative", minHeight: "65px" }}>
          <button
            onClick={login}
            onMouseEnter={handleHover}
            style={{
              position: "absolute",
              left: move ? "20px" : "0px",
              right: move ? "0px" : "0px",
              transition: "0.3s ease",
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "17px",
              fontWeight: "bold",
              background: "rgba(37, 99, 235, 0.35)",
              border: "1px solid rgba(255,255,255,0.25)",
              backdropFilter: "blur(15px)",
              color: "white",
              boxShadow: "0px 5px 20px rgba(0,0,0,0.4)",
            }}
          >
            Login 🚀
          </button>
        </div>

        {/* Register button */}
        <button
          onClick={register}
          style={{
            width: "100%",
            padding: "14px",
            marginTop: "20px",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            background: "rgba(6, 182, 212, 0.35)",
            border: "1px solid rgba(255,255,255,0.25)",
            backdropFilter: "blur(15px)",
            color: "white",
            boxShadow: "0px 5px 20px rgba(0,0,0,0.4)",
          }}
        >
          Register ✍️
        </button>

        <p
          style={{
            marginTop: "25px",
            fontSize: "14px",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Enter credentials to unlock 🚪
        </p>

        <p
          style={{
            marginTop: "16px",
            fontSize: "12px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "rgba(255, 255, 255, 0.55)",
            fontWeight: "500",
          }}
        >
          Developed by NEHA KALE
        </p>
      </div>
    </div>
  );
}