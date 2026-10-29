
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

// Backend URL: local development fallback
const BACKEND_URL = (
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function VoiceToCode({ onInsertCode, onClose }) {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("Idle");
  const [generating, setGenerating] = useState(false);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const generatingRef = useRef(false);

  // Generate code using the existing backend AI endpoint
  const generateCode = useCallback(
    async (prompt) => {
      if (!BACKEND_URL) {
        setStatus("❌ Backend URL is not configured.");
        return;
      }

      generatingRef.current = true;
      setGenerating(true);
      setStatus("⚡ Generating code...");

      try {
        const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `You are the Voice-to-Code assistant inside FusionIDE.

The user wants code generated from this voice command:
${prompt}

Generate complete, useful code for the requested task.
Return the code only, without Markdown fences or explanations.
Use the programming language currently selected in the IDE if specified in the request.
Do not invent or claim to execute the code.`,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data.error ||
              data.message ||
              `AI request failed with status ${res.status}`
          );
        }

        // Support common response formats from the backend
        let code =
          data.reply ??
          data.response ??
          data.message ??
          data.content ??
          "";

        if (typeof code !== "string") {
          throw new Error("The AI returned an unexpected response format.");
        }

        // Remove optional Markdown code fences
        code = code
          .replace(/^\s*```[\w+-]*\s*\n?/, "")
          .replace(/\n?```\s*$/, "")
          .trim();

        if (!code) {
          throw new Error("The AI returned an empty code response.");
        }

        if (typeof onInsertCode !== "function") {
          throw new Error("The editor insertion function is missing.");
        }

        onInsertCode(code + "\n");
        setStatus("✅ Code inserted into the editor.");
      } catch (error) {
        console.error("Voice-to-Code error:", error);

        if (
          error instanceof TypeError &&
          /fetch/i.test(error.message)
        ) {
          setStatus(
            "❌ Cannot connect to backend. Check that the backend is running."
          );
        } else {
          setStatus(`❌ ${error.message || "Could not generate code."}`);
        }
      } finally {
        generatingRef.current = false;
        setGenerating(false);
      }
    },
    [onInsertCode]
  );

  // Initialize browser speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("⚠️ Speech recognition is unavailable. Use Chrome.");
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setListening(true);
      setStatus("🎤 Listening...");
    };

    recognition.onresult = (event) => {
      const speech = event.results?.[0]?.[0]?.transcript?.trim() || "";

      setText(speech);

      if (speech) {
        generateCode(speech);
      } else {
        setStatus("⚠️ No speech detected. Try again.");
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setListening(false);

      if (!generatingRef.current) {
        setStatus((current) =>
          current === "🎤 Listening..." ? "Idle" : current
        );
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      const messages = {
        "no-speech": "⚠️ No speech detected. Try again.",
        "not-allowed": "🚫 Allow microphone access in Chrome.",
        "audio-capture": "❌ No microphone detected.",
        network: "❌ Speech recognition network error.",
        aborted: "Speech recognition stopped.",
      };

      setStatus(messages[event.error] || `❌ ${event.error}`);
      isListeningRef.current = false;
      setListening(false);
    };

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onstart = null;

      try {
        recognition.stop();
      } catch (error) {
        // Recognition may already be stopped.
      }

      recognitionRef.current = null;
      isListeningRef.current = false;
    };
  }, [generateCode]);

  // Start microphone
  const startListening = () => {
    if (!recognitionRef.current) {
      setStatus("⚠️ Speech recognition is unavailable in this browser.");
      return;
    }

    if (isListeningRef.current || generatingRef.current) {
      return;
    }

    try {
      setText("");
      setStatus("🎤 Listening...");
      recognitionRef.current.start();
    } catch (error) {
      console.error("Could not start microphone:", error);
      setStatus("❌ Could not start microphone. Try again.");
    }
  };

  // Stop microphone
  const stopListening = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error("Could not stop microphone:", error);
    }

    isListeningRef.current = false;
    setListening(false);

    if (!generatingRef.current) {
      setStatus("🛑 Stopped");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "340px",
        maxWidth: "calc(100vw - 40px)",
        boxSizing: "border-box",
        background: "#020617",
        borderRadius: "12px",
        padding: "14px",
        color: "white",
        boxShadow: "0 0 15px rgba(0,0,0,0.6)",
        zIndex: 10000,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <strong style={{ fontSize: "18px" }}>🎤 Voice to Code</strong>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Voice to Code"
          style={{
            cursor: "pointer",
            color: "#a78bfa",
            background: "transparent",
            border: "none",
            fontSize: "24px",
          }}
        >
          ✖
        </button>
      </div>

      <div
        role="status"
        style={{
          fontSize: "13px",
          marginTop: "12px",
          color: status.startsWith("❌") ? "#f87171" : "#22c55e",
          overflowWrap: "anywhere",
        }}
      >
        {status}
      </div>

      <div
        style={{
          fontSize: "13px",
          minHeight: "40px",
          background: "#0f172a",
          padding: "10px",
          borderRadius: "6px",
          marginTop: "10px",
          overflowWrap: "anywhere",
        }}
      >
        {text || "Your recognized voice command will appear here."}
      </div>

      {!listening ? (
        <button
          type="button"
          onClick={startListening}
          disabled={generating}
          style={{
            marginTop: "12px",
            width: "100%",
            padding: "12px",
            background: "#0284c7",
            border: "none",
            color: "white",
            borderRadius: "6px",
            cursor: generating ? "not-allowed" : "pointer",
            opacity: generating ? 0.6 : 1,
            fontSize: "15px",
          }}
        >
          {generating ? "⚡ Generating..." : "▶ Start Listening"}
        </button>
      ) : (
        <button
          type="button"
          onClick={stopListening}
          style={{
            marginTop: "12px",
            width: "100%",
            padding: "12px",
            background: "#dc2626",
            border: "none",
            color: "white",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "15px",
          }}
        >
          ⏹ Stop Listening
        </button>
      )}
    </div>
  );
}
