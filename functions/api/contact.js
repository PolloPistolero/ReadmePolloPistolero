// Cloudflare Pages Function: nimmt das Kontaktformular entgegen und leitet es an Formspree weiter.
// Das Formspree-Formular (xbggyjko) ist fest hinterlegt. Optional kann in Cloudflare Pages die
// Umgebungsvariable FORM_ENDPOINT gesetzt werden, um ein anderes Formular zu verwenden.
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const clip = (v, n) => String(v ?? '').trim().slice(0, n);
export async function onRequestPost({ request, env }) {
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
