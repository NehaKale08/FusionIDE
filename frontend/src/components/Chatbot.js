
import React, { useState, useEffect } from "react";
import "./chatbot.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello 👋 How can I help you?", type: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hideUML, setHideUML] = useState(false);

  useEffect(() => {
    if (hideUML) {
      document.body.classList.add("hide-uml");
    } else {
      document.body.classList.remove("hide-uml");
    }

    return () => {
      document.body.classList.remove("hide-uml");
    };
  }, [hideUML]);

  const sendMessage = async () => {
    const userMsg = input.trim();

    if (!userMsg || loading) return;

    const updatedMessages = [
      ...messages,
      { text: userMsg, type: "user" }
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((message) => message.type === "user" || message.type === "bot")
        .slice(-10)
        .map((message) => ({
          role: message.type === "user" ? "user" : "assistant",
          content: message.text
        }));

      const response = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMsg,
          history
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "AI request failed.");
      }

      const reply = data?.reply || "No response received.";

      setMessages((prev) => [
        ...prev,
        { text: reply, type: "bot" }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: `❌ ${error.message || "Error connecting to AI."}`,
          type: "bot"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <div
          className="chat-button"
          onClick={() => {
            setOpen(true);
            setHideUML(true);
          }}
        >
          💬
        </div>
      )}

      {open && (
        <div className="chat-container">
          <div className="chat-header">
            <span>🤖 Assistant</span>
            <button
              className="close-btn"
              onClick={() => {
                setOpen(false);
                setHideUML(false);
              }}
            >
              &times;
            </button>
          </div>

          <div className="chat-body">
            {messages.map((message, index) => {
              const parts = message.text.split("```");

              return (
                <div
                  key={index}
                  className={`message ${message.type}`}
                >
                  {parts.map((part, partIndex) => {
                    if (partIndex % 2 === 1) {
                      const lines = part.split("\n");
                      const firstLine = lines[0].trim();
                      const hasLanguage = /^[a-zA-Z0-9_+#.-]+$/.test(firstLine);
                      const language = hasLanguage ? firstLine : "text";
                      const code = hasLanguage
                        ? lines.slice(1).join("\n")
                        : part;

                      return (
                        <SyntaxHighlighter
                          key={partIndex}
                          language={language}
                          style={oneDark}
                          customStyle={{
                            borderRadius: "8px",
                            padding: "12px",
                            fontSize: "13px"
                          }}
                        >
                          {code}
                        </SyntaxHighlighter>
                      );
                    }

                    return (
                      <p key={partIndex} className="text-block">
                        {part}
                      </p>
                    );
                  })}
                </div>
              );
            })}

            {loading && (
              <div className="message bot">Thinking...</div>
            )}
          </div>

          <div className="chat-footer">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type..."
              disabled={loading}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
