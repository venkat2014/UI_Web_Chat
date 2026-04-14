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

    // 🤖 Gemini API call
     const response = await fetch(

// ✅ New URL (stable v1 endpoint)
`https://generativelanguage.googleapis.com/v1/models/gemma-3-4b:generateContent?key=${process.env.techgeminiapikey}`,      
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error });
    }

    const dataRes = await response.json();

    const reply =
      dataRes?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini";

    // ✅ Convert to OpenRouter format (so frontend stays same)
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
      error: error.message || "Gemini request failed"
    });
  }
}
