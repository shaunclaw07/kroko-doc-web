# Paket 5 — Gemeinsames Gerüst und ein Befehl für alle Sonden

> **Vorher lesen:** `docs/plaene/00-regeln.md` — die Regeln dort gelten für jeden Schritt.
> **Braucht vorher:** besser nach Paket 1 · **Risiko:** klein · Stand der Zeilenangaben: 13.10.2026

**Ziel:** Ein Befehl fährt alle Browser-Sonden gegen die gebaute Seite; die Skripte teilen sich,
was heute jedes selbst mitbringt.

**Ausgangslage:** 14 Skripte `scripts/pruefen-*.py`. Sieben definieren ihr eigenes `pruefe`, alle
starten selbst den Browser, der Schlüssel der Einstellungen (`zahn_agent:settings:v1`) steht
achtmal unter vier Namen (`SETTINGS_KEY`, `SCHLUESSEL`, `EINSTELLUNGEN`, wörtlich). Nach einem
Feature sind zwölf Aufrufe von Hand nötig.

**Schritte**

1. **Vorher festhalten.** Bau und Vorschau starten; jede Sonde einmal fahren und die Ausgabe nach
   `$TMPDIR/sonden-vorher/<name>.log` schreiben (samt Exit-Code). Das ist der Vergleich.
2. **Gerüst.** Neu `scripts/sonde.py`: `ABLAGE`, `EINSTELLUNGEN` (die zwei Schlüssel);
   `einstellungen(tier, zaehne, **mehr)`; Klasse `Sonde` mit `pruefe(gut, text)` (Zeile `  ok    …`
   oder `  FUND  …`, **genau** dieses Format — `docs/testing.md` zählt die Zeilen), `funde` und
   `abschluss()` (druckt `Auffälligkeiten: n`, liefert den Exit-Code); `seite(browser, breite,
   hoehe, tier, zaehne, protokoll=ALLE_OFFEN, beruehrung=False)` legt Protokoll und Einstellungen
   ab und wartet auf den ersten Zahn. `freischaltung.py` bleibt und wird von dort eingebunden.
3. **Eine Sonde nach der anderen umstellen** — zuerst `pruefen-blick.py`, dann die übrigen sechs
   mit eigenem `pruefe`. Nach jeder: fahren und die Ausgabe mit „vorher“ vergleichen. Zeilen mit
   Messwerten dürfen im Wert schwanken, die **Zahl** der Zeilen `ok`, die Texte und der Exit-Code
   nicht. Sonden mit eigenem Schlusswort („ERGEBNIS: in Ordnung“) behalten es.
4. **Ein Befehl.** Neu `scripts/pruefen-alle.py <adresse>`: fährt alle Sonden nacheinander mit
   `sys.executable` (so läuft es mit und ohne `uv`), setzt `PYTHONIOENCODING=utf-8`, druckt je
   Sonde eine Zeile (Name, Exit-Code, Dauer, die Schlusszeile) und endet mit 1, wenn eine fällt.
   `pruefen-zahnsicht.py` braucht die SVGs der Zeichnungs-Sonde — der Befehl fährt vorher
   `pnpm vitest run src/render-probe.test.ts`. `pruefen-zeitgeber.cjs` (Node) gehört nicht dazu.
5. **`package.json`:** `"probes": "python scripts/pruefen-alle.py http://localhost:4322"`.
   Nicht ins Gate: die Sonden brauchen Bau, Vorschau und einen Browser.
6. **Doku:** Befehle in `AGENTS.md` („Befehle“) und `docs/testing.md` um `pnpm probes` ergänzen;
   die Einzelaufrufe bleiben stehen.

**Abnahme**

- `pnpm build && pnpm preview --port 4322`, dann `pnpm probes`: alle Zeilen Exit 0.
- Vergleich mit „vorher“: gleiche Zahl an `ok`-Zeilen je Sonde.
- **Gegenprobe:** eine Sonde absichtlich brechen (ein erwarteter Text falsch) → `pnpm probes`
  endet mit 1 und nennt sie.
- `git grep -n "settings:v1" -- scripts` zeigt nur noch `scripts/sonde.py`.

**Offen (Auftraggeber):** Sollen die Sonden auch im Workflow (`.github/workflows/pages.yml`) vor
dem Ausliefern laufen? Das kostet Laufzeit und einen Browser im Workflow; heute läuft dort nur
`pnpm gate`. Nicht Teil dieses Pakets.
