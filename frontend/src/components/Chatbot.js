
import React, { useState, useRef, useEffect } from "react";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const styles = {
  container: {
    position: "fixed",
    right: "14px",
    bottom: "14px",
    width: "380px",
    maxWidth: "calc(100vw - 28px)",
    height: "520px",
    maxHeight: "80vh",
    background: "#020617",
    color: "#e5e7eb",
    border: "1px solid #334155",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 9999,
    boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    background: "#4f46e5",
    padding: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "18px",
    fontWeight: "bold",
  },
  closeButton: {
    background: "transparent",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "22px",
    fontWeight: "bold",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  message: {
    padding: "12px",
    borderRadius: "9px",
    fontSize: "15px",
    lineHeight: 1.55,
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
  inputArea: {
    display: "flex",
    borderTop: "1px solid #334155",
    background: "#0f172a",
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: "14px 12px",
    border: "none",
    outline: "none",
    fontSize: "16px",
    background: "#fff",
    color: "#111827",
  },
  sendButton: {
    padding: "12px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    cursor: "pointer",
    fontSize: "15px",
  },
  codeBlock: {
    background: "#020617",
    color: "#d1fae5",
    padding: "12px",
    borderRadius: "6px",
    overflowX: "auto",
    fontSize: "13px",
    whiteSpace: "pre",
  },
  copyButton: {
    padding: "5px 9px",
    background: "#334155",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "6px",
  },
};

function MessageContent({ content }) {
  const parts = String(content || "").split(/(```[\s\S]*?```)/g);

  return (
    <div>
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.split("\n");
          const code = lines.slice(1, -1).join("\n");

          return (
            <div key={index} style={{ marginTop: 8, marginBottom: 8 }}>
              <button
                style={styles.copyButton}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(code);
                  } catch (error) {
                    console.error("Unable to copy code:", error);
                  }
                }}
              >
                Copy code
              </button>
              <pre style={styles.codeBlock}>
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        return (
          <span key={index} style={{ whiteSpace: "pre-wrap" }}>
            {part}
          </span>
        );
      })}
    </div>
  );
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello 👋 How can I help you?",
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (event) => {
    event?.preventDefault();

    const userMessage = input.trim();

    if (!userMessage || loading) return;

    const updatedMessages = [
      ...messages,
      { role: "user", content: userMessage },
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            history: messages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Server error: ${response.status}`
        );
      }

      const reply = data.reply || data.response || data.message;

      if (!reply || typeof reply !== "string") {
        throw new Error(
          "The backend did not return a valid reply."
        );
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: reply },
      ]);
    } catch (error) {
      console.error("Chatbot request failed:", error);

      let errorMessage =
        error.message || "Unable to get a response from the assistant.";

      if (
        error instanceof TypeError ||
        errorMessage.toLowerCase().includes("fetch")
      ) {
        errorMessage =
          "Cannot connect to the backend. Make sure the backend is running on port 5000 and the backend URL is correct.";
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: `❌ ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          padding: "14px 18px",
          border: "none",
          borderRadius: "50px",
          background: "#4f46e5",
          color: "#fff",
          cursor: "pointer",
          zIndex: 9999,
          fontSize: 16,
        }}
      >
        🤖 Assistant
      </button>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>🤖 Assistant</span>
        <button
          type="button"
          style={styles.closeButton}
          onClick={() => setIsOpen(false)}
          aria-label="Close assistant"
        >
          ×
        </button>
      </div>

      <div style={styles.messages}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf:
                message.role === "user" ? "flex-end" : "stretch",
              maxWidth: "100%",
              background:
                message.role === "user" ? "#4f46e5" : "#1e293b",
              color: "#e5e7eb",
            }}
          >
            <MessageContent content={message.content} />
          </div>
        ))}

        {loading && (
          <div
            style={{
              ...styles.message,
              background: "#1e293b",
              alignSelf: "flex-start",
            }}
          >
            Assistant is thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={styles.inputArea}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type..."
          style={styles.input}
          disabled={loading}
          autoComplete="off"
        />

        <button
          type="submit"
          style={{
            ...styles.sendButton,
            opacity: loading || !input.trim() ? 0.6 : 1,
          }}
          disabled={loading || !input.trim()}
        >
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
