# Paket 3 — Einstellungen und Protokoll mit Anmeldung

> **Vorher lesen:** `docs/plaene/00-regeln.md` — die Regeln dort gelten für jeden Schritt.
> **Braucht vorher:** Paket 2 · **Risiko:** mittel · Stand der Zeilenangaben: 13.10.2026

**Ziel:** Niemand muss mehr daran denken, nach einer Änderung von Hand nachzumalen.

**Ausgangslage**

- Die Einstellungen sind **ein geteiltes Objekt**: `GameController.applySettings` schreibt mit
  `Object.assign(this.deps.settings, settings)` hinein, `quickControls.ts` liest dieselbe Referenz
  („dieselbe Referenz, die die Steuerung fortschreibt“), und wer von außen ändert, ruft selbst
  `quick.paint()`.
- Das Protokoll meldet sich über ein DOM-Ereignis mit altem Projektnamen
  (`kroko:round-finished`, gesendet in `gameController.ts`, gehört in `albumBadges.ts` und im
  Seitenskript) **und** über `album.paint()` / `controller.syncLog()` an drei Stellen von Hand.
- Die Bedienung holt den Typ `GameSettings` aus `infrastructure/storage/localStorageSettings.ts`.

**Schritte**

1. **Typ in den Kern.** `GameSettings` und `DEFAULT_SETTINGS` nach `src/core/domain/settings.ts`.
   `localStorageSettings.ts` führt sie von dort wieder aus (`export type { GameSettings }`), damit
   kein Aufrufer bricht; danach die Importe der Bedienung (`gameController.ts`, `quickControls.ts`,
   `creatureChoice.ts` und ihre Tests) auf den Kern umstellen. `src/architecture.test.ts` muss grün
   bleiben (der Kern darf weder `localStorage` noch `document` nennen).
2. **Speicher für Einstellungen.** Neu `src/presentation/game/settingsStore.ts`:
   `createSettingsStore(initial)` mit `get()`, `set(next)` und `subscribe(listener)`, wobei der
   Zuhörer `(next, previous)` bekommt und `subscribe` das Abmelden zurückgibt. `set` mit gleichem
   Inhalt meldet nichts. Test dazu.
3. **Steuerung hört zu.** `GameDeps.settings` und `onSettingsChange` werden zu `settings:
   SettingsStore`. Die Logik aus `applySettings` (Zeilen 565–586: Runde neu bei Modus, Spielern,
   Tier, Zahnzahl; `stopAll()` **vor** `playVoice()` beim Tierwechsel; `setMuted`) wandert in den
   Zuhörer der Steuerung; `dispose()` meldet ab. `applySettings` bleibt als dünne Hülle
   (`store.set`), bis alle Aufrufer umgestellt sind, und entfällt dann.
   `gameController.test.ts` hängt an `applySettings` und an `settings` — nur die Herstellung im
   Test (`deps`) nachziehen, keinen Fall umschreiben.
4. **Leiste und Speichern hören zu.** `wireQuickControls` meldet sich an und malt selbst;
   `apply` ruft `store.set`. Das Speichern (`saveSettings`) ist ein weiterer Zuhörer in
   `gamePage.ts`. Alle `quick.paint()`-Aufrufe außerhalb der Leiste entfallen.
5. **Protokoll meldet Änderungen.** Neu `src/presentation/game/logFeed.ts`:
   `createLogFeed()` mit `roundFinished()` (nach einem eigenen Biss) und `changedOutside()`
   (anderer Tab, Zurück-Taste, Sicherung), `subscribe(listener)` mit der Art der Änderung.
   Die Unterscheidung ist fachlich: **gefeiert wird nur nach einem eigenen Biss** (`AGENTS.md`,
   „Tiere freischalten“). Steuerung ruft `roundFinished()` statt `dispatchEvent`; `albumBadges.ts`,
   die Sicherung und die Steuerung selbst (`syncLog`) melden sich an. Das DOM-Ereignis entfällt
   (vorher prüfen: `git grep "kroko:"` — Stand heute nur `src/`, kein Skript, keine Sonde).
6. **Tests nachziehen:** `albumBadges.test.ts` und `unlocks.test.ts` lösen heute
   `new CustomEvent('kroko:round-finished')` aus — auf `feed.roundFinished()` umstellen. Neuer
   Fall in `gamePage.test.ts`: eine Änderung von außen öffnet ein Tier **still** (kein Konfetti,
   keine Karte).

**Abnahme**

- `git grep -n "kroko:" -- src` ist leer; `git grep -n "Object.assign" -- src/presentation` ebenso.
- `git grep -n "\.paint()" -- src/presentation src/pages` zeigt nur Aufrufe innerhalb des Moduls,
  dem die Anzeige gehört.
- `pnpm gate` grün; Sonden `pruefen-bedienung`, `-freischaltung`, `-sicherung`, `-tiere`,
  `-blaetter` ohne Fund.

**Risiko:** die Reihenfolge der Wirkungen beim Tierwechsel (Runde neu → `stopAll` → Stimme) und
„erst lesen, dann schreiben“ beim Protokoll. Beides ist in `gameController.test.ts` gefasst —
diese Fälle vor dem Umbau heraussuchen und nach jedem Schritt gezielt fahren.
