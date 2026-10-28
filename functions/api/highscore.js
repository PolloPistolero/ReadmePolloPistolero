// Cloudflare Pages Function: anonymer, globaler Highscore (nur Zahlen, keine Namen, keine IPs).
// Benoetigt in Cloudflare Pages ein KV-Binding mit dem Namen SCORES (Free-Tier reicht).
const MAX = 5000; // oberhalb dieses Werts ist ein Ergebnis in 45 Sekunden praktisch nicht moeglich
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
async function read(env) {
  const best = +(await env.SCORES.get('best') || 0);
  return { best };
}
export async function onRequestGet({ env }) { return json(await read(env)); }
export async function onRequestPost({ request, env }) {
  let s; try { s = (await request.json()).score; } catch { return json({ error: 'bad request' }, 400); }
  if (!Number.isInteger(s) || s < 1 || s > MAX) return json({ error: 'bad score' }, 400);
  const cur = await read(env);
  if (s > cur.best) await env.SCORES.put('best', String(s));
  return json({ best: Math.max(s, cur.best) });
}
