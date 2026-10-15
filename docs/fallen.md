# Fallen, die Zeit kosten

Jede Falle nennt ihren Anlass, den Messwert und die Gegenprobe — sie stammt aus einem echten Lauf,
nicht aus einer Vermutung. Bis zum 14.10.2026 stand diese Liste in `AGENTS.md`; dort war sie in
jeder Sitzung im Blick, hier liest sie, wer dem Index folgt. **Vor jeder Änderung am Code lesen.**

- **Ein Vorrat, der gefüllt ist, ist noch kein Vorrat, der antwortet.** Der Service Worker
  (`public/sw.js`) bestand alle Fälle seiner nachgestellten Umgebung — und im echten Browser lud die
  Seite ohne Netz, zeichnete aber **keinen Zahn**. Drei Ursachen hintereinander, jede erst von
  `scripts/pruefen-offline.py` gefunden (12.10.2026): (1) das HTML nennt nicht alle Bausteine — die
  Seitenskripte binden einen geteilten Baustein ein, den nur sie kennen, also folgt der Worker den
  Einbindungen der Skripte; (2) beide Seiten wurden nebeneinander abgelegt, und das Aufräumen der
  einen löschte die Bausteine der anderen, bevor deren Liste stand — abgelegt wird nacheinander;
  (3) der Server schickt `Vary: Origin`, und der Vorrat verfehlte das Skript, das der Worker selbst
  ohne diese Kopfzeile geholt hatte — befragt wird mit `ignoreVary`. Wer den Worker ändert, baut
  und fährt die Sonde; der Entwicklungsserver meldet ihn gar nicht an. Und: kommt eine Tierstimme
  dazu, gehört sie auch in `VOICES` in `public/sw.js` (ein Test hält die Listen gleich).

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
  jede Zahnzahl im Browser (erwartet: 0 Auffälligkeiten unterhalb der 2-%-Schwelle). **Nachgemessen am
  14.10.2026** (unabhängiger Prüfer): bei der Standardzahnzahl deckt kein Zahn ein Auge (0 px), bei
  **fünf** Zähnen ragen die verbreiterten Zahn-Ecken aber minimal unter den Augenrand — Panther
  0,86 %, Löwe 0,66 %, Säbelzahntiger 1,29 % eines Zahns (der Vampir-Fall mit 1,88 % bei drei Zähnen
  ist das Monokel, keine Deckung durch Zähne). „Kein Zahn verdeckt ein Auge" gilt also für die
  Standardzahl exakt und für wenige Zähne mit dieser kleinen Restdeckung. Anleitung:
  `docs/tiermodell-anleitung.md`.

- **Ein gespiegelter Teilpfad in der Silhouette schneidet Löcher ins Gesicht.** Die Silhouette ist
  ein `clipPath`, dort gilt die **Nonzero**-Regel: wer ein Ohr zeichnet, indem er die Koordinaten
  des anderen Ohrs spiegelt, kehrt damit auch die **Laufrichtung** des Pfades um. Im
  Überlappungsbereich von Kopf und Ohr heben sich die Windungen dann auf und alles dort wird
  weggeschnitten — dem Panther fehlte im ersten Entwurf das rechte Auge (im gerasterten PNG
  gemessen: Pixel (470,166) war Fellfarbe statt Weiß, links dagegen korrekt). Teilpfade einer
  Silhouette immer **gleichsinnig** laufen lassen: die Spiegelung notiert man rückwärts durchlaufen
  (letzten Punkt zuerst). **Nachgemessen am 14.10.2026** (unabhängiger Prüfer, dann eigene Rechnung an
  den erzeugten SVGs): die Ohren von Maus, Löwe, Panda und Säbelzahntiger laufen **entgegen** dem Kopf
  (`A … 0 1 0`), dort hebt sich die Fläche im Überlappungsbereich also wirklich auf (Maus 15,1 % des
  Ohrs, Panda 30,7 %, Löwe 8,2 %, Säbelzahntiger 0,4 %) — im gerasterten Bild sichtbar als Kopflinie,
  die durchs runde Ohr läuft; gleichsinnig sind nur die eckigen Panther-Ohren. Die alte Behauptung
  „die runden Ohren der anderen Tiere sind Bogensegmente in gleicher Richtung" war falsch. Beim Panda
  wirkt die Aufhebung als Schutz gegen die Zahnfleisch-Ebene über dem schwarzen Ohr — wer dort die
  Laufrichtung umdreht, muss das Ohr nachprüfen. Die `clip-rule` ist dabei gleichgültig: die SVGs
  tragen keine Angabe (nonzero), und eine evenodd-Fassung rendert pixelgleich (0 Unterschiede).

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
  Zähnen `pointer-events: none` (`presentation/styles/stage.css`); `pointer-events: all` bleibt allein
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

- **Ein Name auf der Kachel darf höchstens zwölf Zeichen haben — und die Sonde, die das meldet, gehört
  auf die gebaute Seite.** Die Regel unter „Ein neues Lebewesen ergänzen" (`AGENTS.md`) sagte
  früher „mehr als rund vierzehn Buchstaben"; „Säbelzahntiger"
  hat vierzehn und brach damit auf der 65-px-Kachel in die **dritte** Zeile — seine Reihe stand
  13,2 px tiefer als die anderen, und `pruefen-freischaltung.py` meldete „gesperrte und offene Kacheln
  sind gleich groß ([(65, 87), (65, 100)])" (gemessen am 14.10.2026). Die wirkliche Grenze sind
  **zwölf** Zeichen. Beim Suchen half die eigene Zählung der Sonde nicht: `pruefen-tiere.py` zählt den
  Katalog im **ausgelieferten Bündel** und meldet im Entwicklungsmodus leer („Kennungen im Buendel:
  []"), weil Astro dort einzelne Module statt eines Bündels liefert — derselbe Lauf gegen die gebaute
  Seite war grün. Eine Sonde, deren Ausgabe nicht zur Umgebung passt, schickt einen auf die falsche
  Spur; die Adresse gehört zum Rezept (hier: `pnpm preview --port 4322`).

- **Eine Doku-Prüfung, die nur jeden siebten Pfad ansieht, meldet trotzdem „alles in Ordnung“.**
  `scripts/doku-pfade-pruefen.py` paart die Backticks der Reihe nach; ein Code-Zaun (```) verschiebt
  die Paarung um eins, und danach enthält jeder „Span“ Fließtext und fällt durch das Sieb. Gemessen
  am 14.10.2026 (die Prüfung selbst gesehen / grob gezählt): `docs/testing.md` **0 / 73**,
  `docs/workflow.md` **0 / 50**, `README.md` **0 / 27**, `docs/e2e-nachweise.md` **1 / 172** —
  Ausgabe trotzdem „Alle genannten Pfade existieren“, Exit 0. Aufgefallen ist es, als in der
  Nachweisakte vier Verweise auf `docs/plaene/paket-*.md` stehen blieben, die es nicht mehr gibt.
  Seit dem 15.10.2026 entfernt die Prüfung die Zäune vorher und paart je Zeile (779 statt 179
  Angaben). Die Lehre bleibt: die erste Zeile der Ausgabe („Pfad-Angaben geprueft: …“) ansehen —
  eine Prüfung, die wenig sieht, meldet genauso „alles in Ordnung“ wie eine, die alles sieht.

- **Ein Bauteil, das nicht in der Liste steht, ist unsichtbar — und im Rasterbild auch.**
  `app.css` ist seit dem 14.10.2026 nur noch die **Reihenfolge** (`@import`), die Regeln stehen je
  Bauteil unter `src/presentation/styles/`. Die Reihenfolge *ist* die Kaskade: von zwei Regeln mit
  demselben Ziel entscheidet die spätere (eine Klassenregel verlor schon einmal gegen einen
  Element-Klassen-Selektor aus demselben Block, siehe oben). Wer ein Bauteil einfügt oder Regeln
  verschiebt, hängt es an der richtigen Stelle ein — und `scripts/artwork-png.py` liest **dieselbe**
  Liste, sonst fehlten die Regeln im Rasterbild, während der Browser sie zeigt. Der Beweis, dass
  nichts verrutscht ist, ist nicht das Auge, sondern der Bau: `pnpm build` und die erzeugte
  `dist/_astro/*.css` gegen die Fassung von vorher vergleichen (beim Aufteilen am 14.10.2026:
  gleiche Bytes, gleiche SHA256, derselbe Dateiname).
