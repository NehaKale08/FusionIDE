import React, { useEffect, useState, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import "react-resizable/css/styles.css";
import "../styles/editor.css";
import { toast } from "react-hot-toast";
import VoiceToCode from "../pages/VoiceToCode";
import Chatbot from "../components/Chatbot";
import UMLPanel from "../components/UMLPanel";

// Backend URL
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

// Socket.IO connection
const socket = io(BACKEND_URL);

function Tree({ data, onFileClick, onFolderClick, selectedFolder }) {
  const [expandedFolders, setExpandedFolders] = useState({});

  const toggleFolder = (path) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));

    onFolderClick(path);
  };

  return (Array.isArray(data) ? data : []).map((item) => (
    <div key={item.path} style={{ marginLeft: 15 }}>
      {item.type === "folder" ? (
        <>
          <p
            style={{
              cursor: "pointer",
              color:
                selectedFolder === item.path ? "#00ffcc" : "#ffd700",
              fontWeight:
                selectedFolder === item.path ? "bold" : "normal",
            }}
            onClick={() => toggleFolder(item.path)}
          >
            {expandedFolders[item.path] ? "▼ 📂" : "▶ 📁"} {item.name}
          </p>

          {expandedFolders[item.path] && item.children && (
            <Tree
              data={item.children}
              onFileClick={onFileClick}
              onFolderClick={onFolderClick}
              selectedFolder={selectedFolder}
            />
          )}
        </>
      ) : (
        <p
          style={{ cursor: "pointer", color: "#ccc" }}
          onClick={() => onFileClick(item.path, item.name)}
        >
          📄 {item.name}
        </p>
      )}
    </div>
  ));
}

export default function EditorPage() {
  const nav = useNavigate();
  const editorRef = useRef();

  const [tree, setTree] = useState([]);
  const [code, setCode] = useState("");
  const [currentFile, setCurrentFile] = useState(null);
  const [explorerWidth] = useState(250);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [showExplorer, setShowExplorer] = useState(true);
  const [language, setLanguage] = useState("java");
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [terminalInput, setTerminalInput] = useState("");

  const projectPath = localStorage.getItem("projectPath") || "";
  const [currentDir, setCurrentDir] = useState(projectPath);
  const [selectedFolder, setSelectedFolder] = useState(null);

  const { roomId } = useParams();
  const [showV2C, setShowV2C] = useState(false);

  const handleCreateRoom = () => {
    nav("/createroom");
  };

  const copyRoomId = async () => {
    if (!roomId) {
      toast.error("Create Room ID first");
      return;
    }

    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID is copied");
    } catch (error) {
      console.error("Error copying room ID:", error);
      toast.error("Unable to copy the room ID");
    }
  };

  // Generate code character by character
  // eslint-disable-next-line no-unused-vars
  const typeCode = (generatedCode) => {
    let i = 0;

    const interval = setInterval(() => {
      setCode((prev) => prev + generatedCode[i]);
      i++;

      if (i >= generatedCode.length) {
        clearInterval(interval);
      }
    }, 10);
  };

  // Socket listeners
  useEffect(() => {
    const handleTerminalOutput = (data) => {
      setTerminalOutput((prev) => prev + data);
    };

    socket.on("terminal-output", handleTerminalOutput);

    return () => {
      socket.off("terminal-output", handleTerminalOutput);
    };
  }, []);

  // Load project tree
  const refreshTree = async () => {
    const savedProjectPath = localStorage.getItem("projectPath");

    if (!savedProjectPath || !savedProjectPath.trim()) {
      console.error("Project path is missing from localStorage.");
      setTree([]);
      toast.error(
        "No project selected. Please create or open a project first."
      );
      return;
    }

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/project/tree`,
        { folderPath: savedProjectPath },
        { timeout: 15000 }
      );

      if (!Array.isArray(res.data)) {
        console.error("Unexpected project tree response:", res.data);
        setTree([]);
        toast.error("Invalid project files response from backend.");
        return;
      }

      setTree(res.data);
    } catch (error) {
      console.error(
        "Error loading project tree:",
        error.response?.data || error.message
      );

      setTree([]);

      if (
        error.code === "ERR_NETWORK" ||
        error.code === "ECONNREFUSED"
      ) {
        toast.error(
          "Backend is not running. Start the backend on port 5000."
        );
      } else if (error.response?.status === 404) {
        toast.error("Project tree API not found. Check backend routes.");
      } else if (error.response?.status === 400) {
        toast.error(
          error.response.data?.message || "Invalid project folder path."
        );
      } else {
        toast.error(
          error.response?.data?.message ||
            "Unable to load project files."
        );
      }
    }
  };

  useEffect(() => {
    refreshTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run code using Socket.IO
  const runCode = () => {
    if (!currentFile) {
      alert("Open file first");
      return;
    }

    setTerminalOpen(true);
    setTerminalOutput("");

    socket.emit("run-code", {
      filePath: currentFile,
      language,
    });
  };

  // Terminal input
  const sendTerminalInput = () => {
    if (!terminalInput.trim()) return;

    socket.emit("terminal-input", terminalInput + "\n");
    setTerminalInput("");
  };

  // Create file
  const newFile = async () => {
    const name = prompt("Enter new file name:");

    if (!name) return;

    try {
      const basePath = currentDir || projectPath;

      if (!basePath) {
        toast.error("Select or create a project first.");
        return;
      }

      await axios.post(`${BACKEND_URL}/api/project/create-file`, {
        path: basePath,
        name,
      });

      await refreshTree();

      const fullPath = `${basePath}/${name}`;

      const res = await axios.post(
        `${BACKEND_URL}/api/project/read-file`,
        { path: fullPath }
      );

      const newTab = {
        path: fullPath,
        name,
        content: res.data.content,
      };

      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTab(fullPath);
      setCode(res.data.content);
      setCurrentFile(fullPath);
    } catch (error) {
      console.error(
        "Error creating file:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message || "Error creating file"
      );
    }
  };

  // Create folder
  const newFolder = async () => {
    const name = prompt("Enter new folder name:");

    if (!name) return;

    try {
      const basePath = currentDir || projectPath;

      if (!basePath) {
        toast.error("Select or create a project first.");
        return;
      }

      await axios.post(`${BACKEND_URL}/api/project/create-folder`, {
        path: basePath,
        name,
      });

      await refreshTree();
      toast.success("Folder created successfully");
    } catch (error) {
      console.error(
        "Error creating folder:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message || "Error creating folder"
      );
    }
  };

  // Save file
  const saveFile = async () => {
    if (!activeTab) {
      alert("No file open!");
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/api/project/save-file`, {
        path: activeTab,
        content: code,
      });

      toast.success("File Saved");
    } catch (error) {
      console.error(
        "Error saving file:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message || "Error saving file"
      );
    }
  };

  // Open file
  const openFileFromPath = async (path, name) => {
    // Normalize Windows path separators
    path = path.replace(/\\/g, "/");

    const existing = openTabs.find((tab) => tab.path === path);

    if (existing) {
      setActiveTab(path);
      setCode(existing.content);
      setCurrentFile(path);
      return;
    }

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/project/read-file`,
        { path }
      );

      const newTab = {
        path,
        name,
        content: res.data.content,
      };

      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTab(path);
      setCode(res.data.content);
      setCurrentFile(path);
    } catch (error) {
      console.error(
        "Error opening file:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message || "Error opening file"
      );
    }
  };

  // Close tab
  const closeTab = (path) => {
    const tabs = openTabs.filter((tab) => tab.path !== path);
    setOpenTabs(tabs);

    if (activeTab === path) {
      if (tabs.length) {
        const lastTab = tabs[tabs.length - 1];

        setActiveTab(lastTab.path);
        setCode(lastTab.content);
        setCurrentFile(lastTab.path);
      } else {
        setActiveTab(null);
        setCode("");
        setCurrentFile(null);
      }
    }
  };

  return (
    <div className="editor-container">
      {/* TOP BAR */}
      <div className="top-bar">
        {/* LEFT SIDE */}
        <div className="top-left">
          <button onClick={() => setShowExplorer((prev) => !prev)}>
            📁 Explorer
          </button>

          <button onClick={newFile}>📄 New</button>
          <button onClick={newFolder}>📂 Folder</button>
          <button onClick={saveFile}>💾 Save</button>

          <div className="divider"></div>

          <button onClick={runCode}>▶ Run</button>

          <button onClick={() => setTerminalOpen((prev) => !prev)}>
            🖥 Terminal
          </button>

          <div className="divider"></div>

          <button onClick={() => setShowV2C((prev) => !prev)}>
            🎤 V2C
          </button>
        </div>

        {/* RIGHT SIDE */}
        <div className="top-right">
          <span
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              fontWeight: 500,
              marginRight: "4px",
            }}
          >
            Developed by NEHA KALE
          </span>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="javascript">JavaScript</option>
          </select>

          <button onClick={handleCreateRoom}>➕ Create Room</button>

          <div className="room-box">
            <span>{roomId || "No Room"}</span>
            <button onClick={copyRoomId}>📋</button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        {openTabs.map((tab) => (
          <div
            key={tab.path}
            onClick={() => {
              setActiveTab(tab.path);
              setCode(tab.content);
              setCurrentFile(tab.path);
            }}
            className={`tab ${tab.path === activeTab ? "active" : ""}`}
          >
            {tab.name}

            <span
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.path);
              }}
            >
              ×
            </span>
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div className="main">
        <div
          className="explorer"
          style={{
            width: showExplorer ? explorerWidth : 0,
            minWidth: showExplorer ? explorerWidth : 0,
            padding: showExplorer ? 10 : 0,
          }}
        >
          <div
            className="close-btn"
            onClick={() => setShowExplorer(false)}
          >
            ✖
          </div>

          <h3 style={{ marginTop: 0 }}>Explorer</h3>

          <Tree
            data={tree}
            onFileClick={openFileFromPath}
            onFolderClick={(path) => {
              setCurrentDir(path);
              setSelectedFolder(path);
            }}
            selectedFolder={selectedFolder}
          />
        </div>

        <div className="editor-area">
          <MonacoEditor
            height="100%"
            language={language === "cpp" ? "cpp" : language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value ?? "")}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
          />
        </div>
      </div>

      {/* TERMINAL */}
      {terminalOpen && (
        <div className="terminal">
          <div className="terminal-header">Terminal ▴</div>

          <pre className="terminal-output">{terminalOutput}</pre>

          <input
            value={terminalInput}
            onChange={(e) => setTerminalInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && sendTerminalInput()
            }
            placeholder="Type input and press Enter"
            className="terminal-input"
          />
        </div>
      )}

      {/* VOICE TO CODE */}
      {showV2C && (
        <VoiceToCode
          onInsertCode={(generatedCode) =>
            setCode((prev) => prev + generatedCode)
          }
          onClose={() => setShowV2C(false)}
        />
      )}

      <Chatbot />
      <UMLPanel />
    </div>
  );
}