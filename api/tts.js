// api/tts.js
export default async (req) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  
  const { text = '', lang = 'en' } = await req.json();
  const safeLang = ['en','hi','te','ta','kn','ml'].includes(lang) ? lang : 'en';
  
  // ✅ FIXED: Removed extra spaces after "tl="
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${safeLang}&q=${encodeURIComponent(text)}&ttsspeed=1`;
  
  // Add User-Agent to avoid block
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  
  if (!res.ok) return new Response('Voice failed', { status: 500 });
  
  return new Response(res.body, {
    headers: { 'Content-Type': 'audio/mpeg' }
  });
};
