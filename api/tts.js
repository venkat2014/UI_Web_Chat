// api/tts.js
export default async (req) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  
  const { text = '', lang = 'en' } = await req.json();
  const safeLang = ['en','hi','te','ta','kn','ml'].includes(lang) ? lang : 'en';
  
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${safeLang}&q=${encodeURIComponent(text)}&ttsspeed=1`;
  
  const res = await fetch(url);
  if (!res.ok) return new Response('Voice failed', { status: 500 });
  
  return new Response(res.body, { headers: { 'Content-Type': 'audio/mpeg' } });
};
