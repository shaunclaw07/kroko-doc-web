# Paket 7 — `AGENTS.md` auf den Einstieg kürzen

> **Vorher lesen:** `docs/plaene/00-regeln.md` — die Regeln dort gelten für jeden Schritt.
> **Braucht vorher:** — · **Risiko:** klein · Stand der Zeilenangaben: 13.10.2026

**Ziel:** `AGENTS.md` wird wieder, was sein dritter Absatz behauptet: „ein Einstiegspunkt, kein
Regelwerk. Die Regeln stehen in `/docs/`.“ Heute hat die Datei rund 690 Zeilen und wird in jeder
Sitzung ganz geladen.

**Ausgangslage** (Überschriften und Zeilen): Rückmeldung an den Nutzer 77 · Das geschlossene Maul
134 · Tiere freischalten 155 · Sicherung der Runden 214 · **Dreiunddreißig Fallen** 245 (die Zahl
steht fest in der Überschrift und stimmt nach jeder neuen Falle nicht mehr) · Ein neues Lebewesen
ergänzen 503 · Freundliche Zeichnung 566 · Basis-Pfad 659 · Veröffentlichen 674.

**Grundsatz:** Texte werden **verschoben, nicht umformuliert**. Jede Falle trägt Messwerte und
einen Anlass; eine „Zusammenfassung“ verlöre genau das.

**Schritte**

1. **Ziele anlegen und verschieben:**

   | Abschnitt | Wohin |
   |---|---|
   | Fallen | neu `docs/fallen.md`, Überschrift ohne Zahl („Fallen, die Zeit kosten“) |
   | Freundliche Zeichnung · Das geschlossene Maul | `docs/tiermodell-anleitung.md` (dessen Abschnitt 6 verweist heute zurück auf `AGENTS.md` — den Verweis umdrehen) |
   | Rückmeldung an den Nutzer (Ton, Vibration) | neu `docs/rueckmeldung.md` |
   | Tiere freischalten | neu `docs/freischaltung.md` |
   | Sicherung der Runden | `docs/sicherung-anleitung.md` (als erster Abschnitt „Regeln in Kürze“) |

2. **Was in `AGENTS.md` bleibt:** der Kopf, die drei Direktiven, der Index, die Befehle, die
   Karte, „Ein neues Lebewesen ergänzen“ als **kurze** Checkliste, Aufgaben-Tracking, Basis-Pfad,
   Veröffentlichen. Ziel: unter 200 Zeilen.
3. **Index erweitern:** je neue Datei eine Zeile — und eine Spalte oder ein Halbsatz „lies das,
   bevor du … änderst“ (Zeichnung → Anleitung; Ton, Vibration → Rückmeldung; Sterne, Schwellen →
   Freischaltung; `public/sw.js`, Blätter, Zeiger, Zeitgeber → Fallen).
4. **Querverweise im Baum nachziehen:** `git grep -n "AGENTS.md" -- docs README.md src scripts` —
   Stellen wie „als zehnte Falle in AGENTS.md“, „Einzelheiten in `AGENTS.md`, ‚Freundliche
   Zeichnung‘“, „Falle oben“ zeigen danach auf die neue Datei.
5. **Nichts verloren:** vor dem Verschieben die fett gesetzten Leitsätze zählen
   (`grep -c "^- \*\*" AGENTS.md`); danach muss die Summe über `AGENTS.md` und die Zieldateien
   gleich sein. Dann `python scripts/doku-pfade-pruefen.py . README.md AGENTS.md docs/*.md` und
   `bash scripts/doku-pruefen.sh AGENTS.md docs/*.md` — Ausgabe ansehen.

**Abnahme**

- `AGENTS.md` unter 200 Zeilen; keine Überschrift mit einer Zahl, die mitwachsen müsste.
- Die Zählung aus Schritt 5 stimmt; die Pfadprüfung findet keinen toten Verweis.
- Kein Quelltext geändert; `pnpm gate` trotzdem einmal fahren.

**Offen (Auftraggeber):** `AGENTS.md` wird als Projektanweisung in jede Sitzung geladen — die
Fallen sind dort heute **immer** im Blick. Nach dem Umzug liest ein Agent sie nur, wenn er dem
Index folgt (Direktive 1 verlangt das). Wer das Risiko nicht will, lässt die Fallen in
`AGENTS.md` und verschiebt nur die übrigen vier Abschnitte (bleiben rund 450 Zeilen).
