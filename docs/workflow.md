# Arbeiten im Baum

## Befehle

```bash
pnpm dev            # http://127.0.0.1:4321
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
cd /opt/data/cache/scratch/kroko-render
node --input-type=module -e "const {buildCrocodile}=await import('/opt/data/home/projects/zahn_agent/src/presentation/game/crocodile.ts'); const {writeFileSync}=await import('node:fs'); writeFileSync('croc.svg', buildCrocodile(10));"
uv run --with cairosvg python render_croc.py croc.svg offen.png offen
uv run --with cairosvg python render_croc.py croc.svg geschnappt.png geschnappt
```

Rechnerische Kontrolle des Schließwinkels: Der Oberkiefer trifft bei **6,49 Grad** genau auf
die Zahnfleischlinie; im Stylesheet stehen 7 Grad, damit der Biss satt wirkt.

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
  (`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4321/`).
