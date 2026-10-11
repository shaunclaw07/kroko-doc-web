# AGENTS.md

**Zahn Agent** (technisch `zahn_agent`; bis 10.10.2026 `kroko-doc-web`, am 10.10. kurz `zahn-agent`) — das Zahn-Zufallsspiel um
das Krokodil (Spielprinzip des Spielzeugs *Crocodile Dentist* /*Kroko Doc*,
Hasbro, 1990) als Webapp: Blick von vorne oben in das offene Maul, tippen,
bis ein Zahn das Maul zuschnappen lässt. Wählbare Gebisse (Krokodil, Wolf, Mensch, Hai, Maus, Vampir),
Zahnzahl einstellbar. Dazu eine Statistikseite, die die eigenen Runden
auswertet und ehrlich sagt, wenn die Daten für eine Aussage zu dünn sind.

Dieses Dokument ist ein **Einstiegspunkt, kein Regelwerk**. Die Regeln stehen in `/docs/`.

---

## Drei Direktiven

1. **Lies vor dem Implementieren die passende Datei unter `/docs/`** — die Index-Tabelle sagt, welche.
2. **Sprache:** Code, Namen und Meldungen **englisch**; Kommentare, Doku, UI-Texte und
   Commit-Beschreibungen **deutsch**. → `docs/language-guidelines.md`
3. **Das Gate ist beides:** `pnpm typecheck` **und** `pnpm test:run`. Ein grüner Testlauf
   allein ist kein grünes Gate.

## Index

| Thema | Datei |
|---|---|
| Sprache (Englisch im Code, Deutsch in Kommentar und UI) | [`docs/language-guidelines.md`](docs/language-guidelines.md) |
| Architektur (Schichten, Importregel, Schicht-Tabelle, Fehlerarten) | [`docs/architecture.md`](docs/architecture.md) |
| Fachmodell & Dramaturgie (Runde, scharfe Zähne, Spannung, Ehrlichkeitsregeln) | [`docs/domain-model.md`](docs/domain-model.md) |
| Tests & Nachweise (Gate, Testzahlen, Sonden, Mindeststichprobe) | [`docs/testing.md`](docs/testing.md) |
| Arbeiten im Baum (Sparring vor der Planung, Befehle, Zeichnung prüfen, Doku prüfen, Git, Fallen) | [`docs/workflow.md`](docs/workflow.md) |
| Nachweisakte der Prüfläufe | [`docs/e2e-nachweise.md`](docs/e2e-nachweise.md) |
| Warum das Spiel so ist (Charter) | [`README.md`](README.md) |
| Plan, Annahmen, offene Punkte | [`docs/plan.md`](docs/plan.md) |
| Zahlen des echten Spielzeugs (Analyse-Werkzeug, Python) | `../kroko-doc/README.md` |

## Befehle

```bash
pnpm dev          # Astro-Entwicklungsserver auf http://localhost:4321 (127.0.0.1 hört nicht!)
pnpm build        # statische Ausgabe nach dist/
pnpm typecheck    # tsc --noEmit  — Teil des Gates
pnpm test:run     # vitest run    — Teil des Gates
pnpm gate         # beides nacheinander
pnpm vitest run src/render-probe.test.ts   # schreibt je Lebewesen ein SVG nach $TMPDIR/zahn_agent-artwork/
```

## Die Karte in sieben Zeilen

```
src/core/domain/       Fachregeln in Reinform — kein DOM, keine Uhr, keine Pakete
src/core/ports/        die Nähte nach außen (RandomSource, LiveTeethSelector, RoundLogPort, SoundPort, HapticsPort)
src/core/use-cases/    ein Use Case je Datei (playPress)
src/contract/          der Außenvertrag der Bedienung (nur Typen und Formate)
src/infrastructure/    die Adapter: crypto-Zufall, Web-Audio, Vibration, localStorage, Testattrappen
src/presentation/      die Bedienung: Spielsteuerung, Statistikseite, Astro-Seiten
src/presentation/game/creatures/  ein Modul je Lebewesen (Zeichnung), Registry, Fabrik
```

## Rückmeldung an den Nutzer (Ton, Vibration)

- **Anzeigen werden benannt.** Jede Zahl bekommt ihr Substantiv („Bissgefahr 34 %", „6 von 10
  gedrückt"). Ein Wert ohne Wort ist keine Aussage: der Balken sah jahrelang aus wie eine
  Fortschrittsanzeige, war aber ein Gefahrenmesser — und ein neuer Spieler konnte ihn deshalb nicht
  deuten. Füllung und Farbe dürfen **zwei verschiedene** Dinge sagen, aber beide müssen benannt sein.

- **Browser-Schnittstellen nie direkt in der Bedienung:** Ton läuft über `SoundPort`, Vibration über
  `HapticsPort` (`core/ports/haptics.ts`), umgesetzt in `infrastructure/`. Der Controller ruft
  `this.deps.haptics?.vibrate(...)` — ein `navigator`-Zugriff steht dort nicht.
- **Was der Browser nicht kann, wird gesagt:** `isSupported()` entscheidet, ob der Schalter bedienbar
  ist. Safari auf iOS kennt keine Vibration — dann ist der Griff abgeblendet und es steht ein Satz
  dabei. Ein Schalter, der still nichts tut, ist ein Fehler und kostet den Nutzer eine Fehlersuche.
- **Muster sind Absicht:** `TAP_VIBRATION_MS = 25` bei **jedem** Zahndruck — direkt aus der
  Fingerberührung heraus, ohne Verzögerung, das ist die zuverlässigste Stelle für einen Stoß —
  und `BITE_VIBRATION_PATTERN = [120, 50, 220]` beim Zuschnappen. Kurze Stöße unter ~20 ms setzen
  manche Geräte gar nicht um.
- Vibration ist ein Extra: Fehler daraus werden geschluckt, das Spiel darf davon nie anhalten.
- **Belegte Grenzen der Schnittstelle** (MDN, `Navigator.vibrate`, Stand 30.11.2025): sie verlangt
  keine Berechtigung (Chrome hat deshalb *keine* Website-Einstellung dafür) und nur „sticky user
  activation" — ein einziger früherer Fingertipp genügt. Zurückhalten können sie der Stumm- bzw.
  Nicht-stören-Modus und eine abgeschaltete Systemvibration. Safari auf iOS kennt sie nicht.
  Kein Gerät im Arbeitsumfeld: das Gefühl am Handy kann nur der Nutzer prüfen — ein Druck auf einen
  Zahn gibt die Rückmeldung sofort, er ist damit die beste Probe.

## Achtzehn Fallen, die Zeit kosten

- **Ein Blatt, in dem gestellt wird, darf sich nicht selbst schließen.** Der Neustart der Runde
  gehört zu jeder Änderung an Spielerzahl, Modus, Gebiss und Zahnzahl — aber ein Aufräumschritt, der
  dabei **alle** offenen Blätter schließt (`dialog.sheet[open]`), macht genau das Blatt zu, in dem der
  Nutzer gerade stellt (gemeldet: „wenn ich auf das Minus klicke, schließt sich das Modal"). Geschlossen
  wird nur, was der Neustart wirklich wegräumen soll (das Ergebnis-Blatt). Und beim Schließen den
  **Rückfall** für Umgebungen ohne `dialog.close` mitnehmen: jsdom kennt die Schnittstelle nicht, ein
  Aufruf ohne Prüfung wirft dort.

- **Jedes Blatt braucht einen Ausgang, der ohne Tastatur und ohne Scrollen erreichbar ist.** Ein
  `dialog` schließt von sich aus nur über die **Escape-Taste** — die hat kein Tablet. Gemessen:
  das Einstellungsblatt ist 793 px hoch, sichtbar sind auf 390 × 844 nur 692 px, ein Knopf am Fuß
  lag bei 871–919 px, also außerhalb. Deshalb: ✕ im Blattkopf (`position: sticky`, 44 × 44 px,
  bleibt auch nach dem Scrollen stehen), zusätzlich am Fuß und ein Tipp **neben** das Blatt. Für den
  Tipp daneben die **Geometrie** prüfen (`getBoundingClientRect` gegen `clientX/clientY`) — bei einem
  Dialog ist `event.target` auch der Innenabstand, „Ziel ist der Dialog" schlösse also bei jedem Tipp
  daneben im Blatt selbst.

- **Eine Kachel darf keine Klasse tragen, die die Steuerung abfragt.** Die Kopfbilder der
  Tier-Auswahl stehen **vor** der Bühne im Dokument. Trüge eine Kachel `.creature` oder `.tooth`,
  griffe `document.querySelector('.creature')` die Kachel statt der Bühne ab; und zwei gleiche
  `clipPath`-Kennungen ließen die Bühne mit dem Kopfumriss der ersten Kachel zuschneiden (das
  Spielfeld wäre kaputt, ohne dass ein Test es merkt). Deshalb `portrait(suffix)` mit eigener
  Kennung je Verwendung und Zähne als `rest-tooth` — `creatureViews.test.ts` hält beides fest.

- **Der Schichten-Wächter ist nie rot.** `src/architecture.test.ts` erzwingt die Importrichtung,
  das Verbot von `node:*` außerhalb der Infrastruktur und dass der Kern ohne `document`, `window`,
  `localStorage`, `navigator` und `new Date(` auskommt. Eine neue Mappe braucht einen Eintrag
  in `FOLDER_LAYER` — sonst schlägt der Lauf fehl.
- **Niemals `git add -A`** — explizite Pfade. Vor dem Commit `git status --short | grep '^ D'`.
- **Die Zeichnung hat zwei Wahrheiten:** Formen, Farben und Zahnprofile stehen in
  `presentation/game/creatures/<tier>.ts`, nur Zustände im CSS (`is-pressed`, `is-snapped`,
  `is-live`, `is-twitching`, `is-pressing`, `is-settling`, `is-clenching`). Geometrie (Ring,
  Schließweg, Trefferflächen) wird berechnet,
  nicht gesetzt — wer einen Wert hart einträgt, umgeht die Prüfung.
- **Exit-Code nie über eine Pipe prüfen** — `cmd | tail; echo $?` prüft `tail`.
- **Nicht `astro dev` im Hintergrund starten und dann Befehle mit Timeout > 600 s** — der
  Werkzeugaufruf wandert dann in den Hintergrund und man sieht die Ausgabe nicht mehr.
- **Eine Zufallsebene darf nichts über den Ausgang verraten.** Die Pause vor der Auflösung wird
  **unabhängig vom Ausgang** gezogen (`pressBeatMs` bekommt `willSnap` gar nicht gereicht), damit
  die Stille kein Signal ist. Der Test vergleicht beide Ausgänge bei gleichem Startwert — so eine
  Regel ist beweisbar, nicht nur behauptet.
- **Eine Kennzahl, die aufaddiert wird, sättigt — und sagt dann nichts mehr.** Die Spannung war
  `+0,18 + 0,35 × Knappheit + 0,02 × Position` und stand bei 10 Zähnen ab dem 4. Druck auf 100 %.
  Regel: Anzeigewerte aus dem Modell **ableiten** (`probabilities.ts`), nicht den Zustand
  hochzählen. Dann bleibt die Zahl eine Aussage (Biss-Wahrscheinlichkeit des nächsten Drucks,
  genau 1 beim letzten Zahn) und der Kern hat eine Wahrheit weniger.
- **Eine Test-Attrappe, die alle Wartezeiten sofort ausführt, verschluckt jeden langen Hinweis.**
  Die Attrappe der Bedienung komprimiert den Drama-Takt (`ms < 1000` läuft sofort), damit Tests
  nicht 700 ms warten müssen. Ein 4-Sekunden-Hinweis wurde dadurch im selben Moment gezeigt und
  wieder versteckt — der Test fiel aus einem Grund, der nichts mit dem Produkt zu tun hatte.
  Wer lange Wartezeiten prüft, reicht eine eigene Uhr herein und führt die Rückrufe selbst aus.
- **Ein Feature, dessen Wirkung nur am echten Tisch prüfbar ist, wird nicht heimlich gebaut.** Das
  „Weitergeben" (Zug abgeben statt drücken) sollte dem Balken einen Zweck geben. Beim Nachrechnen
  fiel auf: es verschiebt die Zugreihenfolge, die der Kern aus `pressOrder` ableitet, und ob das
  Spiel dadurch besser wird, zeigt sich erst mit zwei oder mehr Spielern an einem echten Tisch —
  meist wird allein gespielt. Also **abgesagt** und durch die kleine, prüfbare Variante ersetzt
  (`survivedDanger`, der Mut der Runde), die den Balken ebenfalls handelbar macht. Eine Absage mit
  Begründung ist ein Ergebnis, kein Versäumnis.
- **Rezepte in der Doku sind ungeprüfter Code.** Ein Befehl, der auf eine verschwundene Datei
  zeigt — oder der durchläuft und dabei nichts tut — ist schlimmer als kein Befehl. Nach jeder
  Umbenennung oder Verschiebung die Rezepte aus README, AGENTS und `docs/` einmal wirklich
  fahren und die **Ausgabe ansehen**, nicht nur den Exit-Code.

- **Zeitgeber nie am globalen `window`, und jede Steuerung wird abgehängt.** Der Herzschlag hing an
  `window.setTimeout`. Die Testumgebung baut am Ende ab und entfernt das globale Fenster, die
  Zeitgeber der Umgebung laufen aber weiter: der späte Schlag stirbt als **unbehandelter
  `ReferenceError: window is not defined`** (Jsdom-Zeitgeber nach entferntem Global, nachgestellt in
  `scripts/pruefen-zeitgeber.cjs`) und das Gate endet mit Code 1, ohne dass ein Test
  fachlich rot war — gemessen vom fremden Prüfer: 1 von 7 Läufen. Deshalb: `this.doc.defaultView`
  statt `window` (auch als Vorgabe der Wartefunktion), und `dispose()` in der Steuerung, das die
  Sonde nach **jedem** Fall aufruft. Wer den Herzschlag selbst prüfen will, reicht eine eigene Uhr
  herein (`vi.useFakeTimers()`) statt auf echte Millisekunden zu warten.

- **Ein Modell, das Sonderfälle wegfallen lässt, lügt bei kleinen Zahlen.** Die Vorhersage der
  Zuschnapp-Position ließ jedes `k` über der Zahnzahl ganz weg (`if (k > teeth) continue`). Solange
  das kleinste Gebiss 4 Zähne hatte, fiel das nie auf; seit „1 Zahn" möglich ist, zeigte die
  Statistik „Erwartet (Modell) 0,33" und einen Balken von 33 %, während Beobachtung und Gefahr-Kurve
  100 % sagten. Die Auswahl der scharfen Zähne **kappt** auf die Zahnzahl
  (`Math.min(min, teeth, MAX_LIVE_TEETH)`) — das Modell muss dasselbe tun. Gefunden hat das der
  fremde Prüfer, nicht die Tests: prüfe jede Regel auch am **Rand** ihrer neuen Grenze.

- **Eine Vorgabe, die nur für eine Beispielbreite geprüft wird, ist keine Vorgabe.** Die Trefferfläche
  eines Zahns war gegen 358 px Bühnenbreite nachgerechnet — dem „üblichen" Handy. Ein 320-px-Gerät hat
  aber 286 px Bühne, und der gezeichnete Maßstab entspricht nur 285,8 px, weil die Zeichnung im Kasten
  höhenbegrenzt ist: im Browser gemessen **42,9 px statt 44**. Der Deckel stand als feste `48` im Code.
  Jetzt wird er aus Vorgabe und **schmalster** Bühne gerechnet (`MIN_STAGE_WIDTH_PX = 285` in
  `creatures/geometry.ts`), nachgemessen 44,15 px. Und die Grenze ist benannt statt versteckt: bei 11
  und 12 Zähnen erlaubt der halbe Zahnabstand weniger (Maus bei 12 Zähnen 37,1 px) — Überdeckung wäre
  der schlechtere Tausch. Wer das Seitenpolster ändert, **messt neu**.

- **Dekoration darf keinen Tipp abfangen.** Das untere Zahnfleischband wird **nach** den unteren Zähnen
  gezeichnet und liegt damit über deren Trefferfläche. Bei Zahn 2 und 10 fiel die Mitte des
  Trefferkreises darauf, und ein Tipp dort tat **nichts** (`#hud-presses` blieb 0, Zustand `open`) —
  gefunden hat das nicht ein Nutzer, sondern `document.elementFromPoint` in der Mitte jedes
  Trefferkreises (`uv run --with playwright python scripts/pruefen-trefferflaeche.py`, siehe
  `docs/e2e-nachweise.md` §5l). Seit dem 11.10.2026 bekommen alle Ebenen der Zeichnung außer den
  Zähnen `pointer-events: none` (`presentation/styles/app.css`); `pointer-events: all` bleibt allein
  am Trefferkreis. Ein unsichtbares Element, das Tipps schluckt, ist ein Bedienfehler.

- **Eine Breite, die nur fürs Handy gedacht war, klebt auf dem Tablet am Rand.** Das
  Einstellungsblatt war `width: 100%` **mit** `max-width: 620px`; ein Dialog mit `inset: auto 0 0 0`
  und `margin: 0` wächst nach links, nicht zur Mitte — gemessen bei 1180 × 820: 0 px Luft links,
  560 px rechts, und 821 px Inhalt in einem 672 px hohen Sichtfenster (das Blatt scrollte). Ab 640 px
  steht es mittig (`inset: auto auto 1.5rem 50%` + `transform: translateX(-50%)`) und stellt in zwei
  bis vier Spalten; die Spaltenzahl kommt aus der **Breite** (`repeat(auto-fit, minmax(17rem, 1fr))`),
  nicht aus einer Geräteklasse — der Inhalt schrumpft dadurch auf 472–587 px. Nachmessen:
  `uv run --with playwright python scripts/pruefen-blattbreite.py` (erwartet: 0 Auffälligkeiten).
  Dabei gleich die nächste Falle: **eine Klassenregel verliert gegen einen Element-Klassen-Selektor**
  — `.sheet--columns { width: … }` wurde von `dialog.sheet` aus demselben Block überstimmt (0-1-1
  gegen 0-1-0) und die Breite blieb still bei 620 px, obwohl die Spalten schon griffen. Zwei Regeln
  mit demselben Ziel im selben Block immer gegeneinander prüfen.

## Ein neues Lebewesen ergänzen

1. Eintrag in `src/core/domain/creature.ts` (`id`, `name`, `teeth`, `liveTeethMin/Max`,
   `realTeeth`, `note`).
2. Kunstwerk-Modul unter `src/presentation/game/creatures/` anlegen: `body`, `holeFill`,
   `silhouette` (Kopfumriss als Pfad — dient als Beschnitt, damit beim Zuschnappen
   keine Bänder neben dem Kopf hängen),
   `inner`, `upper`/`lower` (Zahnfleischbänder), optional `upperShell` (Schnauze/Lippe),
   `upperTeeth` (Verhältnis, nicht Anzahl), `face`, `ring`, `teethProfile(count)`.
3. Eine Zeile in `ARTWORKS` (`creatures/index.ts`).
Der Test `creatureViews.test.ts` prüft danach: Zahnzahl stimmt mit dem Katalog überein, alle
Ebenen in der richtigen Reihenfolge, kein `undefined`/`NaN` im Markup, Anker innerhalb der
Bühne, und dass auch abweichende Zahnzahlen (1–12) sauber gezeichnet werden. Zeichnung ohne
Browser ansehen: `docs/workflow.md` (SVG schreiben, mit `cairosvg` rendern).

**Das App-Symbol hängt an der Zeichnung des Krokodils.** `public/favicon.svg` und
`public/icon-maskable.svg` entstehen in `src/icon.test.ts` aus `creaturePortrait('crocodile', …)`
mit den vier Regeln des Zustands „geschnappt" (geschlossenes Maul). Wer die Zeichnung des Krokodils
ändert, erzeugt das Symbol neu — sonst fällt `src/icon.test.ts` (und das ist gewollt):
`ICON_NEU=1 pnpm test:run`, dann `uv run --with cairosvg python scripts/icon-png.py`.

## Aufgaben-Tracking

Im **Hermes-`todo`-Board** (Chat-Kanban), nicht in GitHub Issues.

## Freundliche Zeichnung (für Kinder)

Das Spiel ist für ein Kind gedacht: keine schwarzen Rachen, keine Spaltpupillen, keine
riesigen Fangzähne. Regeln für neue Kunstwerke:

- Rachen in warmem Rosenrot, nicht dunkel — es muss wie ein offener Mund aussehen, nicht wie ein Loch.
- Zähne cremefarben, **rund** (Kegel mit runder Spitze), Umriss weich (`#dcd2b8`), niemals schneeweiß auf schwarz.
- Zahnfleisch ist die **hellste** Stufe im Maul, damit die Zähne davor lesbar bleiben.
- Augen: weiße Linsen mit Glanzpunkt und rosa Wangen. Der Augapfel darf einen **hellblauen
  Irisring** um die Pupille tragen (so sieht das Original-Spielzeug aus); die Pupille bleibt
  dunkelbraun als Oval — kontrastarm, nie schwarz.
- **Die Schnauze ist kein hellerer Fleck.** Beim Original ist der Kopf einfarbig, nur die Kontur
  trennt Schnauze und Kopf. Falten werden als **Rille mit Grat** gezeichnet (dunkle Linie, helle
  Linie darüber) — ein Paar gleich dicker Striche sieht wie ein Bewegungsschwung aus.
- **Jedes Element gehört auf die Fläche, für die es gezeichnet ist.** „Sichtbar über dem Kieferband"
  ist **keine** Platzierung: der Hai trug seine sechs Kiemenschlitze mitten im offenen Maul, weil sie nur
  *über* einer Ebene lagen statt *außen* am Kopf. Gegen die Ringellipse rechnen (`ring.rx`/`ring.ry` um
  `ring.cx`/`ring.cy`): was zum Kopf gehört, muss **außerhalb** liegen — und trotzdem Abstand zur
  Silhouette, zu Augen, Ohren und Flossen halten (der Hai hat dafür nur eine Zone von rund 40 px).
- Umrisse in einer dunkleren Variante der Füllfarbe (beim Krokodil `#5f8f1e` auf `#8fce33`), keine
  schwarzen Linien.
- Maul, Zähne und Gesicht werden in der Fabrik auf `silhouette` beschnitten — nichts darf
  über den Kopf hinausragen, sonst hängen beim Zuschnappen rosa Bänder daneben.

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
Die Domain gehört dem Repo über `public/CNAME`; der DNS-Eintrag liegt bei Cloudflare
(`schaflabs.com`) als CNAME auf `shaunclaw07.github.io`. Schlägt `pnpm gate` fehl, wird **nicht**
veröffentlicht — lokal grün muss also vor dem Push stehen. Manuell anstoßen geht über
`workflow_dispatch` (Actions → „Seite veroeffentlichen" → Run workflow).
