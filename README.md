# marcwesthoff.com

Statische Seite in `dist/` plus ein Cloudflare Worker (`worker.js`) fuer `/api/contact` (Formspree) und `/api/highscore` (KV `SCORES`).
Deploy: `npx wrangler deploy` (Konfiguration in `wrangler.jsonc`). Quelle der Seite: `source/preview.html`, Build: `python3 source/tools/build_live.py`.
