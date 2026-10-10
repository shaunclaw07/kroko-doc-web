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
```

Beide Schritte liegen im Baum — kein Scratch-Verzeichnis, kein fester Pfad. Den Zustand setzt
der Rasterer wie das Stylesheet (Klassen `is-pressed`/`is-snapped`), den Schließweg als
Attribut mit dem Wert, den die App selbst ins SVG schreibt.

Rechnerische Kontrolle der Schließung: Der Oberkiefer fährt beim Zuschnappen um
`2·ry − Banddicke oben − Banddicke unten` **nach unten** (`--close-shift`, Krokodil 232,0 ·
Mensch 226,0 · Wolf 222,0 SVG-Einheiten); die Schnauze fährt einen Anteil davon mit
(`--shell-shift`, Krokodil 143,8). Beide Werte werden gerechnet und stehen im SVG — im Code
gibt es keinen festen Winkel und keinen festen Weg. Der Zahnring schließt genau, wenn sich die
Innenkanten beider Bänder treffen; das prüft `creatureViews.test.ts`.

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
