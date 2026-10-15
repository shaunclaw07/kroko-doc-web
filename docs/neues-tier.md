# Ein neues Tier ergänzen — der ganze Weg

Von der Entscheidung bis zum Push: Infos, Zeichnung, Freischaltung, Stimme, Bild, Tests, Doku. Jeder
Schritt nennt die Datei und woran man merkt, dass er fehlt. **Durchgespielt am 15.10.2026** mit einem
Probetier („Fuchs“, eine Kopie des Wolfs) in einem Wegwerf-Arbeitsbaum: Typen und Linter blieben
grün, die Tests fielen genau an den Stellen, die unten genannt sind.

Die Einzelheiten stehen in den Fachdateien; diese Anleitung ist die **Reihenfolge** und verweist
dorthin:

| Thema | Datei |
|---|---|
| Zeichnen (Ebenen, Augen, Stil, Prüfen) | `docs/tiermodell-anleitung.md` |
| Stimme suchen, schneiden, eintragen | `docs/workflow.md`, „Eine Tierstimme ergänzen oder tauschen“ |
| Tier-Satz belegen | `docs/workflow.md`, „Einen Tier-Satz ergänzen oder ändern“, Belege in `docs/tier-quellen.md` |
| Sterne und Schwellen | `docs/freischaltung.md` |

Die Kennung im Beispiel heißt `fox`. Code und Kennungen englisch, Name, Sätze und Kommentare deutsch.

## 0. Vorher entscheiden (der Auftraggeber)

Diese Fragen sind **Entscheidungen**, keine Fakten — sie werden gefragt, nicht geraten
(`docs/workflow.md`, „Vor der Planung“):

- **Welches Tier, wie soll es wirken?** Es muss an der Silhouette erkennbar sein, nicht am Fell, und
  freundlich für ein Kind (keine dunklen Rachen, keine Spaltpupillen, keine riesigen Fangzähne).
- **Stammtier oder Bonusfigur?** Stammtiere öffnen sich ohne dritten Stern; die Bonusfiguren
  (Venusfliegenfalle, T-Rex) stehen am Ende der Folge, der T-Rex ist das letzte Ziel (`FINAL_GOAL`).
- **Platz in der Freischaltung und Schwelle** (Sterne insgesamt). Regel: höchstens 2 × die Zahl der
  vorher offenen Tiere — kein dritter Stern nötig —, außer beim letzten Ziel. Eine Schwelle wird
  **simuliert**, bevor sie festgeschrieben wird (Spieler, der zufällig wechselt). Ein Skript dafür
  liegt nicht im Baum; die bisherigen Zahlen (`unlocks.ts`: „alle offen nach 28 Runden, Median“)
  stammen aus einer Rechnung am Rand. Wer keine neue Simulation fährt, schreibt die Zahl nicht als
  Messung hin.
- **Zahl der drückbaren Zähne** (`teeth`, 1–12) und **gleichzeitig scharfe Zähne**
  (`liveTeethMin`/`liveTeethMax`, höchstens 3). Weniger Zähne heißt kürzere Runde; bei 11 und 12
  Zähnen werden die Trefferflächen auf schmalen Handys knapp (Schritt 7).

## 1. Infos sammeln und belegen

| Feld | Was | Grenze, Prüfung |
|---|---|---|
| `id` | englische Kennung, klein (`fox`) — auch der Dateiname der Zeichnung und der Stimme | eindeutig |
| `name` | deutscher Name („Fuchs“) | — |
| `shortName` | nur, wenn `name` mehr als **12 Zeichen** hat (Kachel); Sätze nennen immer `name` | `MAX_TILE_LABEL_LENGTH`, `creature.test.ts` |
| `grammar` | `dative` („Löwen“, „Menschen“), wo der Dativ abweicht; `feminine: true` für „zur“/„mit der“ | `presentation/game/unlocks.test.ts` (Schritt 7) |
| `realTeeth` | Zahnzahl des echten Tiers; `0` = gar keine Zähne (Oberfläche sagt dann „keine Zähne“) | `0` oder ≥ `teeth` |
| `note` | ein Satz für die Kurzinfo im Regeln-Blatt | nicht leer |
| `fact` | ein **belegter** Satz über das echte Tier für Kinder („Wusstest du?“) | höchstens **110 Zeichen**, Punkt oder Ausrufezeichen am Ende, kein Wort über scharfe Zähne (`scharf`, `gefährlich`, `meist`, `häufiger`) |

**Erst die Quelle lesen, dann den Satz schreiben.** Quelle mit Fundstelle und Abrufdatum in
`docs/tier-quellen.md` eintragen — eine Zeile in „Die Sätze“ und die Zahnzahl unter den Zahnzahlen.

## 2. Katalogeintrag

`src/core/domain/creature.ts`, im Feld `CREATURES`. **Ein Stammtier steht vor den Bonusfiguren**
(vor `flytrap`): Tests nehmen „die ersten N Tiere“ des Katalogs als Stammtiere.

```ts
  {
    id: 'fox',
    name: 'Fuchs',
    teeth: 12,
    liveTeethMin: 1,
    liveTeethMax: 2,
    // Rotfuchs: 42 Zähne (Quelle in docs/tier-quellen.md).
    realTeeth: 42,
    note: 'Spitze Schnauze und große Ohren: der schlaue Fuchs beißt selten zu.',
    fact: '…belegter Satz, höchstens 110 Zeichen.',
  },
```

Name, Kachel, Kurzinfo, Grammatik der Sätze, Statistikseite und die Zuordnung der Stimme
(`CREATURE_VOICE_FILES`) leiten sich daraus ab — dort wird **nichts** von Hand eingetragen.

## 3. Zeichnung

**Vorher `docs/tiermodell-anleitung.md` ganz lesen** — dort stehen die Ebenen, wohin die Augen
dürfen und warum.

1. Modul `src/presentation/game/creatures/<id>.ts` (hier `fox.ts`) anlegen, am besten ein
   ähnliches Tier als Vorlage (Hund/Fuchs → `wolf.ts`, Katze → `panther.ts`, Nager → `mouse.ts`).
   Der Vertrag steht in `creatures/types.ts` (`CreatureArtwork`):
   - `silhouette` — Kopfumriss als **ein** Pfad (Beschnitt für Maul, Zähne, Gesicht);
   - `body` — Kopf, Fell, alles was über den Umriss hinausragt (Ohrspitzen, Hut, Kragen);
   - `holeFill`, `inner` — Rachen und Zunge, warmes Rosenrot;
   - `upper`, `lower` — Zahnfleischbänder (hellste Farbe im Maul), optional `upperShell`
     (Schnauzenfläche), `shellFactor`, `upperExtra` (Nase, fährt beim Biss mit), `lowerExtra`;
   - `face` — Augen, Brauen, Wangen, **über allem**, aber nie im Zahnring;
   - `teethProfile(count)` — Form je Zahn für **jede** Zahnzahl 1–12, spiegelgleich nach der
     Zwillingsregel (Partner von Zahn i ist `count − i`);
   - `ring` — Lage des Zahnrings; `label` — Satz für den Vorleser.
   Beide Pupillen tragen `class="pupil"` und liegen in einer weißen Linse (`fill="#ffffff"`) mit
   mindestens 4 Einheiten Luft ringsum — sie folgen dem Zeiger.
2. In `src/presentation/game/creatures/index.ts` den Import und eine Zeile in `ARTWORKS`
   (`fox: foxArtwork,`). Fehlt sie, wirft die Seite „creature 'fox' has no artwork“.
3. Ansehen und messen (Rezepte in `docs/tiermodell-anleitung.md`, Abschnitte 3 und 4):

```bash
pnpm vitest run src/render-probe.test.ts                                   # SVG je Tier und Zahnzahl
uv run --with playwright python scripts/pruefen-zahnsicht.py --freiraum fox  # wo ist Platz für die Augen?
uv run --with playwright python scripts/pruefen-zahnsicht.py               # erwartet: 0 Auffälligkeiten
uv run --with cairosvg python scripts/artwork-png.py "$TMPDIR/zahn_agent-artwork/fox.svg" fox.png offen
uv run --with cairosvg python scripts/artwork-png.py "$TMPDIR/zahn_agent-artwork/fox.svg" fox-zu.png geschnappt
```

Das Bild **offen und geschnappt** ansehen: geschlossen verschwinden Oberkiefer und Schnauzenfläche,
und was sie verdeckt haben, liegt offen. Unter Windows fehlt `cairosvg` oft `libcairo-2.dll`; dann
den Browser der Sonden nehmen oder die Seite selbst ansehen (`pnpm dev`).

## 4. Freischaltung

`src/core/domain/unlocks.ts`: einen Schritt in `UNLOCK_STEPS` an der entschiedenen Stelle, mit
Schwelle (`{ creature: 'fox', stars: 17 }`). Die Schwellen steigen streng, der T-Rex bleibt der
letzte Schritt. Den Kommentar über der Folge (simulierte Rundenzahlen) nachziehen oder als nicht
neu gemessen kennzeichnen.

`scripts/freischaltung.py` (das Protokoll der Sonden, das alle Tiere öffnet) rechnet sich aus der
letzten Schwelle selbst; die `assert`-Zeile darin meldet, wenn der Katalog dafür nicht reicht.

## 5. Stimme

Rezept mit allen Befehlen: `docs/workflow.md`, „Eine Tierstimme ergänzen oder tauschen“. In Kürze:

1. Suchen — nur Gemeinfreies (CC0, Public Domain): `python scripts/stimme-suchen.py "fox bark" "vulpes vulpes"`.
   **Die Dateiseite lesen, nicht nur den Titel:** „Mouse in Antefasy“ war kein Quieken, sondern das
   gesprochene Wort „Maus“ in einem madagassischen Dialekt (Kategorie „Malagasy language“).
   Ist ein Tier stumm oder gibt es keine Aufnahme, ein ehrlicher Ersatz mit Begründung (Hai:
   Luftblasen, Venusfliegenfalle: die summende Beute, T-Rex: Alligator tiefer gelegt).
2. Schneiden: `bash scripts/stimme-schneiden.sh <quelle> fox <start> <dauer> [ausblenden]` →
   `public/sounds/voices/<id>.mp3` (höchstens 1,5 s, höchstens 16 000 Byte).
3. Eine Zeile in `public/sounds/voices/QUELLEN.md`: Datei, Was, Urheber, Lizenz, Quelle (Adresse),
   Ausschnitt.
4. `'fox.mp3'` in `VOICES` in `public/sw.js` — sonst fehlt die Stimme ohne Netz.
5. **Anhören kann nur der Auftraggeber:** erkennbar, freundlich, etwa so laut wie die anderen?

## 6. Abgeleitete Dateien neu erzeugen

```bash
KATALOG_NEU=1 pnpm test:run                                      # scripts/katalog.json für die Sonden
pnpm vitest run src/render-probe.test.ts                         # frische SVGs …
uv run --with cairosvg python scripts/galerie.py docs/bilder/gebisse.png   # … daraus das README-Bild
```

`galerie.py` liest die SVGs aus `$TMPDIR` — erst die Sonde, dann `galerie.py` im **selben**
`$TMPDIR`, sonst baut es das Bild aus alten Zeichnungen.

## 7. Tests, die bewusst angepasst werden

Diese Tests tragen feste Zahlen oder Listen und **sollen** beim neuen Tier fallen — sie zwingen zum
Hinsehen. Angepasst wird die Erwartung, nicht die Prüfung:

| Test | Was er festhält | Was zu tun ist |
|---|---|---|
| `src/core/domain/unlocks.test.ts` | Folge, Schwellen, „alle Stammtiere offen bei …“, Weg zum T-Rex (rechnet mit „die ersten N Tiere“ des Katalogs) | Folge und Schwellen eintragen, die Rechnungen in den Testnamen und Erwartungen nachziehen |
| `src/presentation/game/unlocks.test.ts` | „Noch 1 Stern bis zum …“ / „Mit dem … spielen“ für jedes Tier der Folge | die zwei Sätze des neuen Tiers eintragen — **hier zeigt sich, ob `grammar` stimmt** |
| `src/presentation/game/albumBadges.test.ts` | „0 von 12 Tieren gespielt · 0 von 36 Sternen“ | Tiere +1, Sterne +3 |
| `src/presentation/game/creatures/creatureViews.test.ts` | Liste der Zahnzahlen, bei denen ein Zahn auf 285 px unter 44 px Trefferfläche fällt | `'fox/12'` (oder was der Test meldet) eintragen und im Kommentar begründen; besser: den Ring so breit zeichnen, dass die Liste nicht wächst |

Fallen außerdem — und zeigen damit einen **vergessenen Schritt**: `creatureVoices.test.ts` (Datei
oder `QUELLEN.md`-Zeile fehlt), `offline.test.ts` (`VOICES` in `public/sw.js`),
`katalog-json.test.ts` (Schritt 6), `creatureViews.test.ts`/`gaze.test.ts` (Zeichnung: Zahnzahl,
Ebenen, Augen im Ring, Pupillen ohne Luft).

## 8. Prüfen

```bash
pnpm gate                                   # Typen, Linter, Tests
pnpm build && pnpm preview --port 4322      # im Hintergrund laufen lassen
pnpm probes                                 # alle 13 Sonden gegen die gebaute Seite
```

Für ein neues Tier zählen besonders: `pruefen-tiere` (eine Kachel mehr, Reihenfolge der Folge),
`pruefen-freischaltung` und `pruefen-bedienung` (Kacheln gleich hoch, nichts scrollt — **eine neue
Figur hat die Auswahl schon einmal gebrochen**, `docs/freischaltung.md`), `pruefen-zahnsicht`,
`pruefen-blick`, `pruefen-zoom`, `pruefen-trefferflaeche`. Dann einmal selbst spielen: Tier wählen
(es meldet sich), bis zum Biss, Satz unter dem Ergebnis lesen, am Handy.

## 9. Doku nachziehen

Die Zahl der Tiere steht an vielen Stellen als Wort („zwölf“). Finden:

```bash
git grep -n -i -E "zwölf|\b12 (Kacheln|Wesen|Tiere|Lebewesen)|Zwölf Gebisse" -- README.md AGENTS.md docs
```

Mindestens: `README.md` (Bildunterschrift der Gebisse, Liste der Kacheln, „Zwölf Gebisse“, Tabelle
der Schließwege, Zahl der Stimmen und ihre Gesamtgröße), der Kopf von `AGENTS.md` (Liste der
Gebisse), `docs/freischaltung.md` (Folge und Schwellen), `docs/tiermodell-anleitung.md` (Liste der
Augengrößen, Zahl der Zeichnungen der Sonde), `docs/testing.md` (erwartete Kacheln der Sonde).
`docs/e2e-nachweise.md` ist eine Akte — dort bleibt die alte Zahl stehen und das neue Tier bekommt
einen Eintrag. Ändert sich die Zahl der Tests, die Testzahl nachziehen (`README.md` an drei Stellen,
`docs/testing.md`). Danach:

```bash
ALTE_WERTE_STRIKT=1 bash scripts/doku-pruefen.sh README.md docs/testing.md
python scripts/doku-pfade-pruefen.py . README.md AGENTS.md docs/*.md
```

## 10. Committen und veröffentlichen

Explizite Pfade, nie `git add -A`; vor dem Commit `git status --short | grep '^ D'`. Neu im Baum
sind mindestens `src/presentation/game/creatures/<id>.ts` und `public/sounds/voices/<id>.mp3`.
`git push` fährt das Gate über `.githooks/pre-push` noch einmal; der Push auf `main` veröffentlicht
die Seite — **nur mit dem Ja des Auftraggebers**.
