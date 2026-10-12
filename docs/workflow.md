# Arbeiten im Baum

## Befehle

```bash
pnpm dev            # http://localhost:4321 (127.0.0.1 hört nicht)
pnpm build          # statisch nach dist/
pnpm typecheck      # tsc --noEmit
pnpm test:run       # vitest run
pnpm gate           # typecheck + tests
```

## Umgebung

- Node 26, pnpm 12, Astro 5, vitest 3, jsdom 30 als Testumgebung.
- **Keine externen Schriften, Bilder, CDNs.** Die Zeichnung ist SVG-Markup, die Klänge sind
  synthetisiert (Web Audio).
- `pnpm` blockiert Installationsskripte. **pnpm 12 liest das `pnpm`-Feld in `package.json`
  nicht mehr** — die Erlaubnis steht als Zuordnung `allowBuilds` in `pnpm-workspace.yaml`
  (hier `esbuild: true`, `sharp: true`). Neue native Abhängigkeiten dort eintragen, sonst
  bricht `pnpm install` mit `ERR_PNPM_IGNORED_BUILDS` ab. Die Form nicht raten:
  `pnpm approve-builds --all` schreibt sie selbst.
- Tests mit DOM brauchen den Kopfkommentar `// @vitest-environment jsdom` in der Testdatei.

## Zeichnung prüfen (ohne Browser)

```bash
pnpm vitest run src/render-probe.test.ts                     # je Lebewesen ein SVG
uv run --with cairosvg python scripts/artwork-png.py \
  "$TMPDIR/zahn_agent-artwork/wolf.svg" wolf.png geschnappt   # auch offen | gedrueckt
uv run --with cairosvg python scripts/galerie.py docs/bilder/gebisse.png \
  crocodile wolf human shark mouse vampire panda lion panther sabertooth  # README-Bild aus allen zehn
```

Beide Schritte liegen im Baum — kein Scratch-Verzeichnis, kein fester Pfad. Den Zustand setzt
der Rasterer wie das Stylesheet (Klassen `is-pressed`/`is-snapped`), den Schließweg als
Attribut mit dem Wert, den die App selbst ins SVG schreibt.

Rechnerische Kontrolle der Schließung: Der Oberkiefer fährt beim Zuschnappen um
`2·ry − Banddicke oben − Banddicke unten` **nach unten** (`--close-shift`, Krokodil 232,0 ·
Mensch 226,0 · Wolf 222,0 · Löwe 222,0 · Säbelzahntiger 222,0 · Panther 220,0 · Panda 220,0
SVG-Einheiten); die Schnauze fährt einen Anteil davon mit
(`--shell-shift`, Krokodil 143,8). Beide Werte werden gerechnet und stehen im SVG — im Code
gibt es keinen festen Winkel und keinen festen Weg. Der Zahnring schließt genau, wenn sich die
Innenkanten beider Bänder treffen; das prüft `creatureViews.test.ts`.

## Doku prüfen (nach jeder Änderung an Doku, Zahlen oder Rezepten)

```bash
# Zahlendoku scharf: hier ist jeder alte Wert ein Fehler
ALT="196|2,29 s|Drei Gebisse|232 Tests|Acht Gebisse|acht Kacheln|vier breite Backenzähne|2,1–2,5 s|293 Tests"
ALTE_WERTE="$ALT" ALTE_WERTE_STRIKT=1 bash scripts/doku-pruefen.sh README.md docs/testing.md
# Regeln, Rezepte und Aufzeichnungen meldend: dort stehen alte Werte absichtlich als Lehre
ALTE_WERTE="$ALT" bash scripts/doku-pruefen.sh AGENTS.md docs/workflow.md docs/plan.md docs/e2e-nachweise.md
python3 scripts/doku-pfade-pruefen.py . README.md AGENTS.md docs/*.md
```

Der erste prüft Zaun-Parität, Fließtext in Codeblöcken und zählt Kästchen; mit `ALTE_WERTE=…` findet er
zusätzlich noch stehende alte Werte. **`ALTE_WERTE_STRIKT=1` macht Treffer zum Fund (Exit 1)** — das
gehört nur über die **Zahlendoku** (`README.md`, `docs/testing.md`): in `AGENTS.md`, in diesem Rezept
und in den Aufzeichnungen stehen alte Zahlen absichtlich (als Lehre, im Aufruf-Beispiel, im Plan) und
würden falschen Alarm auslösen. Ohne den Schalter **meldet** der Lauf Treffer nur und der Exit-Code
bleibt 0 — genau so blieb „232 Tests" in der Startanleitung stehen, während dieselbe Datei zweimal 234
nannte; aufgefallen ist es erst einem unabhängigen Prüfer. Der zweite hält jede in Backticks genannte
Pfadangabe gegen das Dateisystem — eine Doku, die auf eine verschwundene Datei zeigt, fällt durch
keine Zahlenprüfung auf.

Ein Treffer **außerhalb der Zahlendoku** ist eine Kandidatenliste, kein Fehler: die Ausgabe wird
angesehen und eingeordnet (Kommentarzeilen in Bash-Blöcken sind zum Beispiel korrekt).

## Vor der Planung: das Sparring (`grill-me`)

**Kein Plan ohne Sparring.** Bevor etwas geplant oder gebaut wird, wird die Idee gegrillt — allein
oder gemeinsam mit dem Nutzer, aber immer **vor** der Planungsphase:

- **Zusammen (der Normalfall):** eine Frage nach der anderen, jede mit einer **Empfehlung**; die
  Antwort des Nutzers entscheidet. Mehrere Fragen auf einmal sind verwirrend.
- **Allein** (wenn der Nutzer die Entscheidungen abgibt — „entscheide nach deinem Ermessen"): dieselben
  Fragen, aber jede Antwort mit einer **nachgeschlagenen Tatsache** aus dem Baum statt einer Vermutung.
  Die Entscheidungen samt Grund gehören anschließend in `docs/plan.md`; Abgesagtes mit Begründung —
  eine Absage ist ein Ergebnis, kein Versäumnis.
- **Fakten werden nachgeschlagen, nicht gefragt.** Was im Baum steht (Zahlen, Verträge, Grenzen,
  Protokollfelder), wird gelesen; gefragt wird nur, was eine **Entscheidung** ist.
- Erst danach beginnt die Planungsphase: Plan in `docs/plan.md`, dann umsetzen.

Warum als eigener Schritt: in einer Runde wurden so acht Fragen entschieden — zwei Dinge gebaut, sechs
begründet gelassen und eines (das „Weitergeben") **vor** dem Bau abgesagt, statt nachher einen
fertigen Umbau zu verwerfen.

## Eine Fähigkeit ergänzen

1. Regel oder Rechnung in `core/domain/` — **eine** Datei, **eine** Verantwortung.
2. Port nur anlegen, wenn eine neue Naht nötig ist.
3. Ablauf in `core/use-cases/`, wenn mehrere Regeln zusammenspielen.
4. Bedienung in `presentation/` erweitern; neue Mappe → Eintrag in `FOLDER_LAYER`
   (`src/architecture.test.ts`).
5. **Nachweis**: Test im passenden Verzeichnis, Gate grün, Zahl in `docs/testing.md` nachziehen.

## Git

- **Direkte Commits auf `main`** — keine Branches, keine Pull Requests.
- **Niemals `git add -A`** — immer explizite Pfade. Vor dem Commit:
  ```bash
  git status --short | grep '^ D'   # Löschkontrolle
  git status --short
  ```
- Erst committen, wenn `pnpm gate` grün ist.

## Fallen

- Exit-Code nie über eine Pipe prüfen.
- Vite/Astro-Entwicklungsserver im Hintergrund: Prozess über `readlink /proc/<pid>/exe`
  identifizieren, nicht über den Namen.
- `astro dev` läuft weiter und hält Port 4321 — vor einem neuen Lauf prüfen
  (`curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/`).
