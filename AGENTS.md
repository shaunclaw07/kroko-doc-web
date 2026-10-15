# AGENTS.md

**Zahn Agent** (technisch `zahn_agent`; bis 10.10.2026 `kroko-doc-web`, am 10.10. kurz `zahn-agent`) — das Zahn-Zufallsspiel um
das Krokodil (Spielprinzip des Spielzeugs *Crocodile Dentist* /*Kroko Doc*,
Hasbro, 1990) als Webapp: Blick von vorne oben in das offene Maul, tippen,
bis ein Zahn das Maul zuschnappen lässt. Wählbare Gebisse (Krokodil, Wolf, Mensch, Hai, Maus, Vampir, Panda, Löwe, Panther, Säbelzahntiger und die
Bonusfiguren Venusfliegenfalle und T-Rex),
Zahnzahl einstellbar. Dazu eine Statistikseite, die die eigenen Runden
auswertet und ehrlich sagt, wenn die Daten für eine Aussage zu dünn sind.

Dieses Dokument ist ein **Einstiegspunkt, kein Regelwerk**. Die Regeln stehen in `/docs/`.

---

## Drei Direktiven

1. **Lies vor dem Implementieren die passende Datei unter `/docs/`** — die Index-Tabelle sagt,
   welche. Und **`docs/fallen.md` vor jeder Änderung am Code**: dort steht, was schon einmal Zeit
   gekostet hat.
2. **Sprache:** Code, Namen und Meldungen **englisch**; Kommentare, Doku, UI-Texte und
   Commit-Beschreibungen **deutsch**. → `docs/language-guidelines.md`
3. **Das Gate ist dreierlei:** `pnpm typecheck`, `pnpm lint` **und** `pnpm test:run`. Ein grüner
   Testlauf allein ist kein grünes Gate. **Fällt es — auch vor dem Push (`.githooks/pre-push`) —,
   wird der Fund im Code behoben**, neu gefahren und erst dann committet bzw. gepusht. Nur mit dem
   Ja des Auftraggebers: `git push --no-verify`, eine Regel in `biome.jsonc` abschalten, eine
   `// biome-ignore`-Zeile, einen Test lockern. → `docs/testing.md`, „Wenn der Linter etwas findet“

## Index

| Thema | Datei | Lies das, bevor du … |
|---|---|---|
| Sprache (Englisch im Code, Deutsch in Kommentar und UI) | [`docs/language-guidelines.md`](docs/language-guidelines.md) | Code, Kommentar oder UI-Text schreibst |
| Architektur (Schichten, Importregel, Schicht-Tabelle, Fehlerarten) | [`docs/architecture.md`](docs/architecture.md) | ein Modul anlegst oder eine Schichtgrenze überschreitest |
| Fachmodell & Dramaturgie (Runde, scharfe Zähne, Spannung, Ehrlichkeitsregeln) | [`docs/domain-model.md`](docs/domain-model.md) | eine Regel der Runde, der Spannung oder der Auswertung änderst |
| **Fallen, die Zeit kosten** (jede mit Anlass, Messwert und Gegenprobe) | [`docs/fallen.md`](docs/fallen.md) | **irgendetwas am Code änderst** |
| Ein Tiermodell zeichnen (Ebenen, Zahnring als Sperrgebiet, Augen setzen, Stil, Prüfreihenfolge) | [`docs/tiermodell-anleitung.md`](docs/tiermodell-anleitung.md) | ein Lebewesen zeichnest oder eine Zeichnung änderst |
| Rückmeldung an den Nutzer (Ton, Vibration, benannte Anzeigen) | [`docs/rueckmeldung.md`](docs/rueckmeldung.md) | Ton, Vibration oder eine Anzeige anfasst |
| Freischaltung der Tiere (Sterne, Schwellen, Bonusfiguren) | [`docs/freischaltung.md`](docs/freischaltung.md) | an Sternen, Schwellen oder `UNLOCK_STEPS` drehst |
| Tests & Nachweise (Gate, Testzahlen, Sonden, Mindeststichprobe) | [`docs/testing.md`](docs/testing.md) | einen Test oder eine Sonde ergänzt |
| Arbeiten im Baum (Sparring vor der Planung, Befehle, Zeichnung prüfen, Doku prüfen, Git) | [`docs/workflow.md`](docs/workflow.md) | planst, baust, prüfst oder committest |
| Tierstimmen ergänzen oder tauschen, Tier-Sätze, alle Skripte | [`docs/workflow.md`](docs/workflow.md) | eine Stimme oder ein Skript änderst |
| Herkunft und Lizenz der Tierstimmen | [`public/sounds/voices/QUELLEN.md`](public/sounds/voices/QUELLEN.md) | eine Stimme auslieferst |
| Spielstand sichern, wenn das Gerät ihn wegwirft (Regeln in Kürze, Anleitung zum Nachbauen, auch für andere Projekte) | [`docs/sicherung-anleitung.md`](docs/sicherung-anleitung.md) | am Worker, am Abgleich oder an `public/sw.js` arbeitest |
| Nachweisakte der Prüfläufe | [`docs/e2e-nachweise.md`](docs/e2e-nachweise.md) | einen Nachweis behauptest |
| Warum das Spiel so ist (Charter) | [`README.md`](README.md) | eine Regel des Spiels in Frage stellst |
| Belege der Tier-Sätze und Zahnzahlen | [`docs/tier-quellen.md`](docs/tier-quellen.md) | einen `fact` oder eine Zahnzahl einträgst |
| Arbeitsdatei: Plan des gerade laufenden Features (sonst leer) | [`docs/plan.md`](docs/plan.md) | ein Feature beginnst |
| Zahlen des echten Spielzeugs (Analyse-Werkzeug, Python) | `../kroko-doc/README.md` | mit dem echten Spielzeug vergleichst |

## Befehle

```bash
pnpm dev          # Astro-Entwicklungsserver auf http://localhost:4321 (127.0.0.1 hört nicht!)
pnpm build        # statische Ausgabe nach dist/
pnpm typecheck    # tsc --noEmit  — Teil des Gates
pnpm lint         # biome lint --error-on-warnings .  — Teil des Gates (auch Warnungen fallen)
pnpm test:run     # vitest run    — Teil des Gates
pnpm gate         # alle drei nacheinander
pnpm probes       # alle 13 Browser-Sonden gegen http://localhost:4322 fahren (Server muss laufen)
pnpm vitest run src/render-probe.test.ts   # schreibt je Lebewesen ein SVG nach $TMPDIR/zahn_agent-artwork/
uv run --with playwright python scripts/pruefen-zahnsicht.py   # danach: liegt ein Zahn unter dem Gesicht?
uv run --with playwright python scripts/pruefen-halten.py      # Halten, Wegschieben, Obergrenze (Server muss laufen)
uv run --with playwright python scripts/pruefen-blick.py       # Blick, Linsen-Grenze, Zittern (Server muss laufen)
uv run --with playwright python scripts/pruefen-zoom.py        # voller Zoom: bleibt jeder Zahn erreichbar? (Server muss laufen)
pnpm build && pnpm preview --port 4322                         # der Service Worker läuft nur im Bau …
uv run --with playwright python scripts/pruefen-offline.py     # … danach: startet die Seite ohne Netz?
uv run --with playwright python scripts/pruefen-sicherung.py   # … und: überstehen die Runden ein geleertes Profil?
uv run --with playwright python scripts/pruefen-freischaltung.py  # … und: öffnen sich die Tiere über Sterne?
uv run --with cairosvg python scripts/galerie.py docs/bilder/gebisse.png  # README-Bild der Gebisse
python scripts/stimme-suchen.py "wolf howl"                                # gemeinfreie Aufnahmen finden
bash scripts/stimme-schneiden.sh <quelle> <tier> <start> <dauer> [ausblenden]  # Stimme schneiden (ffmpeg)
```

## Die Karte in sieben Zeilen

```
src/core/domain/       Fachregeln in Reinform — kein DOM, keine Uhr, keine Pakete
src/core/ports/        die Nähte nach außen (RandomSource, LiveTeethSelector, RoundLogPort, RemoteLogPort, SoundPort, HapticsPort)
src/core/use-cases/    ein Use Case je Datei (playPress, syncRoundLog)
src/contract/          der Außenvertrag der Bedienung (nur Typen und Formate)
src/infrastructure/    die Adapter: crypto-Zufall, Web-Audio, Vibration, localStorage, Testattrappen
src/presentation/      die Bedienung: Spielsteuerung, Statistikseite, Astro-Seiten
src/presentation/game/creatures/  ein Modul je Lebewesen (Zeichnung), Registry, Fabrik
```

## Ein neues Lebewesen ergänzen

1. Eintrag in `src/core/domain/creature.ts` (`id`, `name`, optional `shortName` bei mehr als zwölf
   Zeichen, optional `grammar` mit `dative`/`feminine`, `teeth`, `liveTeethMin/Max`, `realTeeth`,
   `note`, `fact` — ein **belegter** Satz über das echte Tier, höchstens 110 Zeichen, ohne ein Wort
   über scharfe Zähne; die Quelle gehört in `docs/tier-quellen.md`). Hat das Vorbild gar keine Zähne,
   ist `realTeeth` 0 — die Kurzinfo sagt dann „keine Zähne“.
2. Kunstwerk-Modul unter `src/presentation/game/creatures/` anlegen (vorher
   `docs/tiermodell-anleitung.md` lesen — dort steht, wohin die Augen dürfen): `body`, `holeFill`,
   `silhouette` (Kopfumriss als Pfad — dient als Beschnitt, damit beim Zuschnappen
   keine Bänder neben dem Kopf hängen),
   `inner`, `upper`/`lower` (Zahnfleischbänder), optional `upperShell` (Schnauze/Lippe),
   `upperTeeth` (Verhältnis, nicht Anzahl), `face`, `ring`, `teethProfile(count)`.
   Die beiden Pupillen tragen `class="pupil"` und liegen in einer weißen Linse (`fill="#ffffff"`) mit
   mindestens 4 Einheiten Luft ringsum — sie folgen dem Zeiger (`creatures/gaze.ts`); `gaze.test.ts`
   fällt sonst.
3. Eine Zeile in `ARTWORKS` (`creatures/index.ts`).
   Und ein **Platz in der Freischaltung** (`UNLOCK_STEPS` in `core/domain/unlocks.ts`, mit Schwelle)
   — `unlocks.test.ts` fällt, solange ein Katalogtier weder am Start noch in der Folge steht. Die
   Schwelle darf keinen dritten Stern brauchen (höchstens 2 × offene Tiere davor) — außer beim
   letzten Ziel (`FINAL_GOAL`, heute der T-Rex).
   Danach `KATALOG_NEU=1 pnpm test:run`, um `scripts/katalog.json` für die Sonden nachzuziehen.
4. Das README-Bild der Gebisse neu bauen (`scripts/galerie.py`, Rezept in `docs/workflow.md`) — sonst
   zeigt es den Stand von gestern, während die Bildunterschrift das neue Tier schon nennt.
5. Eine Stimme: Aufnahme mit freier Lizenz suchen, mit `scripts/stimme-schneiden.sh` nach
   `public/sounds/voices/<id>.mp3` schneiden, in `public/sounds/voices/QUELLEN.md` Urheber, Lizenz
   und Quelle nennen und in `VOICES` in `public/sw.js` eintragen — ohne Datei oder Lizenzzeile fällt
   `creatureVoices.test.ts`, ohne Vorrat `offline.test.ts`.
   **Vorher die Dateiseite lesen, nicht nur den Titel:** „Mouse in Antefasy“ war kein Quieken,
   sondern das gesprochene Wort „Maus“ in einem madagassischen Dialekt (Kategorie „Malagasy
   language“). Und anhören kann eine Stimme nur der Auftraggeber.
Der Test `creatureViews.test.ts` prüft danach: Zahnzahl stimmt mit dem Katalog überein, alle
Ebenen in der richtigen Reihenfolge, kein `undefined`/`NaN` im Markup, Anker innerhalb der
Bühne, dass auch abweichende Zahnzahlen (1–12) sauber gezeichnet werden und dass keine runde
Gesichtsform in den Zahnring ragt. Pfade (Brauen, Schnurrhaare) misst nur die Sonde:
`uv run --with playwright python scripts/pruefen-zahnsicht.py`. Zeichnung ohne
Browser ansehen: `docs/workflow.md` (SVG schreiben, mit `cairosvg` rendern).

**Das App-Symbol hängt an der Zeichnung des Krokodils.** `public/favicon.svg` und
`public/icon-maskable.svg` entstehen in `src/icon.test.ts` aus `creaturePortrait('crocodile', …)`
mit den Regeln des Zustands „geschnappt" (geschlossenes Maul; seit dem 13.10.2026 gehört dazu,
dass Oberkiefer und Schnauzenfläche verschwinden). Wer die Zeichnung des Krokodils
ändert, erzeugt das Symbol neu — sonst fällt `src/icon.test.ts` (und das ist gewollt):
`ICON_NEU=1 pnpm test:run`, dann `uv run --with cairosvg python scripts/icon-png.py`. Lässt sich
cairosvg nicht laden (unter Windows fehlt ihm oft `libcairo-2.dll`), rastert dasselbe Skript mit
dem Browser der Sonden: `python scripts/icon-png.py`.

**Auch das Zeichen im Kopfbereich hängt an dieser Zeichnung.** Beide Seiten (`src/pages/index.astro`,
`src/pages/statistik.astro`) zeigen dort `public/logo.svg` — **dieselbe Datei** wie das App-Symbol,
von derselben Sonde erzeugt und geprüft. Vorher stand dort ein eigenes, von Hand gezeichnetes
Krokodil-SVG (dunkelgrün `#2f6b4f`/`#1c4531`), das mit der Zeichnung des Spiels nichts zu tun hatte;
gemeldet hat das der Auftraggeber („Das logo neben Zahn Agent ganz oben auf der Seite ist noch so ein
altes Krokodil, kannst du das austauschen mir dem Icon was du gemacht hast"). **Ein zweites Bild
desselben Tiers neben der geprüften Zeichnung ist eine zweite Wahrheit** — also die Datei
wiederverwenden statt neu malen; ein Test verbietet die alten Farben im Kopfbereich.

## Aufgaben-Tracking

Im **Hermes-`todo`-Board** (Chat-Kanban), nicht in GitHub Issues.

## Basis-Pfad (lokal vs. eigene Domain)

Die Seite liegt lokal **und** veröffentlicht unter `/`: lokal `http://localhost:4321`,
veröffentlicht unter <https://zahn-agent.schaflabs.com/> (eigene Domain; bis zum 11.10.2026
Projektseite unter `/zahn_agent/`). Deshalb gilt für jeden internen Verweis (Link, Icon,
Manifest, Laufzeit-Abruf):

- **Immer `import.meta.env.BASE_URL` verwenden**, nie absolut mit `"/"` — das hält die Seite
  auch dann heil, wenn sie doch wieder unter einem Unterpfad läuft.
- `ASTRO_BASE` ist der **Notausgang** für einen Unterpfad und wird in `astro.config.mjs` auf einen
  Schluss-Schrägstrich normalisiert (sonst entsteht `/zahn_agentstatistik`); ohne die Variable
  ist der Basis-Pfad `/`, und genau so baut der Workflow.
- Nach Änderungen an Verweisen `pnpm build` fahren und im erzeugten `dist/index.html` **nachsehen**,
  welche Adressen drinstehen (erwartet: `/statistik`, `/_astro/…`, `/favicon.svg`).

## Veröffentlichen

Jeder Push auf `main` löst [`.github/workflows/pages.yml`](.github/workflows/pages.yml) aus:
installieren → `pnpm gate` → `pnpm build` → ausliefern auf <https://zahn-agent.schaflabs.com/>.
Lokal hält schon `.githooks/pre-push` den Push mit `pnpm gate` auf (eingehängt bei `pnpm install`).
Die Domain gehört dem Repo über `public/CNAME`; der DNS-Eintrag liegt bei Cloudflare
(`schaflabs.com`) als CNAME auf `shaunclaw07.github.io`. Schlägt `pnpm gate` fehl, wird **nicht**
veröffentlicht — lokal grün muss also vor dem Push stehen. Manuell anstoßen geht über
`workflow_dispatch` (Actions → „Seite veroeffentlichen" → Run workflow).
