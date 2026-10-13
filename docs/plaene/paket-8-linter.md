# Paket 8 — Linter ins Gate

> **Vorher lesen:** `docs/plaene/00-regeln.md` — die Regeln dort gelten für jeden Schritt.
> **Braucht vorher:** Entscheidung des Auftraggebers · **Risiko:** klein · Stand der Zeilenangaben: 13.10.2026

**Ziel:** Was `tsc` und die Tests nicht sehen (ungenutzte Variablen, versehentliches `any`,
vergessene `await`, unerreichbarer Code), fällt vor dem Commit auf.

**Offen (Auftraggeber) — vor dem Bau entscheiden:**

1. **Überhaupt?** Das Projekt hält seine Abhängigkeiten bewusst klein (heute: `astro`, `vitest`,
   `jsdom`, `typescript`, `@types/node`).
2. **Welcher?** Empfehlung: **Biome**, nur zum Prüfen. Ein Paket, schnell, keine Plugin-Kette.
   Alternative: ESLint mit `typescript-eslint` — mehr Regeln (auch typgestützte wie
   „vergessenes `await`“), aber drei bis vier Pakete und mehr Einstellung.
3. **Formatieren?** Empfehlung: **nein**, vorerst. Ein Formatierer schreibt beim ersten Lauf fast
   jede Datei um; das macht `git blame` und jedes offene Paket dieser Liste unlesbar.

**Schritte** (für Biome; mit ESLint sinngemäß)

1. `pnpm add -D @biomejs/biome`; `biome.json` mit `linter.enabled: true`, `formatter.enabled:
   false`, empfohlenem Regelsatz; `files` auf `src/**`, `public/sw.js`, `worker/**` beschränken.
2. `"lint": "biome lint ."` in `package.json`. Einmal fahren und die Funde **zählen und nach Regel
   ordnen**, bevor irgendetwas geändert wird.
3. Je Regel entscheiden: beheben (echter Fund) oder mit einem Satz Begründung in `biome.json`
   abschalten (passt nicht zum Stil des Projekts — etwa Regeln gegen `!`-Zusicherungen, wenn die
   Tests sie bewusst nutzen). Keine `// biome-ignore`-Zeilen ohne Grund dahinter.
4. Beheben in kleinen Commits je Regel; nach jedem `pnpm gate`.
5. `"gate": "pnpm typecheck && pnpm lint && pnpm test:run"`. Direktive 3 in `AGENTS.md` nennt das
   Gate als „beides“ — auf drei Teile ändern; `README.md` (Tabelle der Befehle) und
   `docs/testing.md` ebenso. Der Workflow ruft `pnpm gate` und zieht von selbst nach.

**Abnahme**

- `pnpm gate` grün einschließlich `pnpm lint`; `biome.json` begründet jede abgeschaltete Regel.
- **Gegenprobe:** eine ungenutzte Variable in eine Quelldatei schreiben → `pnpm gate` fällt.
- Der Push-Workflow (`.github/workflows/pages.yml`) läuft mit dem neuen Gate durch — das zeigt
  erst der erste Push; vorher lokal `pnpm install --frozen-lockfile && pnpm gate` in einem
  frischen Klon fahren.
