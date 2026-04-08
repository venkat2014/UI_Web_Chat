import fs from "fs";

const data = JSON.parse(fs.readFileSync("./6_English.json", "utf-8"));

function simpleSearch(query) {
  const q = query.toLowerCase();

  return data
    .map(chunk => {
      let score = 0;

      chunk.keywords.forEach(k => {
        if (q.includes(k)) score += 2;
      });

      if (chunk.content.toLowerCase().includes(q)) score += 5;

      return { ...chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
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
          content: "Answer like a teacher for 6th class student using only provided context. Keep answer simple."
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
