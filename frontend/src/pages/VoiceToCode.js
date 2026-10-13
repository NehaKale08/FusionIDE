
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

export default function VoiceToCode({ onInsertCode, onClose }) {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("Idle");

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const generatingRef = useRef(false);

  /* ================= GENERATE CODE ================= */
  const generateCode = useCallback(
    async (prompt) => {
      generatingRef.current = true;
      setStatus("⚡ Generating code...");

      try {
        const res = await fetch("http://localhost:5000/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `You are a voice-to-code generator for FusionIDE.

Return ONLY the code requested by the user.
Do not include explanations, Markdown code fences, or language labels.
Do not add a main function unless the user asks for one.
Generate a complete, useful implementation for the requested task.

Voice command: ${prompt}`,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "AI request failed.");
        }

        let code = data?.reply || "";

        // Remove Markdown code fences if the AI includes them.
        code = code
          .replace(/^\s*```[\w+-]*\s*\n?/i, "")
          .replace(/\n?```\s*$/i, "")
          .trim();

        if (!code) {
          setStatus("⚠️ No code generated");
          return;
        }

        if (typeof onInsertCode !== "function") {
          throw new Error("Code editor insertion function is missing.");
        }

        onInsertCode(code + "\n");
        setStatus("✅ Code inserted successfully");
      } catch (error) {
        console.error("Voice-to-Code error:", error);
        setStatus(`❌ ${error.message || "Could not generate code"}`);
      } finally {
        generatingRef.current = false;
      }
    },
    [onInsertCode]
  );

  /* ================= INITIALIZE MICROPHONE ================= */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("⚠️ Please use Google Chrome");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const speech = event.results[0][0].transcript.trim();

      console.log("Voice command:", speech);
      setText(speech);

      if (speech) {
        generateCode(speech);
      } else {
        setStatus("⚠️ No speech detected");
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
      console.error("Microphone error:", event.error);

      const messages = {
        "no-speech": "⚠️ No speech detected. Try again.",
        "not-allowed": "🚫 Allow microphone permission in Chrome.",
        "audio-capture": "❌ No microphone detected.",
        network: "❌ Speech recognition network error.",
      };

      setStatus(messages[event.error] || `❌ ${event.error}`);

      isListeningRef.current = false;
      setListening(false);
    };

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;

      try {
        recognition.stop();
      } catch (error) {
        // Recognition may already be stopped.
      }
    };
  }, [generateCode]);

  /* ================= START LISTENING ================= */
  const startListening = () => {
    if (!recognitionRef.current || isListeningRef.current) {
      return;
    }

    try {
      setText("");
      setStatus("🎤 Listening...");
      isListeningRef.current = true;
      setListening(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error("Could not start microphone:", error);
      isListeningRef.current = false;
      setListening(false);
      setStatus("❌ Could not start microphone. Try again.");
    }
  };

  /* ================= STOP LISTENING ================= */
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

  /* ================= USER INTERFACE ================= */
  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "300px",
        background: "#020617",
        borderRadius: "12px",
        padding: "12px",
        color: "white",
        boxShadow: "0 0 15px rgba(0,0,0,0.6)",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>🎤 Voice to Code</span>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Voice to Code"
          style={{
            cursor: "pointer",
            color: "#f87171",
            background: "transparent",
            border: "none",
            fontSize: "18px",
          }}
        >
          ✖
        </button>
      </div>

      <div
        style={{
          fontSize: "13px",
          marginTop: "8px",
          color: "#22c55e",
          overflowWrap: "anywhere",
        }}
      >
        {status}
      </div>

      <div
        style={{
          fontSize: "12px",
          minHeight: "40px",
          background: "#0f172a",
          padding: "8px",
          borderRadius: "6px",
          marginTop: "8px",
          overflowWrap: "anywhere",
        }}
      >
        {text || "Your recognized voice command will appear here."}
      </div>

      {!listening ? (
        <button
          type="button"
          onClick={startListening}
          disabled={generatingRef.current}
          style={{
            marginTop: "10px",
            width: "100%",
            padding: "9px",
            background: "#0284c7",
            border: "none",
            color: "white",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ▶ Start
        </button>
      ) : (
        <button
          type="button"
          onClick={stopListening}
          style={{
            marginTop: "10px",
            width: "100%",
            padding: "9px",
            background: "#dc2626",
            border: "none",
            color: "white",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ⏹ Stop
        </button>
      )}
    </div>
  );
}
