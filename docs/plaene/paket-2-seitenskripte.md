# Paket 2 — Seitenskripte in geprüfte Module

> **Vorher lesen:** `docs/plaene/00-regeln.md` — die Regeln dort gelten für jeden Schritt.
> **Braucht vorher:** — · **Risiko:** klein bis mittel · Stand der Zeilenangaben: 13.10.2026

**Ziel:** Was in den `<script>`-Blöcken der beiden Seiten steht, prüft heute kein Werkzeug (`tsc`
liest nur `src/**/*.ts`, jsdom lädt Seitenskripte nicht — in `AGENTS.md` als Falle belegt: Gate und
Bau grün, im Browser kein Zahn). Danach bauen die Seiten nur noch Adapter und rufen eine Funktion.

**Ausgangslage:** `src/pages/index.astro` Zeilen 317–487 (rund 170 Zeilen), `src/pages/statistik.astro`
Zeilen 69–186 (rund 115 Zeilen). Auffällig: `album.onPlay` benutzt `quick`, das erst 90 Zeilen
später definiert wird.

**Schritte**

1. **Einstellungsblatt.** Neu `src/presentation/game/settingsSheet.ts` mit
   `wireSettingsSheet({ doc, settings, haptics, apply })`: Spielerzahl (`#opt-players`), Modus
   (`#opt-mode`), Ton (`#opt-sound`), Vibration (`#opt-vibration`) samt dem Satz, wenn der
   Browser nicht vibrieren kann (`#vibration-hint`). Verhalten wörtlich aus `index.astro`
   Zeilen 418–451 übernehmen. Test `settingsSheet.test.ts` (jsdom): Startzustand aus den
   Einstellungen; Tipp auf eine Spielerzahl ruft `apply` mit genau dieser Änderung und setzt
   `aria-pressed`; `isSupported() === false` sperrt den Schalter und zeigt den Satz.
2. **Spielseite.** Neu `src/presentation/game/gamePage.ts` mit `wireGamePage(deps)`. `deps` sind
   **Ports und Werte**, keine Browser-Globale: `doc`, `win` (für `storage`/`pageshow`), `storage`,
   `log`, `rng`, `sound`, `haptics`, `session`, `portrait`, `remote?: RemoteLogPort`. Die Funktion
   enthält alles Übrige aus dem Seitenskript: Einstellungen laden und ein gesperrtes Tier
   zurücksetzen, Steuerung montieren, Album, Abgleich bei `storage` und `pageshow`, Sicherung,
   Blätter, Leiste, Ton-Freigabe. Reihenfolge der Verdrahtung so ordnen, dass nichts vor seiner
   Definition benutzt wird. Rückgabe: `{ controller, album, quick }` (für Tests).
3. **Test der Spielseite.** `gamePage.test.ts` (jsdom, Attrappen aus `infrastructure/testing/`):
   (a) nach `wireGamePage` stehen Zähne auf der Bühne; (b) ein gespeichertes gesperrtes Tier wird
   zum Krokodil und so gespeichert; (c) ein `storage`-Ereignis mit dem Schlüssel des Protokolls
   malt Rundennummer und Sterne neu; (d) der Knopf der Freischaltkarte wechselt das Tier **und**
   die Leiste zeigt es; (e) mit `remote` wird nach `kroko:round-finished` abgeglichen, **ohne**
   `remote` nie; (f) `pointerup` gibt den Ton frei. Das Markup für den Test aus `index.astro`
   nehmen, wie es `src/presentation/game/unlocks.test.ts` und `bedienleiste.test.ts` schon tun.
4. **`index.astro` kürzen.** Das Skript baut nur noch die Adapter (`browserStorage()`,
   `new LocalStorageRoundLog`, `new WebAudioEngine({ voiceBaseUrl: import.meta.env.BASE_URL })`,
   `new BrowserHaptics()`, `new CryptoRandom()`, `browserSessionMarks()`, bei vorhandenem Code
   `new HttpRemoteLog(...)`), ruft `requestPersistence()` und `wireGamePage`. Ziel: unter 30 Zeilen.
5. **Statistikseite.** Neu `src/presentation/stats/statsPage.ts` mit `wireStatsPage(deps)`:
   `doc`, `win`, `log`, `settings`, `backup?`, `confirm`, `download(name, text)`, `today()`.
   Test: Import hängt an und zählt die Rundennummern weiter; „keine gültigen Zeilen“ wird gesagt;
   Löschen fragt nach, leert und **ersetzt** die Sicherung (`replace([])`, nicht `sync`); ein
   `storage`-Ereignis rechnet neu. `statistik.astro` wie in Schritt 4 kürzen.
6. **Im Browser nachsehen** (die Falle aus `AGENTS.md`): Bau, Vorschau, dann `pruefen-bedienung`,
   `-freischaltung`, `-blaetter`, `-tiere`, `-offline`, `-sicherung`, `-anzeige`.

**Abnahme**

- Beide Seitenskripte unter 30 Zeilen; kein `addEventListener` und kein `getElementById` mehr darin.
- `pnpm gate` grün mit den neuen Tests; die sieben Sonden ohne Fund.
- **Gegenprobe:** in `gamePage.ts` die Zeile streichen, die nach dem Knopf der Freischaltkarte die
  Leiste neu malt → Fall (d) fällt.

**Nicht-Ziele:** das DOM-Ereignis `kroko:round-finished` ersetzen (Paket 3); der Dateiname des
CSV-Exports (`kroko-doc-runden-…`, alter Projektname) — **Offen (Auftraggeber):** umbenennen?
