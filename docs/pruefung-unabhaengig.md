# Unabhängige Prüfung

**Zwei Prüfungen liegen vor.**

## 11.10.2026 — die Behauptungen des Baums und der Umgebung

Die unabhängige Prüfung fand am **11.10.2026** statt: ein zweiter Prüfer mit **fremder Methode** —
angegriffen wurden nicht der Bau, sondern die **Behauptungen** im Baum und in der Umgebung. Jede
Behauptung wurde anschließend selbst nachgeprüft und einzeln eingeordnet.

Die Befunde stehen in [`e2e-nachweise.md`](e2e-nachweise.md), **Abschnitt 6** („Von Prüfern gefundene
Umgebungsfallen (nachgeprüft)") — dort steht auch, was davon **echt** war: `Math.lgamma` fehlt in
Node 26 (deshalb rechnet die Statistik mit einer eigenen Lanczos-Näherung) und die Vibration lief
ohne Schnittstellen-Prüfung still ins Leere. Weitere Befunde betrafen die alten Seitenadressen nach
den Umbenennungen.

**Die Prüfung ist damit erledigt, nicht offen.** Was keine Prüfung abdecken kann — kein Browser im
Arbeitsbaum, das Gefühl am echten Handy —, ist am Ende derselben Datei (§7) ehrlich benannt.

## 14.10.2026 — die Zeichnungen

**Zwei** Prüfer, jeder nur lesend und mit eigener Methode; beiden war verboten, die Sonden des Repos
als Beleg zu benutzen (sie sind der Prüfgegenstand, nicht der Zeuge). Prüfer A rechnete gegen die
Quellen und die importierten Module (Katalog, Symmetrieregel, Schließweg), Prüfer B maß die erzeugten
Artefakte (Windungsrichtung der Silhouette, Pixelmessung beider Augen, Galerie-Maße). Danach habe ich
jede Behauptung selbst nachgeprüft — mit einer dritten Methode (Attribute im erzeugten SVG auslesen).
**12 Behauptungen geprüft, drei echt, ein Fehlalarm.**

- **Echt und behoben:** die Zahnarten von Mensch und Vampir spiegeln nicht über die Zwillingsregel
  (der Mensch noch über `count − 1 − i`, die alte Regel, die am 11.10.2026 aus Wolf, Löwe und Panda
  entfernt wurde); die Schließweg-Tabelle im README nannte nur sieben von zwölf Werten. Beides
  korrigiert, TDD: der neue Vertragstest in `creatureViews.test.ts` war vorher rot
  (`human/12: Zahn 4 gegen Zwilling 10`), das README-Bild ist neu gebaut.
- **Echt, nur die Doku war falsch:** „die runden Ohren der anderen Tiere sind Bogensegmente in
  gleicher Richtung" stimmt nicht — Maus, Löwe, Panda und Säbelzahntiger laufen **entgegen** dem Kopf
  und schneiden Fläche weg (0,4 bis 30,7 % des Ohrs). Ebenso sind Pupillen-Versatz (3–4 Einheiten
  gleichsinnig) und die Restdeckung bei fünf Zähnen (unter 1,3 %) jetzt mit Zahlen benannt. Die
  Zeichnungen selbst sind bewusst geblieben: beim Panda wirkt die Aufhebung als Schutz des Ohres.
- **Fehlalarm:** der geprüfte Galerie-Befehl nannte zehn Tiere — veraltet war der **Auftrag**, nicht
  die Datei: mit zwölf Tieren ist der Neubau bildgleich.

Der ganze Lauf samt Einordnung und den zwei Fallen (die `$TMPDIR`-Falle der Galerie und das falsche
Grün der Zahnsicht-Sonde mit einer Adresse als Argument) steht in
[`e2e-nachweise.md`](e2e-nachweise.md), **Abschnitt 5al**.
