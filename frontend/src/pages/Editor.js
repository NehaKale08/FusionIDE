import React, { useEffect, useState, useRef } from "react";
  import MonacoEditor from "@monaco-editor/react";
  import axios from "axios";
  import { useNavigate } from "react-router-dom";
  import Draggable from "react-draggable";
  import { io } from "socket.io-client";
  import "react-resizable/css/styles.css";
  //import { Toaster } from 'react-hot-toast';
  import "../styles/editor.css";
  import { useParams } from "react-router-dom";
  import { toast } from "react-hot-toast";
  import VoiceToCode from "../pages/VoiceToCode";
  import Chatbot from "../components/Chatbot";
import UMLPanel from "../components/UMLPanel";

  /* ======================= SOCKET ======================= */
  const socket = io("http://localhost:5000");

  /* ======================= TREE COMPONENT ======================= */
  function Tree({ data, onFileClick, onFolderClick, selectedFolder }) {
    const [expandedFolders, setExpandedFolders] = useState({});

    const toggleFolder = (path) => {
      setExpandedFolders((prev) => ({
        ...prev,
        [path]: !prev[path],
      }));

      onFolderClick(path); // also select folder
    };

    return data.map((item) => (
      <div key={item.path} style={{ marginLeft: 15 }}>
        {item.type === "folder" ? (
          <>
            <p
              style={{
                cursor: "pointer",
                color: selectedFolder === item.path ? "#00ffcc" : "#ffd700",
                fontWeight: selectedFolder === item.path ? "bold" : "normal",
              }}
              onClick={() => toggleFolder(item.path)}
            >
            {expandedFolders[item.path] ? "▼ 📂" : "▶ 📁"} {item.name}
            </p>

            {expandedFolders[item.path] &&
              item.children && (
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







  /* ======================= MAIN EDITOR ======================= */
  export default function EditorPage() {
    const nav = useNavigate();
    const editorRef = useRef();

    const [tree, setTree] = useState([]);
    const [code, setCode] = useState("");
    const [currentFile, setCurrentFile] = useState(null);

    const [explorerWidth, setExplorerWidth] = useState(250);

    const [openTabs, setOpenTabs] = useState([]);
    const [activeTab, setActiveTab] = useState(null);

    const [showExplorer, setShowExplorer] = useState(true);

    const [language, setLanguage] = useState("java");

    const [terminalOpen, setTerminalOpen] = useState(true);
    const [terminalOutput, setTerminalOutput] = useState("");
    const [terminalInput, setTerminalInput] = useState("");

    const projectPath = localStorage.getItem("projectPath");

    const [currentDir, setCurrentDir] = useState(projectPath);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const { roomId } = useParams();

    const [showV2C, setShowV2C] = useState(false);


  /*=========================CREATE ROOM============================ */
  const handleCreateRoom = () => {
      nav("/createroom");   
  };


  /*===========================COPY ROOMID==================== */
    const copyRoomId = async () => {
    if (!roomId) {
      toast.error("Create Room ID first");
      return;
    }

    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID is copied");
    } catch (error) {
      console.log(error);
      toast.error("Unable to copy the room ID");
    }
  };

  /*======================Generating Code======================= */
  const typeCode = (code) => {
    let i = 0;

    const interval = setInterval(() => {
      setCode((prev) => prev + code[i]);
      i++;

      if (i >= code.length) {
        clearInterval(interval);
      }
    }, 10); // speed (kam = fast)
  };

    /* ======================= SOCKET LISTEN ======================= */
    useEffect(() => {
      socket.on("terminal-output", (data) => {
        setTerminalOutput((prev) => prev + data);
      });

      return () => {
        socket.off("terminal-output");
      };
    }, []);

    /* ======================= LOAD TREE ======================= */
    const refreshTree = async () => {
      if (!projectPath) return;

      const res = await axios.post(
        "http://localhost:5000/api/project/tree",
        { folderPath: projectPath }
      );

      setTree(res.data);
    };

    useEffect(() => {
      refreshTree();
    }, []);

    /* ======================= RUN CODE (SOCKET) ======================= */
    const runCode = () => {
      if (!currentFile) {
        alert("Open file first");
        return;
      }

      setTerminalOpen(true);
      setTerminalOutput("");

      socket.emit("run-code", {
        filePath: currentFile,
        language: language,
      });
    };

    /* ======================= TERMINAL INPUT ======================= */
    const sendTerminalInput = () => {
      if (!terminalInput.trim()) return;

      socket.emit("terminal-input", terminalInput + "\n");
      setTerminalInput("");
    };

    /* ======================= FILE OPS ======================= */
    const newFile = async () => {
    const name = prompt("Enter new file name:");
    if (!name) return;

    try {
      const basePath = currentDir || projectPath;
      const fullPath = `${basePath}/${name}`;

      await axios.post("http://localhost:5000/api/project/create-file", {
        path: basePath,
        name,
      });

      await refreshTree();

      const res = await axios.post(
        "http://localhost:5000/api/project/read-file",
        { path: fullPath }
      );

      const newTab = { path: fullPath, name, content: res.data.content };

      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTab(fullPath);
      setCode(res.data.content);
      setCurrentFile(fullPath);

    } catch {
      alert("Error creating file");
    }
  };

    const newFolder = async () => {
    const name = prompt("Enter new folder name:");
    if (!name) return;

    const basePath = currentDir || projectPath;

    await axios.post("http://localhost:5000/api/project/create-folder", {
      path: basePath,
      name,
    });

    refreshTree();
  };

    const saveFile = async () => {
      if (!activeTab) return alert("No file open!");

      await axios.post("http://localhost:5000/api/project/save-file", {
        path: activeTab,
        content: code,
      });

      alert("File Saved");
    };

    /* ======================= OPEN FILE ======================= */
    const openFileFromPath = async (path, name) => {
      path = path.replace(/\\/g, "/");

      const existing = openTabs.find((t) => t.path === path);
      if (existing) {
        setActiveTab(path);
        setCode(existing.content);
        setCurrentFile(path);
        return;
      }

      const res = await axios.post(
        "http://localhost:5000/api/project/read-file",
        { path }
      );

      const newTab = { path, name, content: res.data.content };

      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTab(path);
      setCode(res.data.content);
      setCurrentFile(path);
    };

    /* ======================= CLOSE TAB ======================= */
    const closeTab = (path) => {
      const tabs = openTabs.filter((t) => t.path !== path);
      setOpenTabs(tabs);

      if (activeTab === path) {
        if (tabs.length) {
          setActiveTab(tabs[tabs.length - 1].path);
          setCode(tabs[tabs.length - 1].content);
        } else {
          setActiveTab(null);
          setCode("");
        }
      }
    };

    /* ======================= UI ======================= */
    return (
      <div className="editor-container">
        {/* TOP BAR */}
        <div className="top-bar">

          {/* LEFT SIDE */}
          <div className="top-left">

            <button onClick={() => setShowExplorer(prev => !prev)}>
              📁 Explorer
            </button>

            <button onClick={newFile}>📄 New</button>
            <button onClick={newFolder}>📂 Folder</button>
            <button onClick={saveFile}>💾 Save</button>

            <div className="divider"></div>

            <button onClick={runCode}>▶ Run</button>
            <button onClick={() => setTerminalOpen(prev => !prev)}>
              🖥 Terminal
            </button>

            <div className="divider"></div>

            <button onClick={() => setShowV2C(prev => !prev)}>
              🎤 V2C
            </button>

          </div>

          {/* RIGHT SIDE */}
          <div className="top-right">

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
            <button
              onClick={handleCreateRoom}>
              ➕ Create Room
            </button>

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
                padding: showExplorer ? 10 : 0
              }}
          >

          <div className="close-btn"
              onClick={() => setShowExplorer(false)}> ✖</div>
            <h3 style={{ marginTop: 0 }}>Explorer</h3>
            <Tree data={tree} onFileClick={openFileFromPath} 
                
              onFolderClick={(path) => {
                setCurrentDir(path);
                setSelectedFolder(path);
              }}
              selectedFolder={selectedFolder} />
          </div>
          

          <div className="editor-area">
            <MonacoEditor
              height="100%"
              language={language === "cpp" ? "cpp" : language}
              theme="vs-dark"
              value={code}
              onChange={setCode}
              onMount={(editor) => (editorRef.current = editor)}
            />
          </div>
        </div>

        {/* TERMINAL */}
        {terminalOpen && (
          
            <div className="terminal">
              <div className="terminal-header">
                Terminal ▴
              </div>

              <pre className="terminal-output">
                {terminalOutput}
              </pre>

              <input
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendTerminalInput()}
                placeholder="Type input and press Enter"
                className="terminal-input"  
              />
            </div>
          
        )}

        {showV2C && (
  <VoiceToCode
    onInsertCode={(code) => setCode((prev) => prev + code)}
    onClose={() => setShowV2C(false)}
  />
)}

        <Chatbot />
        <UMLPanel />
      </div>
    );
  }