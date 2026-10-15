# Regeln für jedes Paket

Gilt für alle Pakete unter `docs/plaene/`. Jedes Paket ist für **eine eigene Sitzung** gedacht:
wer eines ausführt, liest diese Datei und die Datei des Pakets — mehr braucht er aus dem Plan
nicht. Übersicht, Reihenfolge und Abhängigkeiten: `docs/plan.md`.

0. **Vor dem Anfang:** `git status` sauber, `pnpm gate` grün, und die Pakete, die dieses Paket
   „braucht“, sind erledigt (ihre Dateien gibt es nicht mehr). Sonst anhalten und melden.
1. **Erst lesen:** `AGENTS.md` ganz, die Datei des Pakets ganz, dazu die dort genannten Dateien.
   Die Zeilenangaben im Paket sind vom 13.10.2026 — vor dem Ändern nachsehen, ob sie noch stimmen.
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
   meldet aus den Dateien unter `docs/plaene/` die Dateien, die erst noch entstehen — das ist
   kein Fund; in der übrigen Doku darf keiner stehen.
8. **Am Ende des Pakets:** Abschnitt „Abnahme“ Punkt für Punkt belegen; Neues an Regeln oder
   Fallen nach `AGENTS.md`, Nachweise nach `docs/e2e-nachweise.md`. Dann die **Datei des Pakets
   löschen** und seine Zeile in `docs/plan.md` streichen. Ist es das letzte Paket, auch diese
   Regeln und den Ordner `docs/plaene/` löschen und `docs/plan.md` auf den Hinweistext
   zurücksetzen („Gerade ist kein Feature in Arbeit.“).
