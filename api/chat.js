import fs from "fs";
import path from "path";

// ✅ Safe path for Vercel
const filePath = path.join(process.cwd(), "api", "6_English.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

function simpleSearch(query) {
  const q = query.toLowerCase();

  return data
    .map(chunk => {
      const text = chunk.content.toLowerCase();
      let score = 0;

      // Strong full match
      if (text.includes(q)) score += 20;

      // Word match
      q.split(" ").forEach(word => {
        if (text.includes(word)) score += 2;
      });

      // Keyword boost
      chunk.keywords.forEach(k => {
        if (q.includes(k)) score += 3;
      });

      return { ...chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    const userMsg = messages[messages.length - 1].content;

    // 🔍 RAG search
    const results = simpleSearch(userMsg);
    const context = results.map(r => r.content).join("\n\n");

    // 🧠 Inject context
    const newBody = {
      ...req.body,
      messages: [
        {
          role: "system",
          content: "Reply in the same language as the user (Telugu, Hindi, or English). Answer like a teacher for a 6th class student using only the provided context. Keep the answer short, clear, and natural like spoken language."
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion:\n${userMsg}`
        }
      ]
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://yourdomain.com',
        'X-Title': 'Combo1 AI Agent'
      },
      body: JSON.stringify(newBody)
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error });
    }

    const dataRes = await response.json();
    res.status(200).json(dataRes);

  } catch (error) {
    res.status(500).json({ error: error.message || 'OpenRouter request failed' });
  }
}
