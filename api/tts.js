// api/tts.js
export const config = {
  runtime: 'edge', // Optional: ensures Edge runtime
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { text, lang = 'en' } = await req.json();
    
    const allowed = ['en', 'hi', 'te', 'ta', 'kn', 'ml'];
    const safeLang = allowed.includes(lang) ? lang : 'en';

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${safeLang}&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Google TTS failed:', response.status, response.statusText);
      return new Response('Voice not available', { status: 500 });
    }

    // Stream response directly (no Buffer)
    return new Response(response.body, {
      headers: { 'Content-Type': 'audio/mpeg' }
    });

  } catch (e) {
    console.error('TTS Error:', e.message);
    return new Response('Internal error', { status: 500 });
  }
}
