
const express = require("express");
const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please provide a message."
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "GROQ_API_KEY is missing from backend/.env"
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content:
                "You are FusionIDE's coding assistant. Explain concepts clearly and provide correct code examples."
            },
            ...history
              .filter(
                item =>
                  ["user", "assistant"].includes(item.role) &&
                  typeof item.content === "string"
              )
              .slice(-10),
            { role: "user", content: message }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", response.status, data);
      return res.status(response.status).json({
        error: data?.error?.message || "Groq request failed."
      });
    }

    res.json({
      reply:
        data?.choices?.[0]?.message?.content ||
        "No response received from the AI."
    });
  } catch (error) {
    console.error("AI route error:", error.message);
    res.status(500).json({ error: "AI request failed." });
  }
});

module.exports = router;
