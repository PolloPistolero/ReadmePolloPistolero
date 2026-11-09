// Cloudflare Worker: liefert die statische Seite (./dist) und die zwei API-Endpunkte.
// /api/contact   -> leitet das Kontaktformular an Formspree weiter
// /api/highscore -> anonymer globaler Highscore (KV-Binding SCORES)
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const MAX = 5000;
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self' https://formspree.io; form-action 'self' https://formspree.io; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; worker-src 'self' blob:";
const SEC = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'x-frame-options': 'DENY',
  'content-security-policy': CSP
};
const secure = (r) => { const n = new Response(r.body, r); for (const k in SEC) n.headers.set(k, SEC[k]); return n; };
// POSTs nur von der eigenen Seite akzeptieren
const sameOrigin = (request, u) => { const o = request.headers.get('origin'); return !o || o === u.origin; };

async function contact(request, env, u) {
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  if (!sameOrigin(request, u)) return json({ error: 'origin' }, 403);
  const endpoint = env.FORM_ENDPOINT || 'https://formspree.io/f/xbggyjko';
  let b; try { b = await request.json(); } catch { return json({ error: 'bad request' }, 400); }
  const name = clip(b.name, 120), email = clip(b.email, 200), subject = clip(b.subject, 160), msg = clip(b.msg, 5000);
  if (!name || !msg || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'invalid' }, 400);
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', origin: 'https://marcwesthoff.com', referer: 'https://marcwesthoff.com/' },
    body: JSON.stringify({ name, email, _replyto: email, _subject: subject ? 'Website: ' + subject : 'Anfrage über marcwesthoff.com', message: msg })
  });
  return r.ok ? json({ ok: true }) : json({ error: 'upstream' }, 502);
}

async function highscore(request, env, u) {
  if (!env.SCORES) return json({ best: 0 });
  if (request.method === 'POST' && !sameOrigin(request, u)) return json({ error: 'origin' }, 403);
  const best = +(await env.SCORES.get('best') || 0);
  if (request.method === 'GET') return json({ best });
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  let s; try { s = (await request.json()).score; } catch { return json({ error: 'bad request' }, 400); }
  if (!Number.isInteger(s) || s < 1 || s > MAX) return json({ error: 'bad score' }, 400);
  if (s > best) await env.SCORES.put('best', String(s));
  return json({ best: Math.max(s, best) });
}

// Optionaler Passwortschutz: nur aktiv, wenn in Cloudflare das Secret SITE_PASSWORD gesetzt ist.
// Secret loeschen = Seite oeffentlich. Benutzername ist beliebig, nur das Passwort zaehlt.
function authorized(request, env) {
  if (!env.SITE_PASSWORD) return true;
  const h = request.headers.get('authorization') || '';
  if (!h.startsWith('Basic ')) return false;
  let pw = '';
  try { pw = atob(h.slice(6)).split(':').slice(1).join(':'); } catch { return false; }
  const a = new TextEncoder().encode(pw), b = new TextEncoder().encode(env.SITE_PASSWORD);
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

export default {
  async fetch(request, env) { return secure(await handle(request, env)); }
};
async function handle(request, env) {
    const u = new URL(request.url);
    if (u.protocol === 'http:') { u.protocol = 'https:'; return Response.redirect(u.toString(), 301); }
    if (!authorized(request, env)) {
      return new Response('Passwort erforderlich', { status: 401, headers: { 'www-authenticate': 'Basic realm="marcwesthoff.com", charset="UTF-8"', 'cache-control': 'no-store' } });
    }
    const p = u.pathname;
    if (p === '/api/contact') return contact(request, env, u);
    if (p === '/api/highscore') return highscore(request, env, u);
    return env.ASSETS.fetch(request);
}
