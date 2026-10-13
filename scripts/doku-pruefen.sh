#!/usr/bin/env bash
# Prueft Markdown-Doku auf die Fehler, die beim Auffrischen entstehen.
#
# Aufruf:
#   bash scripts/doku-pruefen.sh README.md AGENTS.md [weitere.md ...]
#   ALTE_WERTE="754|86 Kriterien|v9" bash scripts/doku-pruefen.sh README.md
#   ALTE_WERTE="..." ALTE_WERTE_STRIKT=1 bash scripts/doku-pruefen.sh README.md AGENTS.md
#
# ALTE_WERTE_STRIKT: ohne die Variable werden Treffer alter Werte nur GEMELDET und zaehlen nicht als
# Fund (der Exit-Code bleibt 0). Mit ALTE_WERTE_STRIKT=1 werden sie zum Fund (Exit 1) -- das gehoert
# ueber die ZAHLENDOKU (README.md, docs/testing.md). Ueber AGENTS.md, docs/workflow.md und die
# Aufzeichnungen (docs/e2e-nachweise.md) NICHT: dort stehen alte Zahlen absichtlich
# (als Lehre, im Aufruf-Beispiel) und wuerden falschen Alarm ausloesen. Genau so blieb
# "232 Tests" in der Startanleitung stehen, waehrend dieselbe Datei zweimal 234 nannte -- aufgefallen
# ist es erst einem unabhaengigen Pruefer, weil der Aufruf mit >/dev/null nur den Exit-Code ansah.
#
# Exit 0 = sauber, 1 = mindestens ein Fund. Prueft in EINEM Lauf:
#   - Zaun-Paritaet (ungerade = ein Code-Zaun verrutscht)
#   - Fliesstext/Überschrift INNERHALB eines Codeblocks (rendert als Code)
#     * In Zaeunen MIT Sprachkuerzel (```bash, ```ts ...) gelten `# ...` und `- ...`
#       als Code (Kommentar, Optionszeile) und loesen NICHT aus — sonst meldet
#       jedes Rezept mit Kommentaren falschen Alarm. `**fett**` loest immer aus.
#     * In Zaeunen OHNE Sprachkuerzel (``` oder ```text) loest alles aus.
#   - Kaestchen-Zaehlung positionsunabhaengig (gesetzt / offen)
#   - Treffer alter Werte, die noch in lebender Doku stehen koennten
set -u
[ $# -ge 1 ] || { echo "Aufruf: $0 <datei.md> [...]"; exit 2; }

fehler=0
for datei in "$@"; do
  if [ ! -f "$datei" ]; then echo "FEHLT: $datei"; fehler=1; continue; fi
  echo "== $datei"

  zaeune=$(grep -c '^[[:space:]]*```' "$datei")
  if [ $((zaeune % 2)) -ne 0 ]; then
    echo "  FEHLER: $zaeune Code-Zaeune (ungerade) - ein Zaun ist offen"
    fehler=1
  else
    echo "  Zaeune: $zaeune (paarig)"
  fi

  # Zaeune paarweise: zwischen Oeffner und Schliesser darf kein Fliesstext stehen.
  # Die Sprache des offenen Zauns entscheidet, was als Code durchgeht.
  fund=$(awk '
    /^[[:space:]]*```/ {
      if (imblock) { imblock=0; sprache=""; next }
      imblock=1; sprache=$0
      sub(/^[[:space:]]*```/, "", sprache); gsub(/[[:space:]]/, "", sprache)
      next
    }
    imblock && (/^\*\*/ || ((sprache=="" || sprache=="text") && (/^#{1,6} / || /^- /))) {
      print "  FEHLER: Zeile " NR " ist Fliesstext in einem Codeblock: " substr($0,1,70); bad=1
    }
    END{exit (bad?1:0)}
  ' "$datei")
  if [ -n "$fund" ]; then echo "$fund"; fehler=1; fi

  echo "  Kaestchen: gesetzt $(grep -o '\[[xX]\]' "$datei" | wc -l) | offen $(grep -o '\[ \]' "$datei" | wc -l)"

  if [ -n "${ALTE_WERTE:-}" ]; then
    treffer=$(grep -nE "$ALTE_WERTE" "$datei" || true)
    if [ -n "$treffer" ]; then
      if [ "${ALTE_WERTE_STRIKT:-0}" = "1" ]; then
        echo "  FEHLER: alte Werte in lebender Doku (ALTE_WERTE_STRIKT=1):"; fehler=1
      else
        echo "  ALTE WERTE (einordnen: lebende Doku vs. Aufzeichnung):"
      fi
      echo "$treffer" | sed 's/^/    /'
    fi
  fi
done
exit $fehler
