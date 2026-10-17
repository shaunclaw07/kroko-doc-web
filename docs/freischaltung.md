# Tiere freischalten

> **Art:** Regel — Zweck: Sterne, Schwellen und `UNLOCK_STEPS`: wann welches Lebewesen wählbar wird.
> **Verwandt:** [`docs/tiermodell-anleitung.md`](tiermodell-anleitung.md), [`docs/domain-model.md`](domain-model.md)

Welche Tiere offen sind, was eine Schwelle kosten darf und was eine Sperre sagen muss. Bis zum
14.10.2026 stand dieser Abschnitt in [`AGENTS.md`](../AGENTS.md). Das Zeichnen eines neuen Tiers steht in
[`docs/tiermodell-anleitung.md`](tiermodell-anleitung.md), die Regeln der Runde in [`docs/domain-model.md`](domain-model.md).

- **Abgeleitet, nicht gespeichert.** Welche Tiere offen sind, folgt aus der Gesamtzahl der Sterne
  (`core/domain/unlocks.ts`): Krokodil, Maus, Wolf am Start, dann Hai (3), Panda (5), Mensch (7),
  Löwe (9), Vampir (11), Panther (13), Säbelzahntiger (15), danach die zwei Bonusfiguren
  Venusfliegenfalle (20) und T-Rex (28). Kein Schalter, kein eigener Speicher —
  die Sicherung der Runden bringt die Freischaltungen von selbst mit.
- **Die Währung sind Sterne insgesamt, nicht Drei-Sterne-Tiere.** Der dritte Stern gelingt je Runde
  in 2,8–8,3 % der Fälle; alle zehn Stammtiere auf drei Sterne kosten im Mittel 246 Runden — und
  das nur, wenn man **gezielt** die Tiere mit fehlendem Stern spielt. Der
  Auftraggeber: „Es soll ja nicht frustrierend sein für Kinder.“ Mit den gewählten Schwellen sind
  nach 28 Runden (Median, simuliert) alle zehn Stammtiere offen, nach 49 die Venusfliegenfalle.
- **Der T-Rex ist die eine, benannte Ausnahme** (`FINAL_GOAL` in `unlocks.ts`, vom Auftraggeber
  entschieden am 13.10.2026): er ist das letzte Ziel und braucht als einziger dritte Sterne
  (mindestens sechs: 28 − 2 × 11). Simuliert sind das 181 Runden im Median. Der erste Wunsch war
  „alle auf drei Sternen“ (33 Sterne) — das wären **761 Runden** gewesen (jedes zehnte Kind über
  1 300), weil die letzten dritten Sterne an ganz bestimmten Tieren hängen und ein Kind seine
  Lieblingstiere spielt, nicht die fehlenden. **Eine Schwelle wird simuliert, bevor sie
  festgeschrieben wird — mit einem Spieler, der zufällig wechselt, nicht mit einem, der rechnet.**
- **Die Sterne der Bonusfiguren zählen mit.** Es bleibt bei einer Währung: eine Sonderzählung
  („nur die zehn Stammtiere“) ließe „Noch X Sterne“ nach einem Stern mit der Venusfliegenfalle
  stehen bleiben — das versteht kein Kind.
- **Eine neue Figur bricht die Auswahl dort, wo sie nur für die alte Zahl gebaut war.** Mit zwölf
  statt zehn Wesen scrollte die Seite auf jedem Tablet hochkant (die Reihe war `repeat(10, …)`,
  zwei Kacheln rutschten in eine zweite Zeile), und „Venusfliegenfalle“ brach auf der
  65-px-Kachel in drei Zeilen — ihre Reihe wurde 13 px höher als die anderen. Gefunden haben es
  `pruefen-bedienung.py` und `pruefen-freischaltung.py`, kein Unit-Test. Deshalb trägt die Kachel
  einen Kurznamen (`shortName` im Katalog: „Fliegenfalle“); Sätze und Vorleser nennen den vollen.
- **Stern zwei und drei gibt es ab dem ganzen Gebiss — nicht nur genau damit.** Die Regel hieß
  erst „Zahnzahl gleich Katalog“ (damit zwei eingestellte Zähne kein kurzer Weg sind) und traf
  dabei auch **mehr** Zähne: das Krokodil gab mit 12 Zähnen keinen Stern, obwohl erst der letzte
  schnappte (gemeldet vom Auftraggeber, 13.10.2026). Jetzt `earnsAllStars` in
  `core/domain/album.ts`: eingestellte Zahl ≥ Katalog, gemessen an der eingestellten Zahl. **Wer
  eine Abkürzung sperrt, prüft, ob die Sperre auch den längeren Weg trifft.**
- **Eine Regel, die still nichts gibt, wird gesagt.** Mit weniger Zähnen als das Gebiss gibt es
  nur den ersten Stern — vor dem ersten Druck steht das an der Stelle der Anleitung
  (`fewTeethWarning` in `presentation/game/quickControls.ts`, `#how-to` mit `how-to--warning`).
  Derselbe Platz, dieselbe Höhe: eine eigene Zeile hätte auf 320 × 568 keinen Raum (17 px über der
  Leiste). **Grenze:** bei einem einzigen Zahn steht dort „Nur noch ein Zahn — der ist garantiert
  scharf!“, die Anleitung ist dann ausgeblendet und mit ihr die Warnung.
- **Sterne und Sperre malt ein Durchgang** (`presentation/game/albumBadges.ts`): beide setzen die
  Beschriftung der Kachel; zwei Module überschrieben einander je nach Reihenfolge ihrer Zuhörer.
- **Eine gesperrte Kachel ist nicht `disabled`.** Der Tipp muss ankommen, um sagen zu können, was
  fehlt (`aria-disabled`, Marke an der Kachel, Satz für den Vorleser).
- **Was nach dem Biss dazukommt, liegt über der Bühne, nicht im Ergebnis-Kasten.** Die Spielseite
  scrollt auf keinem Gerät; jede Zeile mehr im Kasten bräche das auf kleinen Handys.
- **Gefeiert wird nur nach einem eigenen Biss.** Runden von außen (Sicherung nach geleertem Profil,
  anderer Tab, Import) öffnen die Tiere still — sonst fiele bei jedem Start im Kinderprofil Konfetti.
- **Jede Browser-Sonde bringt ein Protokoll mit, das alle Tiere öffnet** (`scripts/freischaltung.py`).
  Ohne es fällt ein eingestelltes gesperrtes Tier still auf das Krokodil zurück, und die Sonde
  misst das falsche Tier, ohne zu scheitern. **Wer eine Schwelle anhebt oder eine Figur ergänzt,
  rechnet nach, ob dieses Protokoll sie noch öffnet** — es trug 16 Sterne, der T-Rex braucht 28
  (jetzt: zehn Tiere mit je drei Sternen).
- **Das Skript einer `.astro`-Seite prüft kein Werkzeug des Gates.** `tsc` liest nur `src/**/*.ts`,
  jsdom lädt das Seitenskript nicht. Beim Bau der Freischaltung stand `settings` hinter seiner
  ersten Verwendung: Gate grün, Bau grün — und im Browser kein einziger Zahn („Cannot access …
  before initialization“). Gefunden hat es erst die Sonde. Wer das Seitenskript umstellt, lädt die
  gebaute Seite und sieht nach, ob Zähne auf der Bühne stehen.
