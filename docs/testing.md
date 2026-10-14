# Tests und Nachweise

## Das Gate

```bash
pnpm gate          # pnpm typecheck && pnpm test:run
```

Beides muss grün sein — ein Testlauf allein ist kein Nachweis.

## Stand (letzter Lauf 14.10.2026)

| Größe | Wert |
|---|---|
| Testdateien | 37 |
| Tests | 528 (37 Dateien) |
| Typenprüfung | `tsc --noEmit`, keine Fehler |
| Produktionsbau | `pnpm build` → 2 Seiten, 1,7–2,9 s (Maschinenstreuung; gemessen 1,69 · 1,74 · 1,74 · 1,78 · 1,90 s, kalt 2,84 s) |
| Abhängigkeiten | astro 7.3.8 · vitest 5.0.4 · TypeScript 7.0.2 · jsdom 30.1.2 · @types/node 26.6.5 (angehoben am 14.10.2026) |

## Was wo geprüft wird

| Datei | Prüft |
|---|---|
| `src/architecture.test.ts` | Schichten, Importrichtung, `node:*`-Grenze, Kern ohne Browser/Uhr |
| `src/core/domain/creature.test.ts` | Katalog der Lebewesen: Pflichtfelder, tiergerechte Zahnzahl, eindeutige IDs; je Tier ein Satz über das echte Tier (höchstens 110 Zeichen, kein Wort über scharfe Zähne), leerer oder zu langer Satz gilt als Widerspruch |
| `src/core/domain/liveTeeth.test.ts` | Zufallsmodell: 1–3 scharfe Zähne, Gleichverteilung über 9000 Züge, keine Doppelten, Reproduzierbarkeit, und der Ein-Zahn-Fall: die Gebissgrenzen werden auf die Zahnzahl gekappt, dieser eine Zahn ist scharf (beide Modelle) |
| `src/core/domain/round.test.ts` | Zugregeln, Verlierer, Spielerreihenfolge, Unveränderlichkeit, Fehlercodes; dazu das kleinste Gebiss: eine Runde mit einem Zahn schnappt beim ersten Druck zu (beide Modelle) |
| `src/core/domain/probabilities.test.ts` | Verteilung, Erwartungswert, Überlebenskurve, Spielerchancen gegen die Python-Referenz (`../kroko-doc`) |
| `src/core/domain/tension.test.ts` | Spannung als Biss-Wahrscheinlichkeit (Kurven für Krokodil/Maus/classic), Pause (Fenster, Mittelwert, **Unabhängigkeit vom Ausgang**), Erleichterung, Zucken, Puls des Balkens, Fortschritt der Runde, Schwellen für „angespannt" (30 %) und „rot" (60 %), Reproduzierbarkeit; **Zoom der Bühne** (null unter der Rot-Schwelle, Sprung auf 0,4, linear bis 1, unsinnige Werte geklemmt) — und die **Gleichheit von Anzeige und Auswahl**: die Gefahr des ersten Drucks ist bei jeder Zahnzahl 1–12 genau die Häufigkeit, mit der die Auswahl zieht (bei 2 Zähnen 75 %, nicht 83,3 %) |
| `src/infrastructure/storage/sessionStorageMarks.test.ts` | Sitzungs-Marken: merken, trennen, Rückfall in den Arbeitsspeicher, gesperrter Speicher wirft nicht |
| `src/regeln.test.ts` | Regeln-Blatt gegen den Katalog: genau die Tiere mit 1–3 scharfen Zähnen sind genannt, die erwarteten Drücke (5,42 statt 4,69) kommen aus dem Modell, keine Tier-Notiz behauptet eine Vorliebe für bestimmte Zähne |
| `src/core/domain/sessionLog.test.ts` | CSV-Format, Kurzformat-Import, fehlerhafte Zeilen; unmögliche Zeilen (Zahnzahl jenseits 1–12, Zahn oder Druck-Nummer außerhalb des Gebisses, mehr als vier Spieler) werden übersprungen; `isPlausibleRecord` nimmt Altdaten ohne Lebewesen an und weist Fremdes ab; **Zusammenführen** zweier Stände (`mergeRoundLogs`): gleicher Stand bleibt, ein leeres Gerät bekommt alles zurück, Runden nur des Geräts werden angehängt und weitergezählt, dieselbe Runde wird auch unter anderer Nummer erkannt, gleiche Einträge zählen je Vorkommen |
| `src/core/domain/statistics.test.ts` | Chi²-Verteilung gegen Tabellenwerte (χ²=3,841/df=1 → 0,050; 19,023/df=9 → 0,025), Wilson-Intervall, Autokorrelation, **Gruppen gleichen Gebisses** (`groupRounds`); 360 faire, gemischte Runden sind je Gruppe unauffällig (zusammengeworfen schlagen Zahn- und Modell-Test an); Druck-Position gegen Gleichverteilung nur im Modus classic; Mustersuche erst ab der Mindeststichprobe; kein Freispruch für einen Test, der nicht lief; Fazit mit Umlauten; ein unbekanntes Lebewesen im Protokoll wirft nicht mehr |
| `src/core/domain/album.test.ts` | Tier-Album: Sterne einer Runde an der Grenze (5 harmlose Drücke beim Krokodil: der 6. Druck gibt „halb geschafft", der 5. nicht), „bis zum letzten Zahn" nur beim letzten, mit eigener Zahnzahl nur „gespielt" (2, aber auch 12 Zähne beim Krokodil), Altdaten und unbekannte Kennung zählen für das Krokodil; eine Seite je Katalogtier in Katalogreihenfolge, feste Sternreihenfolge, neue Sterne im Vergleich zweier Stände — und die **Chancen**: für jedes Tier und beide Zufallsmodelle liegt „halb geschafft" in 20–50 % und der letzte Zahn in 2–20 % der Runden |
| `src/core/domain/unlocks.test.ts` | Freischaltung der Tiere: **jedes Katalogtier steht genau einmal** am Start oder in der Folge (ein neues Tier fällt sonst auf), die Folge und ihre Schwellen (3, 5, … 15), **keine Schwelle braucht einen dritten Stern**, jede Schwelle an ihrem Rand (ein Stern weniger: gesperrt), drei Sterne eines einzigen Tiers genügen (gezählt werden Sterne, nicht Runden), alte Runden eines heute gesperrten Tiers zählen mit, und was seit dem letzten Stand dazukam, in der Reihenfolge der Folge |
| `src/presentation/game/unlocks.test.ts` | Freischaltung in der Bedienung (jsdom): am Anfang drei Tiere offen, sieben gesperrt mit Schloss, Marke und Beschriftung für Bildschirmleser („Hai, gesperrt — noch 2 sterne“), aber nicht `disabled` (der Tipp muss ankommen); genau das nächste Tier ist hervorgehoben; ein Tipp auf ein gesperrtes Tier lässt die Kachel sagen, was fehlt; Löschen sperrt wieder. Nach dem Biss: Karte mit Kopfbild, Namen, Knopf und Konfetti, zwei Tiere bei zwei genommenen Schwellen, der Knopf meldet das Tier; der Satz zum Fortschritt mit Sternzeichen und Schattenriss nur bei neuem Stern; **keine Feier bei Runden von außen**; kein Konfetti bei „Bewegung reduzieren“; und jeder Name der Folge richtig gebeugt („bis zum Löwen“, „Mit dem Menschen spielen“) |
| `src/core/use-cases/playPress.test.ts` | Dramaturgie ohne Verrat des Geheimnisses |
| `src/core/use-cases/syncRoundLog.test.ts` | Abgleich mit der Sicherung: ein leeres Gerät bekommt seine Runden zurück, eine neue Runde wird gesichert, bei gleichem Stand wird nirgends geschrieben, eine Runde, die **während** des Abrufs endet, geht nicht verloren, und ohne Antwort der Sicherung bleibt das Gerät unberührt |
| `src/infrastructure/audio/creatureVoices.test.ts` | Tierstimmen als Dateien: jedes Katalogtier hat genau eine, sie liegt wirklich in `public/sounds/voices/`, ist ein MP3 von höchstens 16 000 Byte und hat in `QUELLEN.md` eine Zeile mit Lizenz und Quelle; die Adresse trägt den Basis-Pfad |
| `src/infrastructure/audio/webAudioEngine.test.ts` | **Tierstimmen**: nach der ersten Geste wird jede Datei genau einmal geladen, eine geladene Stimme spielt sofort (leiser als der Biss), eine noch ladende wird nachgereicht — aber nicht nach mehr als 0,5 s und nicht nach `stopAll()`; Ton aus lädt nichts, ein Fehlschlag wird beim nächsten Anlass erneut versucht. Dazu: Klänge synthetisch, stumm schaltet Knoten ab, Spannung macht das Knarren lauter, ohne Audio-Kontext keine Ausnahme, `webkitAudioContext`-Rückfall; **Freigabe**: vor der ersten Nutzergeste entsteht weder Knoten noch Kontext, die Klänge eines Tipps werden auch bei noch angehaltenem Kontext geplant, und `unlock()` bittet erneut um Freigabe (auch nach „interrupted") |
| `src/infrastructure/storage/localStorageLog.test.ts` | Ablage, kaputtes JSON, privater Modus, Übernahme früherer Speicher-Schlüssel; Einträge, die kein Protokolleintrag sind, werden übergangen; scheitert das Schreiben über einem älteren Stand, gilt bis zum nächsten Erfolg der Arbeitsspeicher; Löschen räumt auch die früheren Schlüssel |
| `src/infrastructure/storage/localStorageSettings.test.ts` | Einstellungen: Ablage, kaputtes JSON, Übernahme früherer Speicher-Schlüssel; die Grenzen 1 und 12 werden angenommen, darunter/darüber verworfen |
| `src/infrastructure/storage/httpRemoteLog.test.ts` | Sicherungscode aus der Adresse — als Pfad (`…/s/<code>`, auch mit Schluss-Schrägstrich und unter einem Basis-Pfad; aus anderen Pfaden wird nichts gelesen) oder als Abfrage (`?s=…`): gemerkt für den Wechsel zur Statistik, ohne Code keine Sicherung, was kein Code ist, wird abgewiesen und nicht abgelegt, gesperrte Ablage wirft nicht; Adresse über den Basis-Pfad; der Abruf übergeht, was kein Protokolleintrag ist, und wirft bei unbekanntem Code, Nicht-Liste und abgelehntem Schreiben |
| `src/presentation/game/backupSync.test.ts` | Verdrahtung der Sicherung: die Anzeige zieht nur nach, wenn sich die Ablage geändert hat; zwei Abgleiche laufen nacheinander; ein Fehlschlag wird gemeldet, wirft nicht und wird beim nächsten Mal nachgeholt; Löschen ersetzt die Sicherung; der Abgleich läuft auch **ohne** Zuhörer für den Status (so ist die Spielseite verdrahtet); der Satz der Statistikseite nennt die Rundenzahl mit ihrem Substantiv |
| `src/backupWorker.test.ts` | Sonde für `worker/backup.js` gegen eine nachgestellte Datenbank: unter der Startadresse `s/<code>` kommt die Spielseite, unter etwas, das kein Code ist, nichts; ein bekannter Code liest und schreibt, ein unbekannter legt **nichts** an (weder beim Lesen noch beim Schreiben), nur JSON-Listen werden angenommen, zu große Sendungen und andere Methoden abgewiesen, die Antwort wird nicht zwischengespeichert |
| `src/infrastructure/storage/browserPersistence.test.ts` | Bitte um dauerhaften Speicher (`navigator.storage.persist`): Zusage, schon bestehende Zusage (keine zweite Bitte), Verweigerung als „best-effort", fehlende Schnittstelle, und ein Browser, der wirft oder ablehnt, hält nichts an |
| `src/infrastructure/haptics/browserHaptics.test.ts` | Vibrations-Adapter: fehlende Schnittstelle ist kein Fehler, Muster werden durchgereicht |
| `src/render-probe.test.ts` | Zeichnungs-Sonde: schreibt je Lebewesen ein SVG zum Ansehen und unter `zahnzahlen/` eines je Zahnzahl (1–12) für `scripts/pruefen-zahnsicht.py`; Katalog und Zeichnungen decken sich |
| `src/icon.test.ts` | Symbol-Sonde: **erzeugt das App-Symbol** aus der Krokodil-Zeichnung (geschlossenes Maul, Schließwege wie die Bühne), hält die ausgelieferten SVGs Zeichen für Zeichen daran fest (`favicon.svg`, `icon-maskable.svg` und `logo.svg` für den Kopfbereich der Seite), prüft, dass der Kopfbereich beider Seiten das Symbol zeigt und kein zweites, von Hand gezeichnetes Krokodil, den Manifest-Eintrag, die Existenz jeder genannten Datei und die Kantenlängen der PNGs (180/192/512) |
| `src/presentation/game/creatures/creatureViews.test.ts` | Zeichnungsvertrag **und Tippziel-Nachweis**: jedes Katalog-Lebewesen hat eine Zeichnung, Zahnzahl stimmt, Ebenenreihenfolge, gültiges Markup, Anker in der Bühne, und für jede erlaubte Zahnzahl (1–12) bleibt die Trefferfläche bei 285 px Bühnenbreite ≥ 44 px. **Kein Zahn unter dem Gesicht:** jede Ellipse und jeder Kreis der Gesichtsebene (Augen, Wangen, Ohren, Monokel) liegt samt halber Strichstärke und 2 Einheiten Abstand außerhalb der Ringellipse und trägt kein `transform`. Dazu die **Kopfbilder der Tier-Auswahl**: ohne Bedienteile (kein `.creature`, kein `.tooth`, kein `data-tooth`, keine Trefferfläche), jede Kachel mit **eigener** Beschnitt-Kennung und derselben Ebenenreihenfolge wie die Bühne |
| `src/offline.test.ts` | Offline-Sonde: lädt `public/sw.js` in eine nachgestellte Worker-Umgebung — Installation legt beide Seiten, ihre Bausteine (auch die, die nur ein anderer Baustein einbindet), Symbole und Tierstimmen in den Vorrat; ohne Netz kommen Seiten und Bausteine von dort; mit Netz immer der neue Stand, alte Bausteine werden weggeräumt; fremde Ursprünge, Schreibzugriffe und Teilabrufe bleiben unberührt; der Vorrat wird ohne Rücksicht auf `Vary` befragt. Dazu: Anmeldung nur im Bau und über den Basis-Pfad, Pflichtfelder des Manifests, Stimmenliste gleich `CREATURE_VOICE_FILES`; die Sicherung der Runden (`api/…`) geht immer ans Netz |
| `src/presentation/game/creatures/gaze.test.ts` | Rechnung des Blicks (Richtung, Höchstweg, Abstand null, kein `NaN`), Umrechnung Bildschirm → Zeichnung (auch ohne Größe) und die **Linsen-Grenze**: bei vollem Blick bleibt die Pupille jedes Tiers in acht Richtungen in ihrer weißen Linse |
| `src/presentation/game/sheets.test.ts` | Blätter: Tipp daneben schließt nur das **oberste** Blatt, ein Tastaturklick (0/0) schließt nichts, eine Kachel oberhalb des unteren Blatts schließt es nicht mit, das Ergebnis bleibt bei Tipps auf die Bühne stehen — mit den gemessenen Tablet-Maßen |
| `src/presentation/game/creatureChoice.test.ts` | Tier-Auswahl: dasselbe Tier erneut tippen ändert nichts, ein anderes bringt sein Gebiss mit; ein gesperrtes Tier wird nicht gewählt, und ein gespeichertes gesperrtes Tier fällt beim Start auf das Krokodil mit dessen Gebiss zurück |
| `src/presentation/game/quickControls.test.ts` | Leiste der Spielseite: Zahnzahl je Schritt, Grenzen 1 und 12 ändern nichts (keine neue Runde), Kachel wählt in Reihe wie Blatt, Bühne bleibt unberührt, Kurzinfo gefüllt; ein Tipp auf ein gesperrtes Tier wählt nichts, startet keine Runde und lässt die Auswahl offen |
| `src/presentation/game/albumBadges.test.ts` | Tier-Album in der Bedienung (jsdom): drei Plätze je Kachel, verdiente gefüllt, Beschriftung für Bildschirmleser („Krokodil, 2 von 3 Sternen"), die Zeichnung auf der Bühne bleibt unberührt (auch sie trägt `data-creature`), mehrmaliges Malen legt keine weiteren Plätze an, Zusammenfassung in einem Satz; die **Ansage** nennt nach dem Biss Tier und Stern, mehrere Sterne zusammen, schweigt ohne Neues und räumt die alte Ansage weg — und sagt nichts an, wenn sich das Protokoll von außen ändert (anderer Tab, Import) |
| `src/bedienleiste.test.ts` | Markup der Spielseite: Tier, Zähne und Neue Runde stehen auf der Seite und nicht im Zahnrad; das Zahnrad bietet genau 1 oder 2 Spieler; die Kurzinfo steht im Regeln-Blatt; die Ansage eines neuen Sterns steht als Meldung (`role="status"`) auf der Bühne, das Album ist mit derselben Ablage verdrahtet wie das Spiel, und das Regeln-Blatt nennt die drei Sterne beim Namen und sagt, dass sie Glück sind; Fortschritt und Freischaltung stehen über der Bühne und **nicht** im Ergebnis-Kasten, die Auswahl folgt der Freischaltung, der Rückfall beim Start liest die Ablage, und das Regeln-Blatt nimmt Zahlen und Namen der Freischaltung aus der Regel statt aus abgeschriebenem Text |
| `src/presentation/game/gameController.test.ts` | **Prüfsonde** im DOM (jsdom): Drücke bis zum Biss, Klassen, Anzeigen, Tonfolge, Protokolleintrag, **Tierstimme** nach dem Biss und beim Tierwechsel (nie bei harmlosem Zahn, nie für eine überholte Runde; der Tierwechsel bricht vorher ab, was noch klingt), Ergebnis auf der Seite samt Satz über das echte Tier (nach einem Tierwechsel der des neuen Tiers), **Zugzeile in richtiger Sprache** („Du bist dran" statt „Du ist dran", bei mehreren Spielern der Name, nach dem Biss „Maul zu") und **Blatt-Verhalten**: das Einstellungsblatt bleibt beim Stellen offen, das Ergebnis auf der Seite räumt die neue Runde weg; dazu **Anhängen an den Stand der Ablage** (ein anderer Tab hat gelöscht oder importiert), `syncLog()` und das Glühen eines Zuckens, das auch dann zurückgeht, wenn der nächste Druck sofort zuschnappt; im Leerlauf spielt nichts von selbst (kein Herzschlag), und nach `dispose()` läuft kein spätes Urteil mehr; **Halten**: beim Auflegen wird nichts entschieden, Loslassen auf dem Zahn zählt genau einen Zug, Wegschieben, `pointercancel`, die Obergrenze von 4 s, eine neue Runde und `dispose()` nehmen ihn zurück, ein zweiter Finger beginnt nichts, der `click` eines Zeigers wird übergangen; **Blick** (geradeaus am Rundenbeginn, auf den gedrückten Zahn, dem Zeiger nach, nicht nach dem Biss und nicht nach `dispose()`) und **Zittern** (keines am Start, leicht über 30 %, deutlich ab 50 %, nie beides, nie bei geschlossenem Maul); **Heranzoomen**: `--zoom` ist am Rundenbeginn 0, folgt ab der Rot-Schwelle der Bissgefahr und steht nach Biss und neuer Runde wieder auf 0 |
| `src/presentation/stats/statsView.test.ts` | Bericht, Mindeststichprobe, Erkennung eines bevorzugten Zahns; dazu ein Bericht je Gebiss (größte Gruppe offen, übrige eingeklappt), beim Wolf der Modellwert 5,42 statt 4,69, der Gleichverteilungs-Test der Druck-Position nur im Modus classic, keine Muster-Marken unter der Mindestzahl; ein unbekanntes Lebewesen wirft nicht (gilt als Krokodil), die Statuszeile zählt die Mindestzahl je Gebiss, und ein Test, den das Gebiss nicht hergibt, heißt „nicht prüfbar" statt „zu wenig Daten"; der Satz zur Haltbarkeit des Speichers benennt jede der drei Antworten des Browsers und nennt den CSV-Export, solange nichts zugesagt ist |

## Prüfsonden (Nachweis am laufenden Gegenstand)

1. **Bedienungssonde** — `gameController.test.ts` lädt die Steuerung in jsdom, drückt echte
   Elemente an und belegt Zuschnappen, Tonfolge und Protokoll. Aufruf:
   `./node_modules/.bin/vitest run src/presentation/game/gameController.test.ts`
2. **Bau- und Auslieferungssonde** — `pnpm build` und Prüfung der erzeugten Seiten:
   `grep -c 'Zahn Agent' dist/index.html`, `grep -o 'croc-mount' dist/index.html`,
   `ls dist` (erwartet: `index.html`, `statistik/index.html`, `favicon.svg`, `logo.svg`,
   `manifest.webmanifest`,
   `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `_astro/`).
3. **Zeichnungssonde** — die Zeichnung wird ohne Browser sichtbar gemacht und angesehen:
   ```bash
   pnpm vitest run src/render-probe.test.ts          # schreibt je Lebewesen ein SVG
   uv run --with cairosvg python scripts/artwork-png.py \
     "$TMPDIR/zahn_agent-artwork/crocodile.svg" crocodile.png geschnappt
   ```
   Die Zustände „offen", „gedrueckt" und „geschnappt" setzt der Rasterer so, wie es das
   Stylesheet tut: `is-pressed`/`is-snapped` als Klasse und den Schließweg als Attribut mit
   dem Wert aus dem SVG (cairosvg kennt weder `var()` noch `transform-origin`).

   Das README-Bild der Gebisse entsteht aus denselben SVGs — als Skript im Baum, nicht von Hand:
   ```bash
   uv run --with cairosvg python scripts/galerie.py docs/bilder/gebisse.png \
     crocodile wolf human shark mouse vampire panda lion panther sabertooth flytrap trex  # Reihenfolge = Katalogreihenfolge
   ```
4. **Symbolsonde** — das App-Symbol entsteht aus der Zeichnung und wird angesehen:
   ```bash
   ICON_NEU=1 pnpm test:run                          # schreibt favicon.svg, icon-maskable.svg, logo.svg
   uv run --with cairosvg python scripts/icon-png.py # rastern: 180, 192, 512, maskierbar 512
   ```
   Danach die gerasterten Bilder ansehen (das Kopfmaul muss zu sein, der Kopf innerhalb der
   Kachel). Ohne `ICON_NEU=1` prüft `src/icon.test.ts` nur, dass die Dateien zur Zeichnung passen.

5. **Trefferflächen-Sonde** — die Trefferfläche eines Zahns wird im echten Browser gemessen (nicht
   gerechnet) und nachgesehen, ob in ihrer Mitte wirklich der eigene Zahn liegt:
   `pnpm dev --host`, dann
   `uv run --with playwright python scripts/pruefen-trefferflaeche.py` (misst bei 320/360/390 px Blick
   und prüft mit `document.elementFromPoint`, dass keine Dekoration den Tipp abfängt; mit einer
   Adresse als Argument läuft dieselbe Sonde gegen die veröffentlichte Seite:
   `… pruefen-trefferflaeche.py https://zahn-agent.schaflabs.com`). Erwartet:
   44,15 px bei 320 px, und bei **jedem** Zahn der eigene Zahn in der Mitte; die Tippprobe am Ende
   muss für Zahn 2, 1 und 10 „registriert" melden. Der rechnerische Teil
   (44 px auf der schmalsten Bühne, und wo der Zahnabstand die Grenze ist) steht in
   `creatureViews.test.ts`.

6. **Blatt-Sonde** — nutzt das Einstellungsblatt die Breite des Geräts? Gemessen wird das geöffnete
   Blatt bei acht Blickbreiten von 320 bis 1366 px: Lage (klebt es am Rand?), Breite, Spaltenzahl,
   ob der Inhalt ins Sichtfenster passt, ob das ✕ ohne Scrollen erreichbar ist und ob ein Kind aus
   dem Blatt ragt. **Zuerst** wird der Zustand **beim Laden** geprüft: vor jedem Tipp muss das
   geschlossene Blatt `display: none` haben — ein `display` einer Autoren-Regel hebt sonst das
   `display: none` der Browser-Regel `dialog:not([open])` auf, und das Blatt steht sichtbar auf dem
   Schirm, ohne schließbar zu sein (genau dieser Fehler war am 11.10.2026 auf Tablets, §5m).
   `uv run --with playwright python scripts/pruefen-blattbreite.py` (mit einer Adresse als Argument
   gegen die veröffentlichte Seite). Erwartet: „beim Laden none" in jeder Zeile, unter 640 px randlos
   in einer Spalte, ab 640 px mittig mit 2–4 Spalten und **ohne** Scrollen, und **0 Auffälligkeiten**
   (Exit 0).

7. **Tier-Sonde** — zeigt die Tier-Auswahl alle Lebewesen **mit Bild**? Die Sonde öffnet das
   Tier-Blatt von der Spielseite aus im echten Browser, zählt die Kacheln, liest Kennungen und Namen in der Reihenfolge,
   prüft, dass jede Kachel ein **sichtbares** Kopfbild und einen **eigenen** Beschnitt trägt, und
   zählt dieselben Kennungen im ausgelieferten Bündel:
   `uv run --with playwright python scripts/pruefen-tiere.py` (mit einer Adresse als Argument gegen
   die veröffentlichte Seite). Erwartet: zwölf Kacheln in der Reihenfolge der Freischaltung
   (`UNLOCK_ORDER`: Krokodil, Maus, Wolf, dann die Folge), zwölf sichtbare
   Kopfbilder, zwölf eigene Beschnitte, kein Tiername fehlt (Exit 0). Seit dem 12.10.2026 prüft sie
   außerdem den Kern der Auswahl: Nach einem Tipp auf eine Kachel ist das **Auswahlblatt zu**, das
   gewählte Tier steht auf der Bühne und genau eine Kachel ist markiert; die Kurzinfo des gewählten
   Tiers ist gefüllt (sie steht seit dem Umbau im Regeln-Blatt). Die Bündel-Prüfung braucht den
   **Bau** (`pnpm build`, `pnpm preview`) — gegen `pnpm dev` meldet sie ein leeres Bündel.

8. **Blätter-Sonde** — bleiben die Blätter offen, solange man darin arbeitet? Die Sonde stellt die
   vier Befunde vom 12.10.2026 im echten Chromium nach: Enter/Leertaste auf einem Knopf im
   Einstellungsblatt (Tastaturklick trägt 0/0), Tier-Auswahl bei
   390/768/1180/1366 px (unter 640 px über das Blatt, darüber in der offenen Kopfreihe), Tipp auf die Bühne nach dem Biss (das Ergebnis steht seit dem 12.10.2026 auf der Seite, kein
   Blatt öffnet sich) und dasselbe Tier erneut tippen. Dazu die
   Gegenprobe, dass ein Zeigertipp **neben** das Einstellungsblatt es weiterhin schließt.
   `uv run --with playwright python scripts/pruefen-blaetter.py` (mit einer Adresse als Argument
   gegen die veröffentlichte Seite). Erwartet: 8× `Blatt offen = True`, je Breite und Tier `Auswahl offen =
   False` mit dem gewählten Tier auf der Bühne und `Tipp daneben schliesst = True`, der Knopf
   `#new-round` nach dem Biss betont (`is-next`) und erreichbar (≥ 48 px, im Sichtfenster) und `ERGEBNIS: in Ordnung` (Exit 0).

9. **Anzeige-Sonde** — trägt der Balken seine zwei Aussagen wirklich? Gemessen werden die
   **berechneten** Stile im echten Chromium (jsdom rechnet kein CSS) in drei Lagen: ein Zahn
   (Gefahr 100 % → Füllung in der Gefahrfarbe, Atmung im Puls-Takt; die Zahl der Bissgefahr ist
   seit dem 13.10.2026 **nicht mehr sichtbar**, das prüft die Sonde ebenfalls), zehn Zähne mit
   einem Druck (Gegenprobe: 21 % → **nicht** rot) und nach dem Zuschnappen (keine Bissgefahr mehr,
   Füllung farblos, keine Atmung). Gegen die veröffentlichte Seite war sie zuerst **rot mit 5
   Funden** (§5t).
   ```bash
   uv run --with playwright python scripts/pruefen-anzeige.py            # veröffentlichte Seite
   uv run --with playwright python scripts/pruefen-anzeige.py http://localhost:4402/index.html
   ```

10. **Bedien-Sonde** — sind Tier, Zahnzahl und „Neue Runde" ohne Blatt und ohne Scrollen erreichbar?
   Gemessen wird im echten Chromium auf acht Größen (320 × 568 bis 1180 × 820), je in drei Lagen
   (beim Laden, nach einem Druck, Ein-Zahn-Spiel mit Warnung) und nach dem Biss mit dem
   **längsten** Ergebnistext (eingesetzt, weil der Zufall ihn nicht liefert): die Spielseite scrollt nicht, die
   feste Leiste verdeckt nichts, kein Griff ist kleiner als 48 px hoch oder 44 px breit, die
   Tippzahlen stimmen (Zähne 1, Neue Runde 1, Tier 2 unter 640 px bzw. 1 darüber), und weder die
   Tier-Auswahl noch das Zahnrad-Blatt scrollt — auch nicht ohne Vibration (Safari iOS,
   nachgestellt). Handy quer (844 × 390) darf scrollen, aber nichts verdecken.
   `uv run --with playwright python scripts/pruefen-bedienung.py` (mit einer Adresse als Argument
   gegen die veröffentlichte Seite). Erwartet: zehn Messzeilen und `Auffälligkeiten: 0` (Exit 0).

11. **Halte-Sonde** — `scripts/pruefen-halten.py` hält, schiebt weg, klickt, tippt und drückt die
   Eingabetaste im echten Browser; dazu zwei Fälle mit **echter Berührung** (ein Finger, der auf dem
   Zahn 14 px wackelt, und einer, der 120 px weggeschoben wird) — die Maus zeigt nicht, wann der
   Browser aus einem Halten ein Wischen macht. Erwartet: sechzehn Zeilen `ok` und
   `Auffälligkeiten: 0` (Exit 0).
   `uv run --with playwright python scripts/pruefen-halten.py`

12. **Blick-Sonde** — `scripts/pruefen-blick.py` bewegt den Zeiger über die Bühne aller zwölf Wesen
   und liest die berechneten Stile des Kiefers. Erwartet: 41 Zeilen `ok` und `Auffälligkeiten: 0`.
   `uv run --with playwright python scripts/pruefen-blick.py`

13. **Zoom-Sonde** — `scripts/pruefen-zoom.py` setzt den vollen Zoom für jedes Tier bei Standard-
   Zahnzahl und 12 Zähnen auf 320, 390 und 820 px und prüft, dass jeder Zahn in der Mitte seiner
   Trefferfläche erreichbar bleibt. Erwartet: 72 Messzeilen und `Auffälligkeiten: 0` (Exit 0).
   `uv run --with playwright python scripts/pruefen-zoom.py`

14. **Offline-Sonde** — `scripts/pruefen-offline.py` lädt die **gebaute** Seite, wartet auf den
   Service Worker, nimmt dem Browser das Netz und lädt beide Seiten neu. Der Entwicklungsserver
   genügt nicht (dort wird kein Service Worker angemeldet): vorher `pnpm build` und
   `pnpm preview --port 4322`. Erwartet: zehn Zeilen `ok` und `Auffälligkeiten: 0` (Exit 0).
   `uv run --with playwright python scripts/pruefen-offline.py`

15. **Sicherungs-Sonde** — `scripts/pruefen-sicherung.py` lädt die **gebaute** Seite und stellt die
   Sicherung nach (der echte Worker bleibt unberührt): ohne Code keine Anfrage; mit Code sichert
   das Gerät; nach dem Leeren der Ablage sind Runden und Sterne wieder da — auch über die
   Startadresse ohne Abfrage-Teil (`s/<code>`); die Statistikseite
   nennt die gesicherten Runden; eine gespielte Runde landet in der Sicherung; Löschen leert sie;
   ohne Server sagt die Seite es und das Spiel läuft weiter. Vorher `pnpm build` und
   `pnpm preview --port 4322`. Erwartet: vierzehn Zeilen `ok` und `Auffälligkeiten: 0` (Exit 0).
   `uv run --with playwright python scripts/pruefen-sicherung.py`

16. **Freischaltungs-Sonde** — `scripts/pruefen-freischaltung.py` prüft auf vier Größen (320 × 568,
   390 × 844, 800 × 1280, 1180 × 820), was jsdom nicht rechnet: drei Tiere offen und sieben als
   geschwärzter Umriss mit Schloss, gleich große Kacheln, die Marke am nächsten Tier; ein Tipp auf
   ein gesperrtes Tier wählt nichts und lässt die Auswahl offen; nach einem Biss mit neuem Stern
   der Satz mit Sternzeichen und Schattenriss; nach dem dritten Stern die Karte mit Kopfbild und
   Knopf, Konfetti, das den Knopf nicht verdeckt, **kein Scrollen** und „Neue Runde“ erreichbar;
   der Knopf wechselt das Tier; ein gespeichertes gesperrtes Tier wird zum Krokodil; mit „Bewegung
   reduzieren“ kein Konfetti. Erwartet: 106 Zeilen `ok` und `Auffälligkeiten: 0` (Exit 0).
   `uv run --with playwright python scripts/pruefen-freischaltung.py` (Vorschau auf 4322; mit
   `--bilder <mappe>` legt sie je Größe vier Bilder zum Ansehen ab).

   **Alle anderen Sonden bringen ein Protokoll mit, das alle Tiere öffnet**
   (`scripts/freischaltung.py`): auf einer frischen Seite sind sonst nur drei Tiere wählbar, und
   wer den Hai oder den Vampir prüfen will, bekäme stattdessen das Krokodil — ohne Fehlermeldung.

## Zwei Regeln für Zeitgeber in Sonden

- **Jede Steuerung wird abgehängt:** `dispose()` nach jedem Fall (`afterEach`). Sonst feuert ein
  später Zeitgeber (damals der Herzschlag) in die schon abgebaute Umgebung (`ReferenceError: window is not defined`) und das Gate
  wird flakig — ohne dass ein Test fachlich rot ist. Der Mechanismus ist in
  `scripts/pruefen-zeitgeber.cjs` nachgestellt (Jsdom-Zeitgeber nach entferntem Global;
  `node scripts/pruefen-zeitgeber.cjs`).
- **Eigene Uhr statt echter Millisekunden:** `vi.useFakeTimers()` + `vi.advanceTimersByTime(...)`,
  wenn ein Test eine Wartezeit der Steuerung selbst prüfen will.

## Sonden dürfen nicht würfeln

- **Eine Sonde stellt den Zustand her, den sie messen will — sie hofft nicht darauf.** Die
  Anzeige-Sonde drückte in ihrer Gegenprobe (zehn Zähne, ein Druck) auf einen Zahn und nahm an, er
  sei harmlos: 1–3 der zehn Zähne sind aber scharf, also schnappte die Runde gelegentlich zu und die
  Sonde meldete drei Funde, die keine waren („Runde sollte weiterlaufen, ist snapped"). Sie würfelt
  jetzt mit **frischer Seite** neu, bis die Runde offen bleibt, und nennt den Versuch im Titel. Wer
  einen zufälligen Zustand messen will, muss ihn entweder deterministisch herstellen (ein Zahn beim
  Vampir heißt: der erste Druck schnappt garantiert) oder so lange neu ziehen, bis er steht.

## Zahlen nur aus Kommandos

Jede Zahl in der Dokumentation stammt aus einem ausgeführten Kommando. Schätzungen sind
verboten; Simulationen werden als Simulation gekennzeichnet (z. B. die Demo-Daten des
Python-Werkzeugs).
