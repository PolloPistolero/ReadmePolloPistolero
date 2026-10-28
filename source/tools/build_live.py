#!/usr/bin/env python3
"""Baut den live-fertigen Ordner dist/ aus preview.html (Quelle der Wahrheit).
Aufruf: python3 tools/build_live.py   (aus dem Repo-Wurzelordner)
Cloudflare Pages: Build-Ausgabeordner = dist, Functions-Ordner = functions (liegt im Repo-Wurzelordner)."""
import shutil, os, re, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
D = R / 'dist'
DOMAIN = 'https://marcwesthoff.com'
src = (R / 'preview.html').read_text()
title = 'Marc Westhoff | Marketing und Brand Building für Gründer'
desc = 'Marc Westhoff: Marketing und Brand Building für Gründer. Ausgewählte Projekte, Kampagnen und Markenaufbau.'
head = f'''<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{DOMAIN}/">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website"><meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}"><meta property="og:url" content="{DOMAIN}/">
<meta property="og:image" content="{DOMAIN}/og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/fonts/inter-tight-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
</head><body>
'''
# Vorschau-Titel/-Beschreibung aus dem Fragment entfernen, damit nur die echten gelten
body = re.sub(r'<title>.*?</title>', '', src, count=1, flags=re.S)
body = re.sub(r'<meta name="description"[^>]*>', '', body, count=1)
if D.exists(): shutil.rmtree(D)
D.mkdir()
(D / 'index.html').write_text(head + body + '\n</body></html>')
shutil.copytree(R / 'public' / 'assets', D / 'assets')
shutil.copytree(R / 'public' / 'fonts', D / 'fonts')
for f in ['favicon.svg', 'og.png']:
    p = R / 'live' / f
    if p.exists(): shutil.copy(p, D / f)
(D / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {DOMAIN}/sitemap.xml\n')
(D / 'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{DOMAIN}/</loc></url></urlset>\n')
(D / '_headers').write_text('''/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/api/*
  Cache-Control: no-store
''')
(D / '404.html').write_text('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404</title><body style="background:#0a0a0a;color:#edf0f2;font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;text-align:center"><div><h1>404</h1><p>Diese Seite gibt es nicht.</p><p><a style="color:#a04af8" href="/">Zur Startseite</a></p></div>')
print('dist gebaut:', sum(1 for _ in D.rglob('*') if _.is_file()), 'Dateien')
