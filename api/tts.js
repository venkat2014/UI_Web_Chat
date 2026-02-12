// api/tts.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { text, lang = 'en' } = await req.json();
  
  // Only allow safe languages
  const allowed = ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa', 'ur'];
  const safeLang = allowed.includes(lang) ? lang : 'en';

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${safeLang}&q=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('TTS failed');
    
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.end(Buffer.from(buffer));
  } catch (e) {
    res.status(500).json({ error: 'Voice not available' });
  }
}
