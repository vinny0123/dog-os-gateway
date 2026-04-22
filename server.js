import express from "express";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(express.json());

// Claude client
const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

// Load OS files
function loadOS() {
  const base = path.join(process.cwd(), "os");

  const identity = fs.readFileSync(path.join(base, "identity.txt"), "utf8");
  const universal = fs.readFileSync(path.join(base, "universal.txt"), "utf8");
  const logic = fs.readFileSync(path.join(base, "logic.txt"), "utf8");

  return { identity, universal, logic };
}

// Main consult endpoint
app.post("/consult", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const os = loadOS();

    const systemPrompt = `
IDENTITY STANDARDS:
${os.identity}

UNIVERSAL STANDARDS:
${os.universal}

LOGIC ENGINE:
${os.logic}
`;

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        { role: "user", content: message }
      ]
    });

    res.json({ reply: response.content[0].text });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// Railway port binding
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
