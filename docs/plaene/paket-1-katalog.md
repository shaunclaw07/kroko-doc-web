# Paket 1 — Der Katalog als einzige Quelle für ein Wesen

> **Vorher lesen:** `docs/plaene/00-regeln.md` — die Regeln dort gelten für jeden Schritt.
> **Braucht vorher:** — · **Risiko:** klein · Stand der Zeilenangaben: 13.10.2026

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
