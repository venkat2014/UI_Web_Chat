import fs from "fs";
import path from "path";

// ✅ Load RAG data
const filePath = path.join(process.cwd(), "api", "6_English.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

// ✅ Simple search
function simpleSearch(query) {
  const q = query.toLowerCase();

  return data
    .map(chunk => {
      const text = chunk.content.toLowerCase();
      let score = 0;

      if (text.includes(q)) score += 20;

      q.split(" ").forEach(word => {
        if (text.includes(word)) score += 2;
      });

      chunk.keywords.forEach(k => {
        if (q.includes(k)) score += 3;
      });

      return { ...chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ✅ API handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;
    const userMsg = messages[messages.length - 1].content;

    // 🔍 RAG
    const results = simpleSearch(userMsg);
    const context = results.map(r => r.content).join("\n\n");

    // 🧠 Prompt
    const prompt = `
You are a helpful teacher for a 6th class student.

Rules:
- Reply in same language (Telugu, Hindi, or English)
- Use ONLY given context
- Keep answer short, clear, natural spoken style

Context:
${context}

Question:
${userMsg}
`;

    // 🟦 Groq API call (replaces Gemini)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.v2014groqkey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 512,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error });
    }

    const dataRes = await response.json();

    const reply =
      dataRes?.choices?.[0]?.message?.content ||
      "No response from Groq";

    // ✅ Return in same format (frontend stays same)
    res.status(200).json({
      choices: [
        {
          message: {
            content: reply
          }
        }
      ]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message || "Groq request failed"
    });
  }
}
