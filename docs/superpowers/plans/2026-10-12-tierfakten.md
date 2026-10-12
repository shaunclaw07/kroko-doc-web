# „Wusstest du?" — ein Satz zum echten Tier nach dem Biss — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nach jedem Biss steht unter dem Ergebnis ein kindgerechter, belegter Satz über das echte Tier („Wusstest du? Die Nagezähne einer Maus wachsen ihr ganzes Leben lang.").

**Architecture:** Der Satz ist ein neues Feld `fact` im Katalog (`core/domain/creature.ts`), neben `note` und `realTeeth`. Die Steuerung schreibt ihn beim Biss in ein neues Element `#result-fact` im Ergebnis-Kasten. Kein neuer Port, keine neue Mappe, kein Zustand.

**Tech Stack:** Astro 5, TypeScript, Vitest + jsdom, CSS ohne Framework, Playwright (Python) für die Sonde.

**Spec:** Es gibt kein eigenes Spec-Dokument. Grundlage sind die Entscheidungen unten; sie wandern in Aufgabe 4 als Nachtrag nach `docs/plan.md`. Vor dem Bau lesen: `AGENTS.md` (Fallen), `docs/language-guidelines.md`, `docs/domain-model.md` (Ehrlichkeitsregeln).

## Entscheidungen (Empfehlung, vom Auftraggeber zu bestätigen)

1. **Eigenes Feld statt `note`.** `note` spricht Spieltechnik („1–3 Zähne gleichzeitig scharf") und steht im Regeln-Blatt. Der neue Satz spricht über das **echte** Tier und ist für Kinder geschrieben.
2. **Ein Satz je Tier, kein Wechsel.** Mehrere Sätze je Tier mit Zufallswahl wären eine zweite Zufallsebene und zehnmal so viel Belegarbeit. Erst wenn der eine Satz gefällt.
3. **Der Satz sagt nie etwas über scharfe Zähne.** „Die Fangzähne sind am gefährlichsten" wäre im Spiel gelogen — die Auswahl zieht gleichverteilt. Ein Test verbietet die Wörter.
4. **Wo der Platz fehlt, entfällt der Satz — und das steht in der Doku.** Auf 320 × 568 bleiben dem Ergebnis rund 110 px (Kommentar in `app.css` bei `.result`). Die Sonde entscheidet, ab welcher Höhe der Satz gezeigt wird.

## Global Constraints

- Sprache: Code, Namen, Meldungen **englisch**; Kommentare, Doku, UI-Texte, Commit-Beschreibungen **deutsch**.
- Gate ist beides: `pnpm typecheck` **und** `pnpm test:run` (`pnpm gate`). Exit-Code nie über eine Pipe prüfen.
- Niemals `git add -A` — explizite Pfade. Vor jedem Commit `git status --short`.
- Gearbeitet wird auf dem Zweig `tierfakten`, **nicht** auf `main` (ein Push auf `main` veröffentlicht). Kein Push ohne Auftrag.
- Jeder Satz: höchstens **110 Zeichen**, endet mit Punkt oder Ausrufezeichen, enthält keines der Wörter `scharf`, `gefährlich`, `meist`, `häufiger`.
- Jeder Satz ist **belegt**: Quelle (Titel, Fundstelle, Abrufdatum) steht im Nachtrag in `docs/plan.md`. Ein Satz ohne Quelle wird nicht gebaut.
- Auf den acht Größen 320×568, 360×640, 390×844, 412×915, 768×1024, 1024×768, 820×1180, 1180×820 scrollt die Spielseite nach dem Biss nicht.
- Keine `.test.ts` in `src/pages/`.
- Die Sonden laufen hier mit `python scripts/<name>.py` (`uv` fehlt auf diesem Rechner). Der Server muss laufen: `pnpm dev`, Adresse `http://localhost:4321`.

## Review Focus

1. **Längster Satz auf dem schmalsten Handy:** die Seite scrollt nach dem Biss nicht, die Leiste verdeckt nichts. → Sonde, Aufgabe 3.
2. **Zwei Spieler:** Titel „Spieler 2 hat verloren!", längster Ergebnistext **und** Satz zusammen. → Sonde, Aufgabe 3.
3. **Neue Runde nach dem Biss:** der Satz verschwindet mit dem Ergebnis; nach einem Tierwechsel steht beim nächsten Biss der Satz des **neuen** Tiers. → Test, Aufgabe 2.
4. **Unbekanntes Tier in den Einstellungen:** `loadSettings` macht daraus das Krokodil — der Satz ist dann der des Krokodils, kein Fehler. → bereits durch `localStorageSettings.test.ts` gedeckt, hier nur gegenlesen.
5. **Bildschirmleser:** `#result-panel` ist `role="status"`; der Satz wird mit vorgelesen und darf nicht vor dem Ergebnis stehen. → Test auf die Reihenfolge im Markup, Aufgabe 2.

---

### Task 1: Der Satz im Katalog

**Files:**
- Modify: `src/core/domain/creature.ts` (Interface, zehn Einträge, `validateCreature`)
- Test: `src/core/domain/creature.test.ts`

**Interfaces:**
- Produces: `CreatureDefinition.fact: string` — ein Satz über das echte Tier, ohne „Wusstest du?" davor.
- Produces: `export const MAX_FACT_LENGTH = 110` in `core/domain/creature.ts`.

- [ ] **Step 1: Zweig anlegen**

```bash
git switch -c tierfakten
```

- [ ] **Step 2: Die zehn Sätze belegen**

Jeden Satz der Tabelle nachschlagen und die Quelle notieren (Titel, Fundstelle, Abrufdatum). Drei sind im Baum schon belegt (`docs/plan.md`, „Nachtrag 11.10.2026 (spät): Panther und Säbelzahntiger"). Stimmt ein Satz nicht, wird er **umformuliert**, bis er zur Quelle passt — nicht umgekehrt.

| Tier | Satz | Zu belegen |
|---|---|---|
| crocodile | Einem Krokodil wachsen ausgefallene Zähne immer wieder nach. | Zahnwechsel lebenslang |
| wolf | Ein Wolf hat 42 Zähne. Das sind zehn mehr, als ein erwachsener Mensch hat. | 42 Zähne; Mensch 32 |
| human | Du bekommst zweimal Zähne: erst 20 Milchzähne, später bis zu 32 bleibende. | 20 Milchzähne, 32 bleibende |
| shark | Ein Hai verliert ständig Zähne. Dahinter wartet schon die nächste Reihe. | Revolvergebiss |
| mouse | Die Nagezähne einer Maus wachsen ihr ganzes Leben lang. Darum nagt sie so viel. | Wurzellose Nagezähne |
| vampire | Vampire gibt es nur in Geschichten. Ihre spitzen Zähne heißen bei dir Eckzähne. | Eckzahn (Caninus) |
| panda | Ein Panda frisst fast nur Bambus. Dafür hat er breite Mahlzähne. | Bambusanteil der Nahrung |
| lion | Ein Löwe hat 30 Zähne. Die vier langen heißen Fangzähne. | schon belegt (`docs/plan.md`) |
| panther | Ein schwarzer Panther ist ein Leopard mit schwarzem Fell. | schon belegt (`docs/plan.md`) |
| sabertooth | Seine Säbel ragten bis zu 20 cm aus dem Kiefer. Das Tier ist seit rund 12.000 Jahren ausgestorben. | schon belegt (`docs/plan.md`) |

Dabei gleich prüfen: `realTeeth: 32` beim Krokodil. Krokodile tragen je nach Art deutlich mehr Zähne (Nilkrokodil: 64 bis 68 — **nachschlagen**). Ist der Wert falsch, wird er in einem **eigenen** Commit berichtigt (die Zahl steht im Regeln-Blatt als „Echtes Gebiss: 32 Zähne").

- [ ] **Step 3: Den fallenden Test schreiben**

In `src/core/domain/creature.test.ts` am Ende von `describe` ergänzen (Import `MAX_FACT_LENGTH` aus `./creature` dazunehmen):

```ts
  it('trägt für jedes Tier einen kurzen Satz über das echte Tier', () => {
    for (const creature of listCreatures()) {
      expect(creature.fact.trim().length, creature.id).toBeGreaterThan(0);
      expect(creature.fact.length, creature.id).toBeLessThanOrEqual(MAX_FACT_LENGTH);
      expect(creature.fact, creature.id).toMatch(/[.!]$/);
    }
  });

  it('behauptet in keinem Satz etwas über scharfe Zähne — die zieht allein der Zufall', () => {
    for (const creature of listCreatures()) {
      expect(creature.fact, creature.id).not.toMatch(/scharf|gefährlich|meist|häufiger/i);
    }
  });

  it('meldet einen leeren oder zu langen Satz als Widerspruch', () => {
    const base = listCreatures()[0];
    if (!base) throw new Error('catalog is empty');
    expect(validateCreature({ ...base, fact: '  ' })).toContain(`${base.id}: fact is empty`);
    expect(validateCreature({ ...base, fact: 'x'.repeat(MAX_FACT_LENGTH + 1) })).toContain(
      `${base.id}: fact is longer than ${MAX_FACT_LENGTH} characters`,
    );
  });
```

Fehlen `listCreatures` oder `validateCreature` im Import der Testdatei, ergänzen.

- [ ] **Step 4: Lauf — der Test muss fallen**

Run: `pnpm vitest run src/core/domain/creature.test.ts`
Expected: FAIL (`MAX_FACT_LENGTH` gibt es nicht; `pnpm typecheck` meldet zusätzlich `fact` als unbekanntes Feld).

- [ ] **Step 5: Katalog ergänzen**

In `src/core/domain/creature.ts`:

```ts
/** Längster erlaubter Satz: mehr passt nach dem Biss nicht unter das Ergebnis (gemessen, Sonde). */
export const MAX_FACT_LENGTH = 110;
```

Im Interface nach `note`:

```ts
  /** Ein Satz über das **echte** Tier, für Kinder — steht nach dem Biss unter dem Ergebnis. */
  fact: string;
```

In jedem der zehn Einträge nach `note:` die Zeile `fact: '…',` mit dem (belegten) Satz aus der Tabelle. In `validateCreature` vor `return problems;`:

```ts
  if (creature.fact.trim().length === 0) {
    problems.push(`${creature.id}: fact is empty`);
  }
  if (creature.fact.length > MAX_FACT_LENGTH) {
    problems.push(`${creature.id}: fact is longer than ${MAX_FACT_LENGTH} characters`);
  }
```

- [ ] **Step 6: Lauf — grün, dann Gate**

Run: `pnpm vitest run src/core/domain/creature.test.ts` → PASS.
Run: `pnpm gate` → beide Teile grün. Meldet `tsc` ein Objekt ohne `fact` (Testdaten, die ein `CreatureDefinition` von Hand bauen), dort `fact: 'Ein Satz.'` ergänzen.

- [ ] **Step 7: Commit**

```bash
git add src/core/domain/creature.ts src/core/domain/creature.test.ts
git commit -m "Katalog: jedes Tier traegt einen belegten Satz ueber das echte Tier"
```

---

### Task 2: Der Satz steht nach dem Biss unter dem Ergebnis

**Files:**
- Modify: `src/pages/index.astro` (im `#result-panel`, nach `#result-text`)
- Modify: `src/presentation/game/gameController.ts` (`showResult`, Import)
- Modify: `src/presentation/styles/app.css` (nach `.result p`)
- Test: `src/presentation/game/gameController.test.ts`, `src/bedienleiste.test.ts`

**Interfaces:**
- Consumes: `getCreature(id).fact` aus Aufgabe 1.
- Produces: Element `<p class="result__fact" id="result-fact">` mit dem Text `Wusstest du? <Satz>`.

- [ ] **Step 1: Die fallenden Tests schreiben**

In `src/presentation/game/gameController.test.ts` die Konstante `DOM` anpassen — die Zeile mit `result-panel` wird zu:

```ts
  <section id="result-panel" class="hidden"><h2 id="result-title"></h2><p id="result-text"></p><p id="result-fact"></p></section>
```

Im `describe('GameController in der Bühne', …)` ergänzen (Import `getCreature` aus `'../../core/domain/creature'`):

```ts
  it('nennt nach dem Biss einen Satz über das echte Tier', () => {
    build([4], { creature: 'mouse' });
    expect(document.getElementById('result-fact')?.textContent).toBe('');
    click(4);
    expect(document.getElementById('result-fact')?.textContent).toBe(
      `Wusstest du? ${getCreature('mouse').fact}`,
    );
  });

  it('nennt nach einem Tierwechsel den Satz des neuen Tiers', () => {
    const { controller } = build([4], { creature: 'mouse' });
    click(4);
    controller.applySettings(settings({ creature: 'wolf' }));
    click(4);
    expect(document.getElementById('result-fact')?.textContent).toBe(
      `Wusstest du? ${getCreature('wolf').fact}`,
    );
  });
```

In `src/bedienleiste.test.ts` im Fall „zeigt das Ergebnis auf der Seite und nicht in einem Blatt" ergänzen:

```ts
    // Der Satz zum echten Tier steht NACH dem Ergebnis — ein Bildschirmleser liest in dieser Reihenfolge.
    expect(SPIEL.indexOf('id="result-fact"')).toBeGreaterThan(SPIEL.indexOf('id="result-text"'));
```

- [ ] **Step 2: Lauf — beide müssen fallen**

Run: `pnpm vitest run src/presentation/game/gameController.test.ts src/bedienleiste.test.ts`
Expected: FAIL (`result-fact` bleibt leer; im Markup fehlt die Kennung, `indexOf` liefert −1).

- [ ] **Step 3: Markup**

In `src/pages/index.astro` im `#result-panel` nach `<p id="result-text"></p>`:

```astro
        <!-- Ein Satz über das echte Tier (Katalogfeld `fact`). Auf niedrigen Handys entfällt er:
             dort reicht die Höhe über der Leiste nicht (gemessen, scripts/pruefen-bedienung.py). -->
        <p class="result__fact" id="result-fact"></p>
```

- [ ] **Step 4: Steuerung**

In `src/presentation/game/gameController.ts` importieren:

```ts
import { getCreature } from '../../core/domain/creature';
```

In `showResult()` vor dem Aufruf `this.deps.sound.play(…)`:

```ts
    // Der Satz gehört zum Tier **dieser** Runde — nicht zur Einstellung, die sich ändern kann.
    this.setText('result-fact', `Wusstest du? ${getCreature(this.round.creatureId).fact}`);
```

- [ ] **Step 5: Stil**

In `src/presentation/styles/app.css` nach dem Block `.result p { … }`:

```css
/* Der Satz zum echten Tier: abgesetzt und leiser als das Ergebnis — er ist die Zugabe. */
.result .result__fact {
  margin-top: 0.3rem;
  padding-top: 0.3rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}
```

`.result .result__fact` (0-2-0) schlägt `.result p` (0-1-1) — gegeneinander geprüft, siehe Falle „Klassenregel verliert gegen Element-Klassen-Selektor" in `AGENTS.md`.

- [ ] **Step 6: Lauf — grün, dann Gate**

Run: `pnpm vitest run src/presentation/game/gameController.test.ts src/bedienleiste.test.ts` → PASS.
Run: `pnpm gate` → grün.

- [ ] **Step 7: Commit**

```bash
git add src/pages/index.astro src/presentation/game/gameController.ts src/presentation/game/gameController.test.ts src/presentation/styles/app.css src/bedienleiste.test.ts
git commit -m "Spielseite: nach dem Biss steht ein Satz ueber das echte Tier unter dem Ergebnis"
```

---

### Task 3: Messen, wo der Satz passt

**Files:**
- Modify: `scripts/pruefen-bedienung.py` (Konstante `LAENGSTES`, Stelle „längstes Ergebnis")
- Modify: `src/presentation/styles/app.css` (Höhenregel für `.result__fact`)

**Interfaces:**
- Consumes: `#result-fact` aus Aufgabe 2, `MAX_FACT_LENGTH = 110` aus Aufgabe 1.

- [ ] **Step 1: Die Sonde um den längsten Satz erweitern**

In `scripts/pruefen-bedienung.py` nach der Konstante `LAENGSTES`:

```python
# Der längste erlaubte Satz zum echten Tier (MAX_FACT_LENGTH = 110 in core/domain/creature.ts).
# Kein echter Satz ist so lang — gemessen wird die Grenze, nicht der heutige Katalog.
LAENGSTER_SATZ = "Wusstest du? " + ("Seine Säbel ragten bis zu 20 cm aus dem Kiefer. " * 3)[:110]
```

An der Stelle, an der `LAENGSTES` in `#result-text` geschrieben wird, die Zeile ersetzen durch:

```python
                page.evaluate(
                    "([t, f]) => { document.getElementById('result-text').textContent = t;"
                    " document.getElementById('result-fact').textContent = f; }",
                    [LAENGSTES, LAENGSTER_SATZ],
                )
```

- [ ] **Step 2: Messen**

```bash
pnpm dev          # in einem zweiten Terminal, läuft weiter
python scripts/pruefen-bedienung.py
```

Die Ausgabe **ansehen**. Erwartet: Auffälligkeiten „nach dem Biss (längstes Ergebnis)" auf den niedrigen Größen (sicher 320 × 568, wahrscheinlich 360 × 640). Notieren, auf welchen Größen und um wie viele Pixel.

- [ ] **Step 3: Den Satz dort ausblenden, wo er nicht passt**

Die Grenze ist die **Höhe**, nicht die Breite. In `src/presentation/styles/app.css` nach `.result .result__fact`:

```css
/* Unter dieser Höhe reicht der Platz über der Leiste nicht für Ergebnis **und** Satz (gemessen am
   <Datum> auf <Größen>: <N> px zu viel). Der Satz entfällt dort — das Ergebnis geht vor. */
@media (max-height: 660px) {
  .result .result__fact {
    display: none;
  }
}
```

`660px` ist der Startwert (deckt 320 × 568 und 360 × 640). Die Platzhalter im Kommentar mit den Messwerten aus Schritt 2 füllen. Passt es auch bei 390 × 844 nicht, zuerst die Schrift des Satzes auf `0.8rem` setzen und neu messen; erst danach die Grenze anheben.

- [ ] **Step 4: Neu messen — 0 Auffälligkeiten**

```bash
python scripts/pruefen-bedienung.py
```

Expected: `0 Auffälligkeiten`. Zusätzlich im Browser bei 390 × 844 ansehen: Maus wählen, bis zum Biss tippen, Satz steht lesbar unter dem Ergebnis.

- [ ] **Step 5: Commit**

```bash
git add scripts/pruefen-bedienung.py src/presentation/styles/app.css
git commit -m "Sonde: laengster Tier-Satz auf acht Groessen gemessen; unter 660 px Hoehe entfaellt er"
```

---

### Task 4: Doku und Nachweis

**Files:**
- Modify: `docs/plan.md` (neuer Nachtrag am Ende)
- Modify: `README.md` (Abschnitt „Was es kann", Testzahl in „Alle Befehle")
- Modify: `docs/testing.md` (Stand)
- Modify: `docs/e2e-nachweise.md` (neuer Abschnitt mit der Messung aus Aufgabe 3)
- Modify: `AGENTS.md` („Ein neues Lebewesen ergänzen", Schritt 1: `fact` in die Feldliste)

- [ ] **Step 1: Nachtrag in `docs/plan.md`**

Überschrift `## Nachtrag <Datum> (gebaut): „Wusstest du?" nach dem Biss`. Inhalt: Auftrag im Wortlaut („Was könnte man noch für Kinder an features hinzufügen?"), die vier Entscheidungen von oben mit Grund, die Tabelle der zehn Sätze **mit Quelle**, die Messwerte der Sonde, und was abgesagt wurde (mehrere Sätze je Tier, Satz im Auswahlblatt).

- [ ] **Step 2: README, Testzahlen, AGENTS**

`pnpm test:run` fahren und die Zahl aus der Ausgabe übernehmen (vorher: 318 Tests in 25 Dateien) — in `README.md` (Tabelle „Alle Befehle") und `docs/testing.md` („Stand"). In „Was es kann" einen Punkt ergänzen: **Wusstest du?** — nach dem Biss ein belegter Satz über das echte Tier; unter 660 px Höhe entfällt er. In `AGENTS.md` Schritt 1 der Liste „Ein neues Lebewesen ergänzen" um `fact` erweitern.

- [ ] **Step 3: Doku prüfen und bauen**

```bash
ALT="196|2,29 s|Drei Gebisse|232 Tests|Acht Gebisse|acht Kacheln|vier breite Backenzähne|2,1–2,5 s|293 Tests|318 Tests"
ALTE_WERTE="$ALT" ALTE_WERTE_STRIKT=1 bash scripts/doku-pruefen.sh README.md docs/testing.md
ALTE_WERTE="$ALT" bash scripts/doku-pruefen.sh AGENTS.md docs/workflow.md docs/plan.md docs/e2e-nachweise.md
python scripts/doku-pfade-pruefen.py . README.md AGENTS.md docs/*.md
pnpm gate
pnpm build
```

Die Ausgabe ansehen, nicht nur den Exit-Code. In `dist/index.html` nachsehen, dass `id="result-fact"` vorkommt.

- [ ] **Step 4: Commit**

```bash
git status --short
git add docs/plan.md README.md docs/testing.md docs/e2e-nachweise.md AGENTS.md
git commit -m "Doku: Tier-Saetze mit Quellen, Messung der Sonde, Testzahlen"
```
