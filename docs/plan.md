# Plan: Aufräumen für die nächsten Features (acht Pakete)

Stand 13.10.2026. Anlass: die Frage des Auftraggebers, ob ein Refactoring künftige Features
einfacher und den Code sauberer macht. Die Analyse hat acht Stellen ergeben; jede ist hier ein
**Paket**, das ein Agent für sich ausführen kann. Kein Paket ändert, was ein Spieler sieht oder
hört — wo doch, steht es als „Offen (Auftraggeber)“ dabei und wird vorher gefragt.

Diese Datei ist die Arbeitsdatei (`docs/workflow.md`, „Vor der Planung“). Ein erledigtes Paket wird
hier **gestrichen**, sobald das Bleibende in der Doku steht; ist alles erledigt, wird sie geleert.

## Für den ausführenden Agenten

1. **Erst lesen:** `AGENTS.md` ganz, dazu die im Paket genannten Dateien. Die Zeilenangaben unten
   sind vom 13.10.2026 — vor dem Ändern nachsehen, ob sie noch stimmen.
2. **Ein Paket, ein Durchgang.** Die Schritte eines Pakets der Reihe nach; nach **jedem** Schritt
   `pnpm gate` (Typen **und** Tests). Rot heißt: zurück, nicht weiter.
3. **Verhalten bleibt gleich.** Bestehende Tests werden nicht umgeschrieben, um grün zu werden. Wo
   ein Test an der alten Form hängt (ein Import, ein Dateiname), wird nur diese Form nachgezogen
   und im Commit-Text genannt.
4. **Sprache:** Code, Namen, Meldungen englisch; Kommentare, Doku, UI-Texte, Commit-Texte deutsch
   (`docs/language-guidelines.md`).
5. **Was das Gate nicht sieht, prüft die gebaute Seite:** `pnpm build`, `pnpm preview --port 4322`,
   dann die im Paket genannten Sonden mit `http://localhost:4322` als Argument. Ausgabe ansehen,
   nicht nur den Exit-Code. Unter Windows: `python scripts/…` (kein `uv`), `PYTHONIOENCODING=utf-8`,
   und für `cairosvg` `C:\Program Files\GTK3-Runtime Win64\bin` in den `PATH`.
6. **Git:** nie `git add -A`, nur genannte Pfade; vor dem Commit `git status --short | grep '^ D'`.
   Ein Commit je Paket (oder je Schritt, wenn das Paket groß ist). **Kein Push ohne das Ja des
   Auftraggebers** — jeder Push auf `main` veröffentlicht.
7. **Zahlen nachziehen:** ändert sich die Testzahl, dann in `README.md` (drei Stellen) und
   `docs/testing.md`; danach `ALTE_WERTE_STRIKT=1 bash scripts/doku-pruefen.sh README.md docs/testing.md`
   und `python scripts/doku-pfade-pruefen.py . README.md AGENTS.md docs/*.md`. Die Pfadprüfung
   meldet aus **dieser** Datei die Dateien, die erst noch entstehen (Stand heute 16) — das ist
   kein Fund; in der übrigen Doku darf keiner stehen.
8. **Am Ende des Pakets:** Abschnitt „Abnahme“ Punkt für Punkt belegen, das Paket hier streichen,
   Neues an Regeln oder Fallen nach `AGENTS.md`, Nachweise nach `docs/e2e-nachweise.md`.

## Reihenfolge und Abhängigkeiten

| Paket | Inhalt | Braucht vorher | Risiko |
|---|---|---|---|
| 1 | Der Katalog als einzige Quelle für ein Wesen | — | klein |
| 2 | Seitenskripte in geprüfte Module | — | klein bis mittel |
| 3 | Einstellungen und Protokoll mit Anmeldung statt Nachmalen von Hand | 2 | mittel |
| 4 | `gameController.ts` in vier Teile | 3 | mittel |
| 5 | Gemeinsames Gerüst und ein Befehl für alle Sonden | besser nach 1 | klein |
| 6 | `app.css` nach Bauteilen aufteilen | — | klein |
| 7 | `AGENTS.md` auf den Einstieg kürzen | — | klein |
| 8 | Linter ins Gate | Entscheidung des Auftraggebers | klein |

Empfohlene Folge: 1 → 2 → 3 → 4, dann 5; 6, 7 und 8 jederzeit dazwischen.

---

## Paket 1 — Der Katalog als einzige Quelle für ein Wesen

**Ziel:** Ein neues Wesen verlangt nur noch die Stellen, die wirklich Handarbeit sind. Alles, was
sich aus dem Katalog ableiten lässt, wird abgeleitet.

**Ausgangslage** (gezählt beim Einbau von Venusfliegenfalle und T-Rex): rund 15 Stellen. Davon
sind **Kopien**, die dieses Paket beseitigt:

- `CREATURE_VOICE_FILES` in `src/infrastructure/audio/creatureVoices.ts` — je Wesen `<id>.mp3`.
- `DATIVE_NAMES` und `FEMININE` in `src/presentation/game/unlockNotice.ts`.
- Die Spaltenzahl der Tablet-Reihe: `repeat(12, …)` und `repeat(6, …)` bei `.creature-rail` in
  `src/presentation/styles/app.css`.
- Der Satz „Krokodil, Mensch und T-Rex stellen 1–3 Zähne …“ in `src/pages/index.astro`
  (von Hand geschrieben, `src/regeln.test.ts` prüft ihn gegen den Katalog).
- Vier Tierlisten in `scripts/pruefen-blick.py`, `-zoom.py`, `-tiere.py`, `-freischaltung.py`
  und die Liste in `scripts/freischaltung.py`.
- Die Namensliste im Galerie-Befehl (`AGENTS.md`, `docs/testing.md`, `docs/workflow.md`,
  Kopf von `scripts/galerie.py`).

**Bleibt Handarbeit** (kein Ziel dieses Pakets): Katalogeintrag, Zeichnungsmodul, Zeile in
`ARTWORKS`, Platz in `UNLOCK_STEPS`, Stimmdatei mit Zeile in `QUELLEN.md`, Beleg in
`docs/tier-quellen.md`, die Prosa im README. `VOICES` in `public/sw.js` bleibt eine Liste — die
Datei wird unverändert ausgeliefert und kann nichts einbinden; `src/offline.test.ts` hält sie gleich.

**Schritte**

1. **Stimmen ableiten.** In `creatureVoices.ts` wird `CREATURE_VOICE_FILES` aus `listCreatures()`
   gebaut (`Object.fromEntries`, Datei = `${id}.mp3`). Der Export bleibt, damit
   `creatureVoices.test.ts` und `offline.test.ts` unverändert gelten. Der Test „gibt jedem Tier
   des Katalogs eine Datei“ wird dadurch trivial — ihn durch einen ersetzen, der die Regel prüft
   (`voiceUrl('/', id)` endet für jedes Katalogwesen auf `/${id}.mp3`).
2. **Grammatik an den Katalogeintrag.** `CreatureDefinition` bekommt
   `grammar?: { feminine?: true; dative?: string }` (Kommentar: Name im Dativ, wo er abweicht;
   `feminine` für „zur“/„mit der“). Eintragen: `human` → `dative: 'Menschen'`, `lion` →
   `dative: 'Löwen'`, `flytrap` → `feminine: true`. `unlockNotice.ts` liest daraus
   (`getCreature(id).grammar`), `DATIVE_NAMES` und `FEMININE` entfallen. Der Test „beugt jeden
   Namen der Folge richtig“ in `src/presentation/game/unlocks.test.ts` bleibt **unverändert** und
   ist die Abnahme dieses Schritts.
3. **Namen aufzählen — eine Funktion.** `joinNames(names)` („A, B und C“) nach
   `src/presentation/game/unlockNotice.ts` (oder ein neues `names.ts` daneben) und an beiden
   heutigen Stellen verwenden: `unlockTitle` und `startList` in `index.astro`.
4. **Regeln-Satz aus dem Katalog.** In `index.astro` die Namen mit `liveTeethMax === 3` aus
   `listCreatures()` holen und mit `joinNames` einsetzen. `src/regeln.test.ts` liest heute den
   **Quelltext** der Seite und sucht darin die Namen — das geht mit einem Ausdruck nicht mehr.
   Den Fall umstellen: er prüft die Funktion, die die Namen liefert (in ein Modul mit Test legen,
   z. B. `threeLiveNames()` in `unlockNotice.ts`), und dass die Seite genau diesen Ausdruck
   einsetzt (wie `bedienleiste.test.ts` es für `{startList}` tut).
5. **Spaltenzahl aus der Anzahl.** `index.astro` setzt am `<ul id="creature-rail">` die
   Eigenschaften `--rail-columns` (Anzahl der Wesen) und `--rail-columns-tall` (die Hälfte,
   aufgerundet) als `style`; in `app.css` `repeat(var(--rail-columns), minmax(0, 1fr))` und
   `repeat(var(--rail-columns-tall), …)`. Die Querformat-Regel (`repeat(3, …)`) bleibt.
   **Messen:** `pruefen-bedienung.py` und `pruefen-freischaltung.py` — erwartet je
   `Auffälligkeiten: 0`.
6. **Eine Katalogdatei für die Sonden.** Neu: `src/katalog-json.test.ts` nach dem Muster von
   `src/icon.test.ts` — er erzeugt den erwarteten Inhalt von `scripts/katalog.json`
   (`creatures: [{id, name, teeth}]` in Katalogreihenfolge, `unlockOrder`, `unlockSteps`) und
   **fällt, wenn die Datei abweicht**; `KATALOG_NEU=1 pnpm test:run` schreibt sie neu.
   Neu: `scripts/katalog.py` lädt sie und bietet `TIERE` (Katalogreihenfolge), `FOLGE`
   (Freischaltung), `ZAEHNE` (Kennung → Zahnzahl), `LETZTE_SCHWELLE`.
7. **Sonden umstellen.** Die fünf Listen aus der Ausgangslage durch `katalog.py` ersetzen.
   `freischaltung.py`: `ALLE_OFFEN` gibt so vielen Wesen in Katalogreihenfolge drei Sterne, bis
   `LETZTE_SCHWELLE` erreicht ist — und prüft das mit einem `assert`. In `pruefen-freischaltung.py`
   wird „neun Kacheln sind gesperrt“ zu `len(FOLGE) - 3`.
8. **Galerie ohne Namensliste.** `scripts/galerie.py`: fehlen die Namen, gilt `katalog.TIERE`.
   Die Befehle in `AGENTS.md`, `docs/testing.md`, `docs/workflow.md` und im Kopf des Skripts auf
   `python scripts/galerie.py docs/bilder/gebisse.png` kürzen. Einmal fahren; das Bild muss
   byte-gleich oder sichtbar gleich bleiben (zwölf Wesen, 4 × 3).
9. **Checkliste kürzen.** „Ein neues Lebewesen ergänzen“ in `AGENTS.md` neu schreiben: was bleibt
   (siehe oben), plus `KATALOG_NEU=1 pnpm test:run`. Die Sätze über `FEMININE`, die Listen der
   Sonden und die Spaltenzahl entfallen.

**Abnahme**

- `pnpm gate` grün; Bau grün; `pruefen-bedienung`, `-freischaltung`, `-tiere`, `-blick`, `-zoom`
  ohne Fund, Zeilenzahlen wie in `docs/testing.md` (41 Zeilen `ok`, 72 Messzeilen).
- `git grep -n "sabertooth" -- scripts src/presentation/styles src/pages` liefert nur noch
  Stellen, die **ein bestimmtes** Tier meinen (ein Testfall, eine Voreinstellung), keine Liste.
- **Gegenprobe:** in `scripts/katalog.json` von Hand ein Tier streichen → `pnpm test:run` fällt.

**Nicht-Ziele:** Zeichnungsmodule vereinheitlichen; `public/sw.js` erzeugen; die README-Prosa.

---

## Paket 2 — Seitenskripte in geprüfte Module

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

---

## Paket 3 — Einstellungen und Protokoll mit Anmeldung

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

---

## Paket 4 — `gameController.ts` in vier Teile

**Ziel:** Die Steuerung führt nur noch den Ablauf einer Runde. Heute trägt sie in 765 Zeilen fünf
Aufgaben; ihr Test hat 1 127 Zeilen.

**Ausgangslage** (Methoden und Zeilen in `src/presentation/game/gameController.ts`):

| Aufgabe | Methoden |
|---|---|
| Haltegeste | `wireTeeth` 155, `canPress` 204, `releasedOnTooth` 228, `beginHold` 251, `cancelHold` 270, `releaseHold` 281 |
| Ablauf eines Drucks | `handlePress` 291, `resolvePress` 304, `startPressBeat` 350, `settle` 363, `snap` 381, `twitch` 410 |
| Effekte auf der Bühne | `markBiter` 423, `markPressed` 441, `lookAt` 451, `shake` 469, `vibrate` 482 |
| Anzeige | `render` 588 (80 Zeilen, 15 `getElementById`), `revealMeterHint` 669, `turnSentence` 686, `mutSentence` 716, `showResult` 740 |
| Protokoll | `recordRound` 510, `syncLog` 543 |

**Grundsatz:** `gameController.test.ts` bleibt das Netz und wird in diesem Paket **nicht
umgeschrieben** — jeder Schritt muss mit ihm grün sein. Neue Tests kommen für die neuen Teile dazu.

**Schritte** (jeder für sich abschließbar und einzeln zu committen)

1. **Anzeige: reines Modell.** Neu `src/presentation/game/hudModel.ts` mit
   `hudModel({ round, tension, roundNumber })` → ein Objekt aus Texten und Zuständen:
   `remaining`, `remainingLabel`, `progressText`, `tensionText`, `turnSentence`, `roundOpen`,
   `finalToothWarning`, `howToVisible`, `meterPercent`, `beatMs`, `zoom`, `tense`, `danger`.
   Alles, was `render()` heute **rechnet**, steht dort; kein `document`. Test ohne jsdom, mit den
   Randfällen aus `AGENTS.md`: bei geschlossenem Maul keine Gefahr („Runde beendet“), ein Zahn
   übrig → Einzahl, vor dem ersten Druck keine 0 %.
2. **Anzeige: Sicht.** Neu `hudView.ts` mit `createHudView(doc, stage, art)` und `apply(model)`:
   alles, was `render()` heute **setzt** (Texte, Klassen an `#hud-panel`, Variablen an der Bühne,
   `data-status`, `data-tension`). `render()` der Steuerung wird zu
   `this.hud.apply(hudModel(...))`. Die Kennungen der Elemente stehen danach an **einer** Stelle.
3. **Ergebnistexte.** `turnSentence`, `mutSentence` und der Text aus `showResult` als reine
   Funktionen nach `resultText.ts`, mit Test.
4. **Haltegeste.** Neu `holdGesture.ts`: `createHoldGesture({ doc, now, wait, canPress, feel,
   onPress, onCancel })`. Sie kennt Zeiger, Halten, Wegschieben, Obergrenze (`HOLD_MAX_MS`),
   das Anhalten von `touchstart` am gehaltenen Zahn — und sonst nichts vom Spiel. Die Steuerung
   reicht `onPress(toothId, heldMs, felt)` herein. `dispose()` hängt die Zuhörer am Dokument ab.
   Danach `scripts/pruefen-halten.py` fahren (16 Zeilen `ok`, darunter die zwei Fälle mit echter
   Berührung) — Unit-Tests sehen den Unterschied zwischen Maus und Finger nicht.
5. **Protokoll.** Neu `roundRecorder.ts`: `createRoundRecorder({ log, clock })` mit `record(round)`
   (liest unmittelbar vor dem Anhängen — die Regel „wer zurückschreibt, liest vorher“), `sync()`
   und `count()`. `clock` liefert die Zeit; heute steht `new Date()` in der Steuerung.
6. **Aufräumen.** Tote Felder und Importe der Steuerung entfernen; die Konstanten
   (`TAP_VIBRATION_MS`, `BITE_VIBRATION_PATTERN`, `HOLD_*`) ziehen zu dem Teil, der sie braucht —
   `AGENTS.md` nennt `TAP_VIBRATION_MS` und `BITE_VIBRATION_PATTERN` mit Fundort: dort nachziehen.

**Abnahme**

- `gameController.ts` unter 400 Zeilen; `render()` unter 15.
- `gameController.test.ts` unverändert grün (Ausnahme: die Herstellung der Abhängigkeiten).
- Sonden `pruefen-halten`, `-blick`, `-zoom`, `-anzeige`, `-bedienung`, `-trefferflaeche` ohne Fund.
- `src/architecture.test.ts` grün (kein neuer Ordner nötig; alle Teile liegen in `presentation/game`).

**Risiko:** Zeitgeber. Jeder verzögerte Rückruf prüft, ob seine Runde noch gilt
(`AGENTS.md`, „Ein Zeitgeber trägt die Runde, zu der er gehört“), und nach `dispose()` läuft
nichts mehr. Beim Herauslösen bleibt `wait` der Steuerung der einzige Weg zu einem Zeitgeber —
kein Teil ruft `setTimeout` selbst.

---

## Paket 5 — Gemeinsames Gerüst und ein Befehl für alle Sonden

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

---

## Paket 6 — `app.css` nach Bauteilen aufteilen

**Ziel:** 1 732 Zeilen in einer Datei werden zu Dateien je Bauteil — ohne dass sich eine einzige
berechnete Regel ändert.

**Ausgangslage:** `src/presentation/styles/app.css`, eingebunden in `src/layouts/Base.astro`
Zeile 2. Die Abschnitte sind schon markiert (`/* --- … --- */` bei den Zeilen 124, 232, 278, 450,
470, 526, 600, 928, 1110, 1245, 1345, 1429). **Zwei Leser außer dem Browser:**
`scripts/artwork-png.py` (Zeile 25: zieht Regeln mit `.creature`, `.jaw`, `.tooth`, `.mouth` aus
genau dieser Datei) und die Kommentare in `src/icon.test.ts` und `AGENTS.md`, die sie nennen.

**Schritte**

1. **Vorher festhalten:** `pnpm build`; die erzeugte Datei `dist/_astro/*.css` nach
   `$TMPDIR/css-vorher.css` kopieren. Dazu sechs Bilder: `python scripts/artwork-png.py` für
   Krokodil, Vampir und T-Rex, je `offen` und `geschnappt`.
2. **Schneiden an den Markierungen**, Reihenfolge unverändert. Vorschlag für die Dateien unter
   `src/presentation/styles/`: `base.css` (bis 123), `controls.css`, `stage.css` (beide
   Bühnen-Abschnitte), `settings-sheet.css`, `creature-grid.css`, `album.css`, `unlocks.css`,
   `hud.css`, `sheets.css`, `stats.css`, `press-beat.css`, `game-layout.css`. `app.css` enthält
   danach nur noch `@import` in **genau** dieser Reihenfolge — die Kaskade hängt daran
   (`AGENTS.md`: eine Klassenregel verlor schon einmal gegen einen Element-Klassen-Selektor
   „aus demselben Block“).
3. **Medienabfragen** bleiben dort, wo sie heute stehen — auch wenn eine Abfrage Regeln mehrerer
   Bauteile enthält. Sie zu verteilen ändert die Reihenfolge und ist nicht Teil dieses Pakets.
4. **`artwork-png.py` nachziehen:** es liest die `@import`-Liste aus `app.css` und fügt die
   Dateien in dieser Reihenfolge zusammen (eine Funktion, die auch `scripts/galerie.py` nutzt —
   die bindet `artwork-png.py` schon ein).
5. **Vergleichen:** `pnpm build`; die neue `dist/_astro/*.css` gegen `css-vorher.css` — sie muss
   **gleich** sein (der Bau fügt die Importe zusammen; weicht nur der Dateiname ab, zählt der
   Inhalt). Die sechs Bilder neu rastern und mit „vorher“ vergleichen (gleiche Bytes oder kein
   Bildpunkt Unterschied).
6. **Verweise:** `AGENTS.md` und `src/icon.test.ts` nennen `app.css` als Ort der Zustandsregeln —
   auf die neue Datei zeigen lassen.

**Abnahme**

- Der erzeugte Stil ist inhaltsgleich mit „vorher“.
- `pnpm gate` grün; `pruefen-anzeige`, `-blattbreite`, `-bedienung`, `-zoom` ohne Fund (sie messen
  berechnete Stile).
- Keine Datei unter `src/presentation/styles/` über rund 400 Zeilen.

**Nicht-Ziele:** Regeln umbenennen, zusammenfassen oder löschen; die dreifache Führung der
Zustandsregeln (Stylesheet, `src/icon.test.ts`, `scripts/artwork-png.py`) auflösen.

---

## Paket 7 — `AGENTS.md` auf den Einstieg kürzen

**Ziel:** `AGENTS.md` wird wieder, was sein dritter Absatz behauptet: „ein Einstiegspunkt, kein
Regelwerk. Die Regeln stehen in `/docs/`.“ Heute hat die Datei rund 690 Zeilen und wird in jeder
Sitzung ganz geladen.

**Ausgangslage** (Überschriften und Zeilen): Rückmeldung an den Nutzer 77 · Das geschlossene Maul
134 · Tiere freischalten 155 · Sicherung der Runden 214 · **Dreiunddreißig Fallen** 245 (die Zahl
steht fest in der Überschrift und stimmt nach jeder neuen Falle nicht mehr) · Ein neues Lebewesen
ergänzen 503 · Freundliche Zeichnung 566 · Basis-Pfad 659 · Veröffentlichen 674.

**Grundsatz:** Texte werden **verschoben, nicht umformuliert**. Jede Falle trägt Messwerte und
einen Anlass; eine „Zusammenfassung“ verlöre genau das.

**Schritte**

1. **Ziele anlegen und verschieben:**

   | Abschnitt | Wohin |
   |---|---|
   | Fallen | neu `docs/fallen.md`, Überschrift ohne Zahl („Fallen, die Zeit kosten“) |
   | Freundliche Zeichnung · Das geschlossene Maul | `docs/tiermodell-anleitung.md` (dessen Abschnitt 6 verweist heute zurück auf `AGENTS.md` — den Verweis umdrehen) |
   | Rückmeldung an den Nutzer (Ton, Vibration) | neu `docs/rueckmeldung.md` |
   | Tiere freischalten | neu `docs/freischaltung.md` |
   | Sicherung der Runden | `docs/sicherung-anleitung.md` (als erster Abschnitt „Regeln in Kürze“) |

2. **Was in `AGENTS.md` bleibt:** der Kopf, die drei Direktiven, der Index, die Befehle, die
   Karte, „Ein neues Lebewesen ergänzen“ als **kurze** Checkliste, Aufgaben-Tracking, Basis-Pfad,
   Veröffentlichen. Ziel: unter 200 Zeilen.
3. **Index erweitern:** je neue Datei eine Zeile — und eine Spalte oder ein Halbsatz „lies das,
   bevor du … änderst“ (Zeichnung → Anleitung; Ton, Vibration → Rückmeldung; Sterne, Schwellen →
   Freischaltung; `public/sw.js`, Blätter, Zeiger, Zeitgeber → Fallen).
4. **Querverweise im Baum nachziehen:** `git grep -n "AGENTS.md" -- docs README.md src scripts` —
   Stellen wie „als zehnte Falle in AGENTS.md“, „Einzelheiten in `AGENTS.md`, ‚Freundliche
   Zeichnung‘“, „Falle oben“ zeigen danach auf die neue Datei.
5. **Nichts verloren:** vor dem Verschieben die fett gesetzten Leitsätze zählen
   (`grep -c "^- \*\*" AGENTS.md`); danach muss die Summe über `AGENTS.md` und die Zieldateien
   gleich sein. Dann `python scripts/doku-pfade-pruefen.py . README.md AGENTS.md docs/*.md` und
   `bash scripts/doku-pruefen.sh AGENTS.md docs/*.md` — Ausgabe ansehen.

**Abnahme**

- `AGENTS.md` unter 200 Zeilen; keine Überschrift mit einer Zahl, die mitwachsen müsste.
- Die Zählung aus Schritt 5 stimmt; die Pfadprüfung findet keinen toten Verweis.
- Kein Quelltext geändert; `pnpm gate` trotzdem einmal fahren.

**Offen (Auftraggeber):** `AGENTS.md` wird als Projektanweisung in jede Sitzung geladen — die
Fallen sind dort heute **immer** im Blick. Nach dem Umzug liest ein Agent sie nur, wenn er dem
Index folgt (Direktive 1 verlangt das). Wer das Risiko nicht will, lässt die Fallen in
`AGENTS.md` und verschiebt nur die übrigen vier Abschnitte (bleiben rund 450 Zeilen).

---

## Paket 8 — Linter ins Gate

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
