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
  synthetisiert (Web Audio). **Einzige Ausnahme** sind die Tierstimmen: zehn kurze MP3 im eigenen
  Baum (`public/sounds/voices/`), geschnitten mit `scripts/stimme-schneiden.sh` (braucht `ffmpeg`),
  jede mit Lizenzzeile in `public/sounds/voices/QUELLEN.md`.
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
uv run --with playwright python scripts/pruefen-zahnsicht.py   # liegt ein Zahn unter dem Gesicht?
```

Die Sonde schreibt außerdem jede Zahnzahl je Lebewesen nach `zahnzahlen/` im selben Verzeichnis;
`pruefen-zahnsicht.py` misst daran im Browser, ob das Gesicht einen Zahn verdeckt (erwartet:
`0 Auffälligkeiten`). Wie ein Tiermodell entsteht, steht in `docs/tiermodell-anleitung.md`.

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

## Eine Tierstimme ergänzen oder tauschen

Die Tierstimmen sind die einzigen Klänge aus Dateien: je Tier ein MP3 unter `public/sounds/voices/`.
Eine Stimme zu tauschen ist **kein Code** — neue Datei schneiden, Zeile in `QUELLEN.md` ändern. Ein
**neues** Tier braucht zusätzlich eine Zeile in `CREATURE_VOICE_FILES`.

**Was du brauchst:** `ffmpeg` und `ffprobe` im Pfad (`ffmpeg -version`; unter Windows z. B.
`scoop install ffmpeg`) und Python 3 (nur Standardbibliothek).

**1. Suchen — nur was das Spiel ausliefern darf**

```bash
python scripts/stimme-suchen.py "wolf howl" "canis lupus"   # jedes Argument ist eine eigene Suche
python scripts/stimme-suchen.py --alle "leopard growl"      # zusätzlich CC BY (verlangt Namensnennung)
```

Das Skript fragt Wikimedia Commons und zeigt nur Gemeinfreies (CC0, Public Domain): Dauer, Lizenz,
Titel, Urheber, Beschreibung und die Adresse der Dateiseite. Kein Treffer heißt: andere Wörter
probieren („roar", „roaring", der lateinische Name). Weitere gemeinfreie Quellen:

- **Tonarchiv des Yellowstone-Nationalparks** (<https://www.nps.gov/yell/learn/photosmultimedia/soundlibrary.htm>):
  „in the public domain … used without limitation", erbeten wird die Nennung „National Park
  Service". Von dort stammt der Wolf.
- **Freesound** (<https://freesound.org>) mit dem Filter „Creative Commons 0" — das Herunterladen
  braucht ein Konto.
- **Selbst aufnehmen** (Handy genügt): die sauberste Lizenz.

Nicht nehmen: CC BY-SA, CC BY-NC und alles ohne Lizenzangabe. CC BY nur nach Rücksprache — dann
gehört der Name des Urhebers ins Regeln-Blatt, nicht nur in `QUELLEN.md`.

**2. Die Dateiseite lesen — nicht nur den Titel**

Beschreibung, Kategorien und Lizenzbaustein ansehen. „Mouse in Antefasy" (CC0) war kein Quieken,
sondern das gesprochene Wort „Maus" in einem madagassischen Dialekt; verraten hat es die Kategorie
„Malagasy language". Und „Wolf howls" war ein Rudel-Chor ohne Anfang und Ende — für 1,5 Sekunden
braucht es **einen** Laut mit erkennbarem Einsatz.

**3. Die Stelle finden**

Die Aufnahme herunterladen (z. B. nach `$TMPDIR/zahn_agent-stimmen/`) und anhören. Wo der Klang
beginnt, zeigt auch `ffmpeg`:

```bash
ffmpeg -hide_banner -i "$TMPDIR/zahn_agent-stimmen/wolf.mp3" -af "silencedetect=noise=-35dB:d=0.3" -f null - 2>&1 | grep silence_
# silence_end: 3.327 …  → der Klang beginnt bei etwa 3,3 s
```

**4. Schneiden**

```bash
bash scripts/stimme-schneiden.sh <quelle> <tier> <start-sekunden> <dauer-sekunden> [ausblenden-sekunden]
bash scripts/stimme-schneiden.sh "$TMPDIR/zahn_agent-stimmen/wolf.mp3" wolf 3.45 1.5 0.5
# public/sounds/voices/wolf.mp3: 12329 Byte, Spitze vorher -25.2 dB, angehoben um 22.2 dB
```

| Argument | Bedeutung |
|---|---|
| `quelle` | die heruntergeladene Aufnahme (jedes Format, das `ffmpeg` liest) |
| `tier` | Kennung aus dem Katalog (`wolf`) — daraus wird der Dateiname |
| `start-sekunden` | Beginn des Ausschnitts; ein, zwei Zehntel **vor** dem Einsatz |
| `dauer-sekunden` | höchstens **1,5**; mehr lehnt das Skript ab |
| `ausblenden-sekunden` | Vorgabe 0,12; endet der Klang mitten im Ton (ein Heulen), eher 0,4 bis 0,5 |

Das Skript schreibt nach `public/sounds/voices/<tier>.mp3`: Mono, 44,1 kHz, MP3 mit 64 kbit/s,
ohne Metadaten, 20 ms eingeblendet, Spitze auf −3 dB angeglichen. Die Ausgabe **lesen**: „angehoben
um 22 dB" heißt, die Aufnahme war sehr leise — das Hintergrundrauschen ist dann mit angehoben.

Nachmessen (alle Dateien: Dauer und Größe):

```bash
for f in public/sounds/voices/*.mp3; do
  echo "$f $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f") s $(wc -c < "$f") Byte"
done
```

Erwartet: jede Dauer höchstens rund 1,55 s (MP3 hängt wenige Hundertstel an), jede Größe höchstens
16 000 Byte.

**5. Herkunft eintragen**

In `public/sounds/voices/QUELLEN.md` die Zeile der Datei ändern oder ergänzen: Datei · Was ·
Urheber · Lizenz · Quelle (ausgeschriebene Adresse) · Ausschnitt. Die Datei wird mit ausgeliefert.

**6. Nur bei einem neuen Tier: die Zuordnung**

In `src/infrastructure/audio/creatureVoices.ts` eine Zeile in `CREATURE_VOICE_FILES`
(`<kennung>: '<kennung>.mp3'`).

**7. Prüfen**

```bash
pnpm gate
```

`creatureVoices.test.ts` fällt, wenn ein Katalogtier keine Datei hat, eine Datei fehlt, größer als
16 000 Byte ist, nicht mit einem MP3-Rahmen beginnt oder in `QUELLEN.md` ohne Lizenz und Quelle
steht.

**8. Anhören — das kann kein Test**

`pnpm dev`, <http://localhost:4321>, das Tier wählen (es meldet sich sofort) und einmal bis zum Biss
spielen. Achten auf: erkennbar? freundlich genug für ein Kind? etwa so laut wie die anderen?
Rauschen? Einmal am Handy — tiefe Stimmen sind auf kleinen Lautsprechern kaum zu hören. Insgesamt
zu laut oder zu leise: `VOICE_GAIN` in `src/infrastructure/audio/webAudioEngine.ts` (Vorgabe 0,6;
der Biss liegt bei 0,9).

**Wie die Stimmen gespielt werden** (zum Verstehen, nicht zum Ändern): geladen wird erst nach dem
ersten Tipp und nur bei eingeschaltetem Ton; gespielt wird im selben Audio-Kontext wie alle anderen
Klänge (`SoundPort.playVoice`), beim Wählen eines anderen Tiers und 120 ms nach dem Biss. Wer ein
anderes Tier wählt, bricht vorher ab, was noch klingt. Eine Stimme, die mehr als 0,5 s nach ihrem
Anlass fertig lädt, entfällt. Nachweis: `docs/e2e-nachweise.md` §5z.

## Einen Tier-Satz ergänzen oder ändern („Wusstest du?")

Der Satz unter dem Ergebnis ist das Feld `fact` im Katalog (`src/core/domain/creature.ts`).

1. **Belegen, dann schreiben.** Die Quelle wörtlich lesen und den Satz an ihr ausrichten — nicht
   umgekehrt („immer wieder" wurde so zu „viele Male in seinem Leben").
2. Höchstens **110 Zeichen** (`MAX_FACT_LENGTH`), Punkt oder Ausrufezeichen am Ende, kein Wort
   über scharfe Zähne (`scharf`, `gefährlich`, `meist`, `häufiger`) — `creature.test.ts` prüft das.
3. Quelle mit Fundstelle und Abrufdatum in `docs/plan.md` notieren.
4. `pnpm gate`. Wer die Obergrenze anhebt oder den Ergebnis-Kasten ändert, **misst neu**:
   `python scripts/pruefen-bedienung.py` (der Server muss laufen) — der Satz entfällt heute unter
   700 px Höhe und auf Tablets quer unter 900 px, weil dort die Höhe nicht reicht (§5y).

## Skripte im Baum

Alle Skripte liegen in `scripts/`. Die Sonden brauchen den laufenden Server (`pnpm dev`) und nehmen
eine andere Adresse als Argument (z. B. die veröffentlichte Seite). Wo `uv` fehlt, tut es
`python scripts/<name>.py`, wenn `playwright` bzw. `cairosvg` im System-Python installiert sind.

| Skript | Wozu | Aufruf |
|---|---|---|
| `stimme-suchen.py` | gemeinfreie Tonaufnahmen auf Wikimedia Commons finden | `python scripts/stimme-suchen.py "wolf howl"` |
| `stimme-schneiden.sh` | eine Tierstimme schneiden und nach `public/sounds/voices/` legen (braucht `ffmpeg`) | `bash scripts/stimme-schneiden.sh <quelle> <tier> <start> <dauer> [ausblenden]` |
| `artwork-png.py` | ein Zeichnungs-SVG der Sonde in ein PNG rastern | `uv run --with cairosvg python scripts/artwork-png.py <svg> <png> [offen\|gedrueckt\|geschnappt]` |
| `galerie.py` | das README-Bild aller Gebisse bauen | Rezept oben unter „Zeichnung prüfen" |
| `icon-png.py` | das App-Symbol in die PNG-Größen für Android und iPhone rastern | `uv run --with cairosvg python scripts/icon-png.py` |
| `pruefen-bedienung.py` | Sonde: scrollt die Spielseite, verdeckt die Leiste etwas, sind die Griffe groß genug — auf acht Größen, auch nach dem Biss mit längstem Ergebnis und längstem Tier-Satz | `uv run --with playwright python scripts/pruefen-bedienung.py` |
| `pruefen-halten.py` | Sonde: Zahn halten, wegschieben, Obergrenze; Klick, Finger-Tipp und Eingabetaste zählen genau einen Zug | `uv run --with playwright python scripts/pruefen-halten.py` |
| `pruefen-anzeige.py` | Sonde: Balken, Fortschritt und Bissgefahr an den berechneten Stilen | `uv run --with playwright python scripts/pruefen-anzeige.py` |
| `pruefen-blaetter.py` | Sonde: bleiben die Blätter offen, solange man darin arbeitet | `uv run --with playwright python scripts/pruefen-blaetter.py` |
| `pruefen-blattbreite.py` | Sonde: Breite und Zustand der Blätter auf Tablets | `uv run --with playwright python scripts/pruefen-blattbreite.py` |
| `pruefen-tiere.py` | Sonde: alle Tiere mit Bild, ein Tipp wählt | `uv run --with playwright python scripts/pruefen-tiere.py` |
| `pruefen-trefferflaeche.py` | Sonde: Trefferfläche je Zahn, kein Zahn verdeckt | `uv run --with playwright python scripts/pruefen-trefferflaeche.py` |
| `pruefen-zahnsicht.py` | Sonde ohne Server: liegt ein Zahn unter dem Gesicht — jedes Tier, jede Zahnzahl, an den SVGs der Zeichnungs-Sonde; `--freiraum <tier>` zeigt, wo ein Auge Platz hat | `uv run --with playwright python scripts/pruefen-zahnsicht.py` |
| `pruefen-zeitgeber.cjs` | stellt den Zeitgeber-Fehler des Gates nach (Mechanismus, nicht Häufigkeit) | `node scripts/pruefen-zeitgeber.cjs` |
| `doku-pruefen.sh` | Doku: Code-Zäune, Fließtext im Block, alte Werte | Rezept oben unter „Doku prüfen" |
| `doku-pfade-pruefen.py` | Doku: zeigt jede genannte Pfadangabe auf eine Datei | `python3 scripts/doku-pfade-pruefen.py . README.md AGENTS.md docs/*.md` |

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
- **Windows, Git Bash:** ein Wert, der mit `/` beginnt, wird in einen Windows-Pfad umgeschrieben —
  `ASTRO_BASE=/zahn_agent pnpm build` bricht deshalb ab. Davor setzen:
  `MSYS_NO_PATHCONV=1 MSYS2_ENV_CONV_EXCL=ASTRO_BASE`.
- **Windows, Python-Ausgabe:** die Konsole spricht nicht von sich aus UTF-8; eine Sonde, die
  „×" oder „✕" druckt, stirbt mit `UnicodeEncodeError`. Davor setzen: `PYTHONIOENCODING=utf-8`.
- **Den Entwicklungsserver unter Windows beenden:** der Prozess heißt `node`; gefunden wird er über
  den Port (PowerShell: `Get-NetTCPConnection -LocalPort 4321 -State Listen`).
