import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("Neha Kale");
  const [password, setPassword] = useState("");
  const [move, setMove] = useState(false);

  const nav = useNavigate();

  const login = async () => {
    if (!username || !password) return;

    try {
      await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password,
      });

      nav("/home");
    } catch (err) {
      alert("Login failed ❌ Backend error");
      console.log(err);
    }
  };

  const register = async () => {
    await axios.post("http://localhost:5000/api/auth/register", {
      username,
      password,
    });
    alert("Registered. Now login.");
  };

  const handleHover = () => {
    if (!username || !password) {
      setMove(!move);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        /* FULL GLASS BACKGROUND */
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        overflow: "hidden",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      {/* BACKGROUND BLUR CIRCLES */}
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
      ></div>

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
      ></div>

      {/* GLASS LOGIN CARD */}
      <div
        style={{
          width: "420px",
          padding: "40px",
          borderRadius: "25px",
          textAlign: "center",
          zIndex: 10,

          /* GLASS EFFECT */
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",

          boxShadow: "0px 8px 30px rgba(0,0,0,0.6)",
        }}
      >
        {/* TITLE */}
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

        {/* USERNAME INPUT GLASS */}
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

            /* GLASS INPUT */
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(255,255,255,0.15)",

            color: "white",
            fontSize: "16px",
          }}
        />

        {/* PASSWORD INPUT GLASS */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "20px",
            borderRadius: "12px",
            outline: "none",

            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(255,255,255,0.15)",

            color: "white",
            fontSize: "16px",
          }}
        />

        {/* MOVING LOGIN BUTTON GLASS */}
        <div style={{ position: "relative", height: "65px" }}>
          <button
            onClick={login}
            onMouseEnter={handleHover}
            style={{
              position: "absolute",
              left: move ? "150px" : "0px",
              transition: "0.3s ease",

              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "17px",
              fontWeight: "bold",

              /* GLASS BUTTON */
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

        {/* REGISTER BUTTON GLASS */}
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

        {/* FOOTER */}
        <p
          style={{
            marginTop: "25px",
            fontSize: "14px",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Enter credentials to unlock 🚪
        </p>

        {/* CREDITS */}
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