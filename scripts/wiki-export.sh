#!/usr/bin/env bash
# Exportiert das OpenWiki als statische Seite nach public/wiki/ — ohne externe Abrufe.
#
# Aufruf:
#   bash scripts/wiki-export.sh            # exportieren, Bibliotheken lokal einsetzen, prüfen
#   bash scripts/wiki-export.sh --pruefen  # nur prüfen, ob public/wiki/ noch sauber ist
#
# Der Visualizer von OpenWiki lädt normalerweise vier Bibliotheken von jsdelivr und die
# Schrift „Inter" von fonts.googleapis.com. Das widerspricht der Zusage im README
# („keine externen Schriften, Bilder, CDNs; alles lokal"). Dieses Skript setzt an die
# Stelle der CDN-Adressen die Kopien aus scripts/vendor/wiki/ und stellt die Schrift auf
# den System-Stack um. Danach bricht es ab, wenn in HTML oder CSS noch eine externe
# Adresse steht.
set -euo pipefail

HIER="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HIER"
ZIEL="public/wiki"
VENDOR="scripts/vendor/wiki"

pruefen() {
  local fund=0
  # Nur ladende Verweise ansehen (src=, href=, url(...)), nicht den Inhalt der Seiten.
  if grep -nE '(src|href)="https?://' "$ZIEL"/index.html; then
    echo "FEHLER: externer Verweis in $ZIEL/index.html" >&2; fund=1
  fi
  if grep -nE 'cdn\.jsdelivr|fonts\.googleapis|fonts\.gstatic' "$ZIEL"/index.html; then
    echo "FEHLER: CDN bleibt in $ZIEL/index.html genannt (auch in der CSP)" >&2; fund=1
  fi
  if grep -nE 'url\((["'\'']?)https?://' "$ZIEL"/*.css "$ZIEL"/client*.js 2>/dev/null; then
    echo "FEHLER: externe Adresse in CSS/JS" >&2; fund=1
  fi
  for f in force-graph.min.js marked.min.js purify.min.js mermaid.min.js; do
    [ -s "$ZIEL/vendor/$f" ] || { echo "FEHLER: $ZIEL/vendor/$f fehlt" >&2; fund=1; }
  done
  if [ -f "$ZIEL/graph.json" ]; then
    echo "Seiten im Export: $(python3 -c "import json;print(len(json.load(open('$ZIEL/graph.json'))['nodes']))")"
  else
    echo "FEHLER: $ZIEL/graph.json fehlt" >&2; fund=1
  fi
  if [ "$fund" = 0 ]; then echo "OK: $ZIEL kommt ohne externe Abrufe aus."; fi
  return "$fund"
}

if [ "${1:-}" = "--pruefen" ]; then
  pruefen
  exit $?
fi

command -v openwiki >/dev/null 2>&1 || {
  echo "openwiki fehlt im PATH (npm install -g openwiki@0.7.2)" >&2; exit 1; }

OPENWIKI_TELEMETRY_DISABLED=1 openwiki visualize openwiki --export "$ZIEL"

node scripts/wiki-vendor.mjs   # Kopien aus scripts/vendor/wiki/ (eine Quelle, kein Doppel im Git)

python3 - "$ZIEL" <<'PY'
import pathlib, re, sys
ziel = pathlib.Path(sys.argv[1])
html = (ziel / 'index.html').read_text(encoding='utf-8')

ersatz = {
    r'https://cdn\.jsdelivr\.net/npm/force-graph@[^"]+': './vendor/force-graph.min.js',
    r'https://cdn\.jsdelivr\.net/npm/marked@[^"]+': './vendor/marked.min.js',
    r'https://cdn\.jsdelivr\.net/npm/dompurify@[^"]+': './vendor/purify.min.js',
    r'https://cdn\.jsdelivr\.net/npm/mermaid@[^"]+': './vendor/mermaid.min.js',
}
for muster, pfad in ersatz.items():
    html, n = re.subn(muster, pfad, html)
    if n == 0:
        print(f'WARNUNG: {muster} kam im Export nicht vor', file=sys.stderr)

# Google Fonts: die beiden Zeilen fallen weg, die Schrift kommt aus dem System-Stack.
html = re.sub(r'\s*<link[^>]*fonts\.googleapis\.com[^>]*>', '', html)
html = re.sub(r'\s*<link[^>]*fonts\.gstatic\.com[^>]*>', '', html)

# Die Content-Security-Policy nannte die CDNs noch als erlaubte Quellen — ohne die
# CDN-Verweise hat das nichts mehr zu suchen.
html = html.replace("script-src 'self' https://cdn.jsdelivr.net", "script-src 'self'")
html = html.replace("font-src 'self' https://fonts.gstatic.com", "font-src 'self'")
# Was dann noch als erlaubte Quelle in der CSP steht (style-src), faellt ebenfalls weg.
html = re.sub(r" https://(?:cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)", "", html)
(ziel / 'index.html').write_text(html, encoding='utf-8')

css = ziel / 'styles.css'
t = css.read_text(encoding='utf-8')
t = t.replace('"Inter", sans-serif',
              'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif')
css.write_text(t, encoding='utf-8')
print('CDN-Adressen ersetzt, Google Fonts entfernt, Schrift auf System-Stack gestellt.')
PY

pruefen
