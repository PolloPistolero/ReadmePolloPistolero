# marcwesthoff.com

Handgebaute statische Seite (Cloudflare Pages).

- `dist/` ist die fertige Website (wird so ausgeliefert, kein Build-Schritt nötig)
- `functions/api/` sind die Server-Funktionen: `contact.js` (Kontaktformular über Formspree) und `highscore.js` (anonymer Highscore, braucht den KV-Speicher `SCORES`)
- `source/` enthält die Quelldatei (`preview.html`) und das Build-Skript

## Cloudflare Pages
Framework: keins. Build-Befehl: leer. Ausgabeordner: `dist`.
Einstellungen > Functions > KV-Namespace-Bindings: Variable `SCORES` mit einem KV-Namespace verbinden.
