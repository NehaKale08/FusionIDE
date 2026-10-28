import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [openPath, setOpenPath] = useState("");

  const nav = useNavigate();

  const createProject = async () => {
    if (!name.trim() || !path.trim()) {
      alert("Enter project name and path");
      return;
    }

    const res = await axios.post(
      "http://localhost:5000/api/project/create",
      {
        projectName: name.trim(),
        projectPath: path.trim(),
      }
    );

    localStorage.setItem("projectPath", res.data.path);
    nav("/editor");
  };

  const openProject = () => {
    if (!openPath.trim()) {
      alert("Enter a valid folder path");
      return;
    }

    localStorage.setItem("projectPath", openPath.trim());
    nav("/editor");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
        fontFamily: "Consolas, monospace",

        /* GLASS BACKGROUND */
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        overflow: "hidden",
      }}
    >
      {/* BACKGROUND BLUR BLOBS */}
      <div
        style={{
          position: "absolute",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "rgba(14, 99, 156, 0.35)",
          filter: "blur(120px)",
          top: "10%",
          left: "10%",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "rgba(22, 130, 93, 0.35)",
          filter: "blur(120px)",
          bottom: "10%",
          right: "10%",
        }}
      />

      {/* GLASS CARD */}
      <div
        style={{
          width: "560px",
          borderRadius: "20px",
          zIndex: 10,

          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.15)",

          boxShadow: "0px 10px 35px rgba(0,0,0,0.6)",
          overflow: "hidden",
          color: "#d4d4d4",
        }}
      >
        {/* TOP BAR */}
        <div
          style={{
            padding: "14px",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "16px",
            color: "#ffffff",

            background: "rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          Project Dashboard 🚀
        </div>

        {/* BODY */}
        <div style={{ padding: "30px" }}>
          {/* CREATE PROJECT */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ color: "#569cd6", marginBottom: "12px" }}>
              ➕ Create New Project
            </h3>

            <input
              placeholder="Project Name"
              onChange={(e) => setName(e.target.value)}
              style={glassInput}
            />

            <input
              placeholder="Project Path (C:\\projects)"
              onChange={(e) => setPath(e.target.value)}
              style={glassInput}
            />

            <button onClick={createProject} style={glassButtonBlue}>
              Create Project
            </button>
          </div>

          <hr style={{ border: "1px solid rgba(255,255,255,0.15)" }} />

          {/* OPEN PROJECT */}
          <div style={{ marginTop: "25px" }}>
            <h3 style={{ color: "#ce9178", marginBottom: "12px" }}>
              📂 Open Existing Project
            </h3>

            <input
              placeholder="Existing Folder Path"
              onChange={(e) => setOpenPath(e.target.value)}
              style={glassInput}
            />

            <button onClick={openProject} style={glassButtonGreen}>
              Open Project
            </button>
          </div>

          {/* FOOTER */}
          <p
            style={{
              textAlign: "center",
              marginTop: "25px",
              fontSize: "13px",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Manage your projects easily ✨
          </p>
          <p
            style={{
              textAlign: "center",
              marginTop: "10px",
              fontSize: "12px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "rgba(255, 255, 255, 0.45)",
              fontWeight: "500",
            }}
          >
            Developed by NEHA KALE
          </p>
        </div>
      </div>
    </div>
  );
}

/* REUSABLE GLASS STYLES */
const glassInput = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  outline: "none",
  fontSize: "14px",

  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(15px)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#ffffff",
};

const glassButtonBlue = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.25)",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "bold",

  background: "rgba(14, 99, 156, 0.35)",
  backdropFilter: "blur(15px)",
  color: "white",
};

const glassButtonGreen = {
  ...glassButtonBlue,
  background: "rgba(22, 130, 93, 0.35)",
};