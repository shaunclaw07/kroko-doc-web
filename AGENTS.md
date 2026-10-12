# AGENTS.md

**Zahn Agent** (technisch `zahn_agent`; bis 10.10.2026 `kroko-doc-web`, am 10.10. kurz `zahn-agent`) — das Zahn-Zufallsspiel um
das Krokodil (Spielprinzip des Spielzeugs *Crocodile Dentist* /*Kroko Doc*,
Hasbro, 1990) als Webapp: Blick von vorne oben in das offene Maul, tippen,
bis ein Zahn das Maul zuschnappen lässt. Wählbare Gebisse (Krokodil, Wolf, Mensch, Hai, Maus, Vampir, Panda, Löwe, Panther, Säbelzahntiger),
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
| Ein Tiermodell zeichnen (Ebenen, Zahnring als Sperrgebiet, Augen setzen, Prüfreihenfolge) | [`docs/tiermodell-anleitung.md`](docs/tiermodell-anleitung.md) |
| Tests & Nachweise (Gate, Testzahlen, Sonden, Mindeststichprobe) | [`docs/testing.md`](docs/testing.md) |
| Arbeiten im Baum (Sparring vor der Planung, Befehle, Zeichnung prüfen, Doku prüfen, Git, Fallen) | [`docs/workflow.md`](docs/workflow.md) |
| Tierstimmen ergänzen oder tauschen, Tier-Sätze, alle Skripte | [`docs/workflow.md`](docs/workflow.md) |
| Herkunft und Lizenz der Tierstimmen | [`public/sounds/voices/QUELLEN.md`](public/sounds/voices/QUELLEN.md) |
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
uv run --with playwright python scripts/pruefen-zahnsicht.py   # danach: liegt ein Zahn unter dem Gesicht?
uv run --with playwright python scripts/pruefen-halten.py      # Halten, Wegschieben, Obergrenze (Server muss laufen)
uv run --with playwright python scripts/pruefen-blick.py       # Blick, Linsen-Grenze, Zittern (Server muss laufen)
uv run --with playwright python scripts/pruefen-zoom.py        # voller Zoom: bleibt jeder Zahn erreichbar? (Server muss laufen)
uv run --with cairosvg python scripts/galerie.py docs/bilder/gebisse.png \
  crocodile wolf human shark mouse vampire panda lion panther sabertooth   # README-Bild der Gebisse
python scripts/stimme-suchen.py "wolf howl"                                # gemeinfreie Aufnahmen finden
bash scripts/stimme-schneiden.sh <quelle> <tier> <start> <dauer> [ausblenden]  # Stimme schneiden (ffmpeg)
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
  Fingerberührung heraus (seit dem Halten: beim **Auflegen** des Fingers, nicht beim Loslassen),
  ohne Verzögerung, das ist die zuverlässigste Stelle für einen Stoß —
  und `BITE_VIBRATION_PATTERN = [120, 50, 220]` beim Zuschnappen. Kurze Stöße unter ~20 ms setzen
  manche Geräte gar nicht um.
- Vibration ist ein Extra: Fehler daraus werden geschluckt, das Spiel darf davon nie anhalten.
- **Belegte Grenzen der Schnittstelle** (MDN, `Navigator.vibrate`, Stand 30.11.2025): sie verlangt
  keine Berechtigung (Chrome hat deshalb *keine* Website-Einstellung dafür) und nur „sticky user
  activation" — ein einziger früherer Fingertipp genügt. Zurückhalten können sie der Stumm- bzw.
  Nicht-stören-Modus und eine abgeschaltete Systemvibration. Safari auf iOS kennt sie nicht.
  Kein Gerät im Arbeitsumfeld: das Gefühl am Handy kann nur der Nutzer prüfen — ein Druck auf einen
  Zahn gibt die Rückmeldung sofort, er ist damit die beste Probe.
- **Tierstimmen sind Dateien — die einzigen.** Je Tier ein MP3 von höchstens 1,5 s unter
  `public/sounds/voices/`, jede mit Urheber, Lizenz und Quelle in `QUELLEN.md` daneben (ein Test
  liefert keine Datei ohne diese Zeile aus). Alle Spielklänge bleiben synthetisiert. Gespielt wird
  über `SoundPort.playVoice(creatureId)` im **selben** Audio-Kontext (`decodeAudioData`), nicht
  über ein `<audio>`-Element — so gelten Ton-Schalter, Freigabe und `stopAll()` ohne zweite Regel.
  Anlässe: beim Wählen eines **anderen** Tiers und 120 ms nach dem Biss; nie vor einem Urteil, nie
  bei einem harmlosen Zahn — die Stimme darf nichts verraten. Der Tierwechsel ruft `stopAll()`,
  **bevor** das neue Tier sich meldet (danach schnitte er genau die neue Stimme ab). Geladen wird
  erst nach der ersten Geste und nur bei eingeschaltetem Ton; eine Stimme, die mehr als 0,5 s zu
  spät kommt, entfällt. Adressen nur über den Basis-Pfad (`voiceBaseUrl: import.meta.env.BASE_URL`).
  **Wie etwas klingt, kann ich nicht prüfen** — Ausschnitt, Lautstärke und Rauschen hört nur der
  Auftraggeber. Rezept: `docs/workflow.md`, „Eine Tierstimme ergänzen oder tauschen".
- **Vor der ersten Nutzergeste plant der Ton nichts.** Der Browser hält einen Audio-Kontext an, bis
  der Nutzer etwas tut; seine Uhr steht so lange, und alles, was in dieser Zeit geplant wird, startet
  beim Freigeben **gleichzeitig**. Der frühere Herzschlag lief ab Seitenstart: nach 20 s Leerlauf
  lagen 50 Schläge übereinander (gemessen am 12.10.2026 mit angehaltenem Kontext: Spitzenpegel 6,6
  statt 0,26). Deshalb: `play()` tut vor `unlock()` nichts, und `unlock()` bittet bei **jeder** Geste
  um Freigabe, solange der Kontext nicht läuft (iOS hält ihn nach einem Anruf wieder an). **Den
  Herzschlag gibt es seit dem 12.10.2026 nicht mehr** (vom Auftraggeber abgewählt); seitdem
  wiederholt sich kein Klang mehr von selbst. Wer wieder einen einführt, lässt ihn ausfallen,
  solange der Kontext nicht `running` ist.

## Zweiunddreißig Fallen, die Zeit kosten

- **Eine Geste, die mit der Maus geprüft ist, ist am Finger nicht geprüft.** Das Halten eines Zahns
  bestand alle Fälle der Sonde — mit Maus und mit einem Finger-Tipp ohne Weg. Ein Finger, der beim
  Halten wackelt, ist für den Browser aber der Anfang eines Wischens: nach rund 10 px kam
  `pointercancel`, der Zahn federte zurück und der Druck zählte nicht (gemessen am 12.10.2026 mit
  echter Berührung über `Input.dispatchTouchEvent`: 14 px Weg auf 65 px Trefferfläche, kein Zug —
  obwohl die Seite gar nicht scrollte). `touch-action: none` am Zahn hilft **nicht**: Chromium
  wertet es an Teilen einer SVG-Zeichnung nicht aus (der berechnete Stil sagt `none`, das Verhalten
  bleibt). Deshalb hält die Steuerung `touchstart` des **gehaltenen** Zahns an (`preventDefault`,
  nicht passiv). Wer eine Zeigergeste baut, die länger dauert als ein Tipp, prüft sie mit
  Berührung **und** Weg (`scripts/pruefen-halten.py`, Fälle 8 und 9).

- **Das Gesicht liegt über den Zähnen — der Zahnring ist für Augen und Wangen Sperrgebiet.** Die
  Gesichtsebene wird zuletzt gemalt, und die Augen saßen bei allen zehn Tieren auf dem Ring. Welcher
  Zahn darunter rutscht, hängt an der Zahnzahl: gemessen am 12.10.2026 für jede Zahl von 1 bis 12
  deckte der Augenfleck des Pandas bei 11 Zähnen einen Zahn zu 100 %, das Auge des Hais bei 8 Zähnen
  82 %, das des Krokodils im Standard 43 % (gemeldet: „öfters mal der eine oder andere Zahn verdeckt
  von den Augen"). Kein Test sah es — sie prüfen Markup, nicht Deckung, und die Bilder der Sonde
  zeigen nur die Standard-Zahnzahl. Seitdem liegen alle runden Gesichtsformen außerhalb der
  Ringellipse (`creatureViews.test.ts`), und `scripts/pruefen-zahnsicht.py` misst die Deckung für
  jede Zahnzahl im Browser (erwartet: 0 Auffälligkeiten). Anleitung: `docs/tiermodell-anleitung.md`.

- **Ein gespiegelter Teilpfad in der Silhouette schneidet Löcher ins Gesicht.** Die Silhouette ist
  ein `clipPath`, dort gilt die **Nonzero**-Regel: wer ein Ohr zeichnet, indem er die Koordinaten
  des anderen Ohrs spiegelt, kehrt damit auch die **Laufrichtung** des Pfades um. Im
  Überlappungsbereich von Kopf und Ohr heben sich die Windungen dann auf und alles dort wird
  weggeschnitten — dem Panther fehlte im ersten Entwurf das rechte Auge (im gerasterten PNG
  gemessen: Pixel (470,166) war Fellfarbe statt Weiß, links dagegen korrekt). Teilpfade einer
  Silhouette immer **gleichsinnig** laufen lassen: die Spiegelung notiert man rückwärts durchlaufen
  (letzten Punkt zuerst). Die runden Ohren der anderen Tiere sind Bogensegmente in gleicher
  Richtung — deshalb fiel die Falle dort nie auf.

- **Ein Blatt, in dem gestellt wird, darf sich nicht selbst schließen.** Der Neustart der Runde
  gehört zu jeder Änderung an Spielerzahl, Modus, Gebiss und Zahnzahl — aber ein Aufräumschritt, der
  dabei **alle** offenen Blätter schließt (`dialog.sheet[open]`), macht genau das Blatt zu, in dem der
  Nutzer gerade stellt (gemeldet: „wenn ich auf das Minus klicke, schließt sich das Modal"). Geschlossen
  wird nur, was der Neustart wirklich wegräumen soll (damals das Ergebnis-Blatt; seit dem
  12.10.2026 steht das Ergebnis auf der Seite und der Neustart blendet es aus). Und beim Schließen den
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
  `presentation/game/creatures/<tier>.ts`, nur Zustände im CSS (`is-held`, `is-pressed`, `is-snapped`,
  `is-live`, `is-twitching`, `is-pressing`, `is-settling`, `is-clenching`, `is-wary`, `is-trembling`). Geometrie (Ring,
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

- **Zeitgeber nie am globalen `window`, und jede Steuerung wird abgehängt.** Der Herzschlag (seit dem 12.10.2026 entfernt) hing an
  `window.setTimeout`. Die Testumgebung baut am Ende ab und entfernt das globale Fenster, die
  Zeitgeber der Umgebung laufen aber weiter: der späte Schlag stirbt als **unbehandelter
  `ReferenceError: window is not defined`** (Jsdom-Zeitgeber nach entferntem Global, nachgestellt in
  `scripts/pruefen-zeitgeber.cjs`) und das Gate endet mit Code 1, ohne dass ein Test
  fachlich rot war — gemessen vom fremden Prüfer: 1 von 7 Läufen. Deshalb: `this.doc.defaultView`
  statt `window` (auch als Vorgabe der Wartefunktion), und `dispose()` in der Steuerung, das die
  Sonde nach **jedem** Fall aufruft. Wer eine Wartezeit der Steuerung selbst prüfen will, reicht eine eigene Uhr
  herein (`vi.useFakeTimers()`) statt auf echte Millisekunden zu warten.

- **Ein Modell, das Sonderfälle wegfallen lässt, lügt bei kleinen Zahlen.** Die Vorhersage der
  Zuschnapp-Position ließ jedes `k` über der Zahnzahl ganz weg (`if (k > teeth) continue`). Solange
  das kleinste Gebiss 4 Zähne hatte, fiel das nie auf; seit „1 Zahn" möglich ist, zeigte die
  Statistik „Erwartet (Modell) 0,33" und einen Balken von 33 %, während Beobachtung und Gefahr-Kurve
  100 % sagten. Die Auswahl der scharfen Zähne **kappt** auf die Zahnzahl
  (`Math.min(min, teeth, MAX_LIVE_TEETH)`) — das Modell muss dasselbe tun. Gefunden hat das der
  fremde Prüfer, nicht die Tests: prüfe jede Regel auch am **Rand** ihrer neuen Grenze.
  **Und zum zweiten Mal dieselbe Falle** (12.10.2026): das Kappen allein genügte nicht. Die Auswahl
  kappt die **Grenzen** und zieht dann gleichverteilt, das Modell zog erst und kappte dann — bei
  2 Zähnen und Grenzen 1–3 zeigte die Anzeige 83,3 % Bissgefahr, gezogen wurde mit 75,0 %. Seitdem
  gibt es **eine** Rechenstelle für beide (`liveCountRange` in `core/domain/teeth.ts`), und ein Test
  vergleicht Anzeige und Auswahl für **jede** Zahnzahl von 1 bis 12 statt für Beispielwerte.

- **Eine Vorgabe, die nur für eine Beispielbreite geprüft wird, ist keine Vorgabe.** Die Trefferfläche
  eines Zahns war gegen 358 px Bühnenbreite nachgerechnet — dem „üblichen" Handy. Ein 320-px-Gerät hat
  aber 286 px Bühne, und der gezeichnete Maßstab entspricht nur 285,8 px, weil die Zeichnung im Kasten
  höhenbegrenzt ist: im Browser gemessen **42,9 px statt 44**. Der Deckel stand als feste `48` im Code.
  Jetzt wird er aus Vorgabe und **schmalster** Bühne gerechnet (`MIN_STAGE_WIDTH_PX = 285` in
  `creatures/geometry.ts`), nachgemessen 44,15 px. Und die Grenze ist benannt statt versteckt: bei 11
  und 12 Zähnen erlaubt der halbe Zahnabstand weniger (Maus bei 12 Zähnen 37,1 px) — Überdeckung wäre
  der schlechtere Tausch. Wer das Seitenpolster ändert, **messt neu**. Dasselbe gilt für den Zoom bei
  Rot (`#croc-mount`, höchstens 8 %): `scripts/pruefen-zoom.py` misst ihn auf 320, 390 und 820 px für
  jedes Tier.

- **Eine Zustandsklasse muss den Kasten enthalten, den sie färbt.** Der Balken liegt **außerhalb**
  der Bühne (`.stage`), seine Zustandsklassen hingen aber an der Bühne: `is-danger` war gesetzt, und
  keine der vier Farbregeln erreichte den Balken — bei 100 % Bissgefahr blieb seine Füllung grün→gold,
  der Text daneben gold statt rot (im echten Browser an den **berechneten** Stilen gemessen,
  `scripts/pruefen-anzeige.py`; jsdom rechnet kein CSS, deshalb sahen die Unit-Tests nichts). Seitdem
  hängen `is-tense`/`is-danger`/`is-snapped` am Kasten `#hud-panel`, der Balken, Zeile und Hinweis
  **enthält** — und ein Test prüft die **Struktur** (`meter.closest('.tension-panel')`), weil jsdom
  die Farben nicht rechnen kann.

- **Eine Anzeige muss verstummen, wenn ihre Frage wegfällt.** Beim Zuschnappen blieb der letzte
  Gefahrwert stehen (dort ist er genau 1) und die Anzeige behauptete „Bissgefahr 100 %", während
  daneben „Maul zu" stand — gemeldet als „Bissgefahr 100 % obwohl der Mund zu ist". Bei
  geschlossenem Maul gibt es keinen nächsten Druck, also steht dort jetzt „Runde beendet", die
  Füllung bleibt der Fortschritt und trägt keine Gefahrfarbe. Wer eine Kennzahl anzeigt, muss auch
  festlegen, was bei **Wegfall** ihrer Grundlage dasteht.

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
- **Kein `transform` auf einem modalen `dialog`, wenn dort ein Knopf erreichbar bleiben muss.** Die
  Mitte des Blattes kam aus `left: 50%` + `translateX(-50%)`. Ein `transform` ist die Stelle, an der
  ein Browser Fläche und Zeichnung unterschiedlich rechnen kann — dann trifft der Tipp nicht das
  gezeichnete ✕. Mitten ohne Umrechnung: `inset: auto 0 1.5rem 0` plus `margin: 0 auto` (nachgemessen:
  Abweichung von der Fenstermitte 0 px). Und einen Rückweg **nie** von einer einzigen Zustellung
  abhängig machen: „Tipp neben das Blatt" entscheidet auch am Dokument, nicht nur am Dialog
  (`event.target` ist dort der Dialog; die öffnenden Knöpfe sind ausgenommen).
- **Ein `display` in einer Autoren-Regel hebt `dialog:not([open]) { display: none }` der Browser-Regel
  auf.** Das Einstellungsblatt war auf jedem Tablet **schon beim Laden sichtbar und ließ sich nicht
  schließen** (gemeldet; gemessen beim Laden vor jedem Tipp: 1180 px → `display: grid`, 1132 × 525
  sichtbar, `open = false`; 390 px → `display: none`). Ursache: `dialog.sheet.sheet--columns
  { display: grid }` — Autoren-Regeln schlagen Browser-Regeln unabhängig von der Spezifität, also
  stand das **geschlossene** Blatt im Raster auf dem Schirm. Schließen war unmöglich, weil `close()`
  bei einem geschlossenen Dialog nichts tut. Rasterregeln für ein Blatt gehören deshalb an `[open]`
  (`dialog.sheet.sheet--columns[open]`), und die Sonde prüft den Zustand **vor** dem ersten Tipp
  (`scripts/pruefen-blattbreite.py`, erwartet in jeder Zeile `beim Laden none`).

- **Eine `.test.ts` in `src/pages/` bricht den Bau.** Astro baut jede Datei in `src/pages/` als
  eigene Seite; ein Test dort wird zum Seitenmodul, importiert `vitest` und lässt `pnpm build` mit
  „Vitest failed to access its internal state" abbrechen, während `pnpm test` grün bleibt. Tests,
  die das Seiten-Markup prüfen, liegen **neben** `src/pages/`, z. B. `src/auswahl.test.ts`.

- **Ein Auswahlblatt wählt mit dem Tipp und schließt sich — und trägt dann kein „Abbrechen".**
  Die Tier-Auswahl war bewusst eine Vorschau (`pending` + „Damit spielen"), damit die Kurzinfo
  lesbar bleibt; der Auftraggeber hat das überstimmt („Man muss sonst immer erst nochmal
  bestätigen … das nervt"). Seit dem 12.10.2026 übernimmt ein Tipp die Wahl sofort und schließt
  **nur** dieses Blatt (seit dem Umbau der Spielseite öffnet es sich von dort; die Kurzinfo steht
  im Regeln-Blatt). Wer eine Wahl sofort gelten lässt, muss die Knöpfe umbenennen: „Abbrechen" wäre eine Lüge
  — dort steht „Fertig".

- **„Daneben" ist keine Frage der Koordinaten allein.** Die Regel „Tipp neben das Blatt schließt
  es" verglich nur `clientX/clientY` mit dem Kasten. Drei Fehler kamen daher (gemessen am
  12.10.2026): ein Klick per **Tastatur** trägt (0, 0) und galt als daneben — Enter auf „−" schloss
  das Einstellungsblatt; ein Tipp auf eine Kachel des **oberen** Blatts lag neben dem unteren und
  schloss es mit (Tablet: Auswahlblatt ab y 160, Einstellungsblatt ab y 413); und ein Tipp auf die
  Bühne nach dem Biss wischte das Ergebnis weg. Seitdem steht die Regel in
  `presentation/game/sheets.ts` — nur Zeigerklicks (`detail > 0`), nur das **oberste** Blatt,
  entschieden in der **Einfangphase** (bevor ein Knopf sein Blatt schließt). Seitenskripte in
  `.astro` lädt jsdom nicht: Bedienlogik gehört in ein Modul mit Test, das Skript verdrahtet nur.
  Nachmessen: `uv run --with playwright python scripts/pruefen-blaetter.py`.

- **Ein Test gegen ein Modell gilt nur für Daten aus diesem Modell.** Die Statistik warf alle Runden
  zusammen (Zahnzahl = Maximum, Tier und Modus aus der ersten Runde). 300 **faire** Runden aus
  Krokodil, Maus und Wolf ergaben „Verlierer-Zähne auffällig ungleich verteilt" (p = 6e-13) und
  „Das Zugmodell passt nicht" (p = 1e-5) — die Maus hat eben keine Zähne 7 bis 12. Seit dem
  12.10.2026 teilt `groupRounds` das Protokoll nach Lebewesen, Zahnzahl und Modus, und der Test dazu
  spielt **faire Runden mit den echten Regeln** (`infrastructure/testing/fairRounds.ts`): wer prüfen
  will, ob eine Auswertung zu Unrecht Alarm schlägt, braucht faire Daten, keine ausgedachten.
  Dieselbe Regel im Kleinen: „Druck-Position gegen Gleichverteilung" war im Originalmodell **immer**
  rot, weil die Position dort gewollt nicht gleichverteilt ist.

- **Wer eine Ablage zurückschreibt, liest sie vorher.** Die Steuerung lud das Protokoll einmal beim
  Seitenstart und schrieb beim Biss **ihre** Liste zurück. Die Statistikseite ändert dieselbe Ablage
  (löschen, CSV-Import): mit zwei Tabs gemessen am 12.10.2026 waren nach dem nächsten Biss drei
  gelöschte Runden wieder da und fünf importierte weg — ohne Fehlermeldung. Seitdem liest
  `recordRound()` unmittelbar vor dem Anhängen, und die Seite gleicht bei `storage` (anderer Tab)
  und `pageshow` mit `persisted` (Zurück-Taste) ab. Ein Zwischenstand im Arbeitsspeicher ist eine
  Kopie für die Anzeige, nie die Wahrheit. Und was von außen kommt (CSV, Ablage), geht durch
  `isPlausibleRecord`, bevor die Auswertung damit rechnet.
  **Die Kehrseite, bei der Durchsicht am 12.10.2026 gefunden:** wer vor jedem Schreiben liest,
  hängt an allem, was das Lesen liefert. Scheitert ein Schreiben (volle Ablage), käme der alte Stand
  zurück und jede Runde seither ginge verloren — bis zum nächsten Erfolg gilt deshalb der
  Arbeitsspeicher. Und „Löschen" muss auch die früheren Schlüssel räumen, sonst übernimmt das
  nächste Lesen sie erneut und die gelöschten Runden sind wieder da.

- **Ein Zeitgeber trägt die Runde, zu der er gehört.** Das Urteil eines Drucks kommt nach der Pause
  — startet in dieser Pause eine neue Runde („Neue Runde", eine Einstellung), traf es die **neue**:
  das Maul stand geschlossen über einer offenen Runde, deren Zähne sich weiter drücken ließen.
  `handlePress` merkt sich den Rundenstand und die Rückrufe laufen ins Leere, wenn er nicht mehr
  gilt. Jeder verzögerte Rückruf prüft, ob sein Anlass noch besteht.

- **Was oft gebraucht wird, gehört nicht hinter ein Blatt.** Tier, Zahnzahl und „Neue Runde" lagen
  hinter dem Zahnrad: gemessen am 12.10.2026 vier Tipps für ein anderes Tier, drei für die Zahnzahl,
  und das Blatt scrollte auf jedem Handy (821 px Inhalt in 466–750 px). Seitdem stehen sie in der
  Leiste der Spielseite; das Zahnrad trägt nur, was je **Sitzung** gestellt wird. Nachmessen:
  `uv run --with playwright python scripts/pruefen-bedienung.py` (erwartet: 0 Auffälligkeiten).
  Wer einen Griff ergänzt, fragt zuerst: je Runde oder je Sitzung?

## Ein neues Lebewesen ergänzen

1. Eintrag in `src/core/domain/creature.ts` (`id`, `name`, `teeth`, `liveTeethMin/Max`,
   `realTeeth`, `note`, `fact` — ein **belegter** Satz über das echte Tier, höchstens 110 Zeichen,
   ohne ein Wort über scharfe Zähne; die Quelle gehört in `docs/plan.md`).
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
4. Das README-Bild der Gebisse neu bauen (`scripts/galerie.py`, Rezept in `docs/workflow.md`) — sonst
   zeigt es den Stand von gestern, während die Bildunterschrift das neue Tier schon nennt.
5. Eine Stimme: Aufnahme mit freier Lizenz suchen, mit `scripts/stimme-schneiden.sh` nach
   `public/sounds/voices/<id>.mp3` schneiden, in `CREATURE_VOICE_FILES`
   (`infrastructure/audio/creatureVoices.ts`) eintragen und in `public/sounds/voices/QUELLEN.md`
   Urheber, Lizenz und Quelle nennen — ohne Datei oder Lizenzzeile fällt `creatureVoices.test.ts`.
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
mit den vier Regeln des Zustands „geschnappt" (geschlossenes Maul). Wer die Zeichnung des Krokodils
ändert, erzeugt das Symbol neu — sonst fällt `src/icon.test.ts` (und das ist gewollt):
`ICON_NEU=1 pnpm test:run`, dann `uv run --with cairosvg python scripts/icon-png.py`.

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

## Freundliche Zeichnung (für Kinder)

Das Spiel ist für ein Kind gedacht: keine schwarzen Rachen, keine Spaltpupillen, keine
riesigen Fangzähne. Regeln für neue Kunstwerke:

- Rachen in warmem Rosenrot, nicht dunkel — es muss wie ein offener Mund aussehen, nicht wie ein Loch.
- Zähne cremefarben, **rund** (Kegel mit runder Spitze), Umriss weich (`#dcd2b8`), niemals schneeweiß auf schwarz.
- Zahnfleisch ist die **hellste** Stufe im Maul, damit die Zähne davor lesbar bleiben.
- **Eine Katze erkennt man an den Ohren, nicht am Fell.** Der Panther trug zuerst die runden Ohren
  des Pandas und las damit wie eine **schwarze Maus** (gemeldet vom Auftraggeber, 11.10.2026).
  Katzenohren sind Dreiecke mit runder Spitze, nach außen gekippt; der Fuß liegt im Kopfumriss und
  ist dort unsichtbar, nur die Spitze steht heraus. Dazu **Schnurrhaare** in dem schmalen
  Fellstreifen neben dem Maul (auf fast schwarzem Fell brauchen sie einen mittleren Grauton).
  Wer ein neues Tier zeichnet: erst die **Silhouette** unverwechselbar machen, dann das Fell.
- **Zubehör gehört in die Körperebene.** Ein Hut (oder eine Brille) ragt über den Kopfumriss hinaus —
  der Gesichtsbereich wird aber auf die Silhouette beschnitten (`factory.ts`, `mouthLayers`), dort
  wäre die Krone abgeschnitten. Der **Mensch** trägt seinen rostroten Filzhut deshalb in `body`. In
  die Silhouette gehört er nur, wenn ein Maulteil ihn erreicht; dann gilt die Gleichsinnigkeit
  (Falle oben).
- **Wer ist gemeint?** „Genau wie der Mensch … könnte man dem einen Hut anziehen" heißt *der Mensch*.
  Ich hatte den Hut auf den Panther gesetzt (der Satz nannte beide), und der Nutzer musste
  widersprechen. Bei „dem einen"/„dem anderen" in einer Nachricht mit **zwei** genannten Wesen:
  nachfragen, statt zu raten.
- **Was über der Schnauzenfläche liegen soll, gehört in den Gesichtsbereich.** Die Schnauzenfläche
  (`upperShell`) wird in der **Mundebene** über die Körperebene gemalt — beim Menschen in derselben
  Hautfarbe. Zubehör in `body` verschwindet darunter: die erste Haarfassung war im gerasterten Bild
  unsichtbar (mit einer Farbkarte gemessen lag unter der Krempe bis y 110 nur Haut), obwohl der Pfad
  korrekt im SVG stand. Der Hut bleibt trotzdem in `body`, weil seine Krone über den Umriss
  hinausragt und der Gesichtsbereich beschnitten wird. Also: **Hut in `body`, Haare in `face`** —
  je nachdem, was die Form braucht, und immer im gerasterten Bild nachsehen.
- **Was über den Umriss hinausragen soll, gehört in die Körperebene — sonst schneidet der Beschnitt
  es ab.** Die Ohren des Vampirs standen im Gesichtsbereich, und im gerasterten Bild fehlten ihre
  Spitzen: die Spitze lag bei x 52, der Umriss bei y 116 aber erst bei x 110 — **58 px Ohren** schnitt
  die Kontur weg. Gemessen, nicht am Code gesehen. Die **Gegenprobe ist billig**: das
  Unterschieds-Rechteck zweier Rasterungen darf nur die geänderten Bereiche umfassen (der
  Zuschnapp-Zustand des Vampirs änderte sich nur in x 24…616, y 111…396 — Kragen, Ohren, Monokel —,
  die Maulmitte unten `(320,430)` blieb Pixel für Pixel gleich `(106,27,41)`).
- **Der Stehkragen liegt in `body`, das Monokel in `face` — je nachdem, wer obenauf gehört.** Ein
  Kragen, den man *hinter* dem Kopf trägt, muss in der Körperebene stehen (im Beschnitt wäre er
  abgeschnitten, und der Kopf soll seine Innenkante verdecken); ein Monokel sitzt *auf* dem Auge und
  bleibt innerhalb des Umrisses, gehört also über die Mundebene. Dieselbe Überlegung wie bei Hut
  (`body`) und Haaren (`face`) des Menschen.
- **Gleiche Rezeptur, gleiches Tier.** Ein Kreis mit rosa Innenkreis *ist* die Maus: der
  Säbelzahntiger trug dieselbe Form (Kreis r 44, rosa Kreis r 20), nur etwas kleiner — im
  Vierervergleich der Köpfe (Maus, Panther, Säbelzahntiger, Löwe) war er nicht zu unterscheiden, und
  der Auftraggeber hat genau das gelesen. Köpfe unterscheiden sich über **Größe, Form und
  Innenfarbe zusammen**: kleinere ovale Ohren (30 × 28) mit **dunkler** Innenfläche (`#b78243`) sind
  Katzentier, große runde Kreise mit Rosa sind Maus. Maus und Löwe dürfen `#e8a0ae` behalten,
  solange Form und Größe deutlich abweichen.
- **Ein Fleck gehört dorthin, wo Fell ist — und er muss dort auch wirklich gezeichnet werden.**
  Die Smilodon-Flecken sitzen als vierzehn Rosetten (Ring mit hellem Kern) nur im freien
  Fellstreifen; im gerasterten Bild geprüft: Kern an der Position da, Ring über 72 Winkelgrade
  abgetastet (alle vierzehn nachgewiesen, die vier am Fellrand zu 58–66 von 72 Grad, weil der
  Kopfumriss sie anschneidet). Zwei Anläufe waren vorher falsch: **auf dem Ohr** (die Ohrenfläche
  wird in der Körperebene *nach* den Flecken gezeichnet und deckte ihn zu — im Bild nicht zu finden)
  und **auf der Stirn mit r 12/r 8** (der freie Fellstreifen ist dort nur rund 26 px breit, der Ring
  lief über die Schnauzenkante; jetzt r 6).
- **Die Doku-Prüfung nie mit `>/dev/null` laufen lassen.** `scripts/doku-pruefen.sh` meldet Treffer
  alter Werte und **zählt sie nicht als Fund**, solange `ALTE_WERTE_STRIKT=1` fehlt — der Exit-Code
  bleibt 0. So blieb „232 Tests grün" in der Startanleitung stehen, während dieselbe Datei zweimal
  korrekt 234 nannte; gefunden hat es erst ein unabhängiger Prüfer. Scharf prüfen (`ALTE_WERTE_STRIKT=1`)
  heißt: nur über die **Zahlendoku** (`README.md`, `docs/testing.md`). Über `AGENTS.md`,
  `docs/workflow.md` und die Aufzeichnungen wird **meldend** geprüft — dort stehen alte Zahlen
  absichtlich (als Lehre, im Aufruf-Beispiel, im Plan) und würden falschen Alarm auslösen.
- **`getBoundingClientRect` an einem gedrehten SVG-Element ist kein Maß für eine Fläche.** Die
  Trefferbox sitzt auf dem Zahnring und ist gedreht; der Browser liefert das **Achsen-Rechteck**
  (Kante an Kante, 52,48 px), nicht die Trefferfläche. Die 44,15 px im README sind gerechnet
  (2 · Trefferradius 49,4 px · Skala 286/640) — die Zahl stimmte, die angegebene Herkunft nicht.
  Wer eine Fläche behauptet, nennt die Rechnung; wer eine Messung behauptet, nennt das Werkzeug,
  das sie wirklich liefert.
- **Augen und Wangen liegen im Fellstreifen, nie auf dem Zahnring** — sonst verdecken sie je nach
  Zahnzahl einen Zahn. Wo der Streifen schmal ist (Katzen, Panda, Hai), werden die Augen kleiner
  und rücken neben die Nase; die Braue liegt dann als Lid auf der Augenkante.
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
