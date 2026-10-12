# Heranzoomen bei Rot: die letzten Drücke sehen anders aus — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ab 50 % Bissgefahr rückt die Bühne sichtbar näher an das Maul, bis zu 8 % beim letzten Zahn. Beim Biss und in der neuen Runde steht sie wieder in der Ausgangsgröße.

**Architecture:** Eine reine Funktion im Kern (`dangerZoom` in `core/domain/tension.ts`) leitet aus der Bissgefahr einen Zoom-Wert 0..1 ab — unter der Rot-Schwelle 0, an der Schwelle 0,4, beim letzten Zahn 1. Die Steuerung schreibt ihn als `--zoom` an `#stage`; das Stylesheet skaliert damit den Behälter der Zeichnung (`#croc-mount`). Skaliert wird der Behälter und nicht die Zeichnung oder die Bühne, weil `svg.creature` (`is-lunging`) und `.stage` (`is-shaking`) ihre eigene Transformation tragen. Die Vignette, die sich mit der Spannung zuzieht, gibt es schon (`.stage::after`) — sie bleibt unverändert.

**Tech Stack:** TypeScript, CSS-Variablen, Vitest mit jsdom 30 (rechnet kein CSS), Playwright (Python) für die Sonde.

**Spec:** Es gibt kein eigenes Spec-Dokument. Grundlage sind die Entscheidungen unten; sie wandern in Aufgabe 4 als Nachtrag nach `docs/plan.md`. Vor dem Bau lesen: `AGENTS.md` (Fallen „Eine Kennzahl, die aufaddiert wird, sättigt", „Eine Vorgabe, die nur für eine Beispielbreite geprüft wird", „Dekoration darf keinen Tipp abfangen", „Kein `transform` auf einem modalen `dialog`"), `docs/domain-model.md` („Spannungsdramaturgie").

**Reihenfolge der drei Pläne:** dritter von dreien — nach `2026-10-12-halten-und-loslassen.md` und `2026-10-12-tier-reagiert.md`. Er ist auch ohne die beiden baubar. Zeilennummern gelten für den Stand `0511a05`; gesucht wird nach dem **zitierten Text**.

## Entscheidungen

Vom Auftraggeber entschieden (12.10.2026): „Heranzoomen bei Rot" wird gebaut.

Im Selbst-Sparring entschieden (jede Antwort mit einer Tatsache aus dem Baum):

1. **Der Zoom wird abgeleitet, nicht hochgezählt.** `dangerZoom(tension)` steht im Kern neben `isHighDanger` und benutzt dieselbe Schwelle `HIGH_DANGER = 0,5`. Grund: die Falle „Eine Kennzahl, die aufaddiert wird, sättigt".
2. **Sprung an der Schwelle, dann Rampe.** Unter 50 % ist der Zoom 0; bei 50 % springt er auf 0,4 und wächst linear bis 1 bei 100 %. Grund: beim Krokodil ist der erste rote Druck 55,0 % — eine reine Rampe ergäbe dort 0,1, also 0,8 % Vergrößerung, unsichtbar. Mit dem Sprung sind es 0,46 → 3,7 %.
3. **Höchstens 8 %.** Nachgerechnet am breitesten Kopf: der Vampir reicht mit Kragen und Ohren von x 24 bis 616 der 640 Einheiten; um die Mitte skaliert liegt der linke Rand bei 320 − 296 × 1,08 = 0,3 — er bleibt gerade im Bild. Der Zahnring (Halbachse höchstens 240) bleibt weit innerhalb.
4. **Drehpunkt 50 % / 58 %** — die Maulmitte (`ring.cy` 265 von 460). Oben darf dabei etwas aus dem Bild laufen (Hut des Menschen, Ohrspitzen): das ist die Wirkung von „näher ran". **Kein Zahn und keine Trefferfläche** darf dadurch unerreichbar werden — die Sonde prüft das für jedes Tier, bei Standard-Zahnzahl und bei 12 Zähnen, auf 320, 390 und 820 px.
5. **Beim Biss zurück auf 0.** Bei geschlossenem Maul gibt es keine Gefahr des nächsten Drucks (Falle „Eine Anzeige muss verstummen, wenn ihre Frage wegfällt"); das Zurückfahren liest sich als Rückstoß.
6. **`prefers-reduced-motion`: gar kein Zoom.** Die vorhandene Regel schaltet nur Übergänge ab — die Bühne spränge sonst. Deshalb eine eigene Regel `transform: none`.
7. **Kein neuer Schalter.** Der Zoom ist ein Zustand der Bühne wie die Vignette.

**Schon vorhanden, deshalb nicht Teil dieses Plans:** das Abdunkeln des Randes — `.stage::after` zieht eine Vignette mit `--tension` zu (`rgba(0, 0, 0, calc(0.2 + 0.6 * var(--tension)))`).

**Abgesagt:** Zoom von Rundenbeginn an (der Wolf beginnt bei 12 %, das Krokodil bei 20 % — die Bühne stünde nie in Ruhe); Zoom auf den zuletzt gedrückten Zahn (verschöbe alle anderen Trefferflächen unter dem Finger); stärker als 8 % (der Kopf des Vampirs liefe seitlich aus dem Bild).

**Offen — nur der Auftraggeber kann es beurteilen:** ob 8 % am Handy spürbar oder zu zaghaft sind. Stellschraube: der Faktor `0.08` in `app.css` — wer ihn anhebt, fährt `scripts/pruefen-zoom.py`.

## Global Constraints

- Sprache: Code, Namen, Meldungen **englisch**; Kommentare, Doku, UI-Texte, Commit-Beschreibungen **deutsch**.
- Gate ist beides: `pnpm typecheck` **und** `pnpm test:run` (`pnpm gate`). Exit-Code nie über eine Pipe prüfen.
- Niemals `git add -A` — explizite Pfade. Vor jedem Commit `git status --short`.
- Direkte Commits auf `main`. **Kein Push.**
- Der Kern bleibt rein: `dangerZoom` kennt kein DOM, keine Uhr, keine Pakete (`src/architecture.test.ts` prüft das).
- Anzeigewerte werden aus dem Modell **abgeleitet**, nie hochgezählt.
- Nichts darf den Ausgang verraten: der Zoom hängt nur an der öffentlichen Bissgefahr.
- Die Trefferfläche eines Zahns darf durch den Zoom **nicht kleiner** werden und nicht unter ein anderes Element geraten.
- Geprüft wird auf der **schmalsten** Bühne (320 px Blick) und nicht nur auf einer Beispielbreite.
- Browser-Schnittstellen nie am globalen `window`.
- Windows, Python-Sonden: `PYTHONIOENCODING=utf-8` davor setzen.

## Review Focus

- **Schmalste Bühne, 12 Zähne, voller Zoom:** jeder Zahn bleibt in der Mitte seiner Trefferfläche drückbar. → Sonde in Aufgabe 3 (alle Tiere × 2 Zahnzahlen × 3 Breiten).
- **Unsinnige Bissgefahr** (`NaN`, negativ, über 1): kein `NaN` in `--zoom`. → Test in Aufgabe 1 („klemmt unsinnige Werte").
- **Maul zu oder neue Runde:** der Zoom steht auf 0, auch wenn der letzte Druck 100 % hatte. → Tests in Aufgabe 2 („steht nach dem Biss wieder auf 0", „steht nach einer neuen Runde wieder auf 0").
- **Ein einziger Zahn:** die Runde beginnt bei 100 % — die Bühne ist von Anfang an herangerückt und der eine Zahn bleibt drückbar. → Test in Aufgabe 2 und Sonde in Aufgabe 3.
- **Reduzierte Bewegung:** gar keine Skalierung statt eines Sprungs. → Sonde in Aufgabe 3.

## Dateien

| Datei | Verantwortung in diesem Plan |
|---|---|
| `src/core/domain/tension.ts` | `dangerZoom` und `ZOOM_ENTRY` |
| `src/core/domain/tension.test.ts` | Rechnung des Zooms |
| `src/presentation/game/gameController.ts` | `--zoom` an die Bühne schreiben |
| `src/presentation/game/gameController.test.ts` | Prüfsonde dazu |
| `src/presentation/styles/app.css` | Skalierung von `#croc-mount` |
| `scripts/pruefen-zoom.py` | Sonde im echten Browser (neu) |
| `AGENTS.md`, `README.md`, `docs/domain-model.md`, `docs/testing.md`, `docs/workflow.md`, `docs/plan.md`, `docs/e2e-nachweise.md` | Doku nachziehen |

---

### Task 1: Der Zoom als abgeleitete Größe im Kern

**Files:**
- Modify: `src/core/domain/tension.ts`
- Test: `src/core/domain/tension.test.ts`

**Interfaces:**
- Consumes: `HIGH_DANGER` (0,5) und die private Hilfe `clamp01` in derselben Datei.
- Produces: `export const ZOOM_ENTRY = 0.4` und `export function dangerZoom(tension: number): number` (Rückgabe 0..1).

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

In `src/core/domain/tension.test.ts` die Importliste aus `'./tension'` um `HIGH_DANGER` (falls noch nicht dabei), `ZOOM_ENTRY` und `dangerZoom` ergänzen und nach dem Block `describe('pulseInterval', ...)` einfügen:

```ts
describe('dangerZoom', () => {
  it('bleibt unter der Rot-Schwelle bei null', () => {
    expect(dangerZoom(0)).toBe(0);
    expect(dangerZoom(0.2)).toBe(0);
    expect(dangerZoom(HIGH_DANGER - 0.001)).toBe(0);
  });

  it('springt an der Schwelle auf ZOOM_ENTRY und erreicht beim letzten Zahn genau 1', () => {
    expect(dangerZoom(HIGH_DANGER)).toBeCloseTo(ZOOM_ENTRY, 6);
    expect(dangerZoom(1)).toBe(1);
  });

  it('wächst zwischen Schwelle und letztem Zahn linear', () => {
    // Krokodil, vorletzter Druck: 55,0 % Bissgefahr.
    expect(dangerZoom(0.55)).toBeCloseTo(0.46, 6);
    expect(dangerZoom(0.75)).toBeCloseTo(0.7, 6);
    expect(dangerZoom(0.6)).toBeLessThan(dangerZoom(0.8));
  });

  it('klemmt unsinnige Werte', () => {
    expect(dangerZoom(-3)).toBe(0);
    expect(dangerZoom(7)).toBe(1);
    expect(dangerZoom(Number.NaN)).toBe(0);
  });
});
```

- [ ] **Step 2: Scheitern ansehen**

Run: `pnpm vitest run src/core/domain/tension.test.ts`
Expected: FAIL — `dangerZoom is not a function` (bzw. Typfehler zum fehlenden Export).

- [ ] **Step 3: Die Rechnung schreiben**

In `src/core/domain/tension.ts` direkt **nach** der Funktion `isHighDanger` einfügen:

```ts
/** Zoom an der Rot-Schwelle: ein sichtbarer Sprung, damit „ab jetzt wird es ernst" zu sehen ist. */
export const ZOOM_ENTRY = 0.4;

/**
 * Wie nah die Bühne an das Maul rückt, 0..1 — **abgeleitet** aus der Bissgefahr, nicht hochgezählt.
 * Unter der Rot-Schwelle 0, an der Schwelle `ZOOM_ENTRY`, beim letzten Zahn genau 1. Der Sprung ist
 * Absicht: der erste rote Druck des Krokodils liegt bei 55 %, eine reine Rampe wäre dort unsichtbar.
 */
export function dangerZoom(tension: number): number {
  const level = Number.isFinite(tension) ? clamp01(tension) : 0;
  if (level < HIGH_DANGER) {
    return 0;
  }
  return ZOOM_ENTRY + (1 - ZOOM_ENTRY) * ((level - HIGH_DANGER) / (1 - HIGH_DANGER));
}
```

- [ ] **Step 4: Tests laufen lassen**

Run: `pnpm vitest run src/core/domain/tension.test.ts`
Expected: PASS, vier Fälle mehr als vorher.

- [ ] **Step 5: Gate und Commit**

Run: `pnpm gate`, danach `echo "gate=$?"` in eigener Zeile. Expected: `gate=0` (der Schichten-Wächter `src/architecture.test.ts` bleibt grün).

```bash
git status --short
git add src/core/domain/tension.ts src/core/domain/tension.test.ts
git commit -m "Kern: Zoom der Bühne aus der Bissgefahr abgeleitet — null unter der Rot-Schwelle, eins beim letzten Zahn"
```

---

### Task 2: Die Bühne rückt heran

**Files:**
- Modify: `src/presentation/game/gameController.ts`
- Modify: `src/presentation/styles/app.css`
- Test: `src/presentation/game/gameController.test.ts`

**Interfaces:**
- Consumes: `dangerZoom(tension: number): number` (Task 1).
- Produces: CSS-Variable `--zoom` (Zahl mit drei Nachkommastellen, `0.000` bis `1.000`) am Element `#stage`; Skalierung von `#croc-mount` um `1 + 0.08 × --zoom`.

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

In `src/presentation/game/gameController.test.ts` **innerhalb** von `describe('GameController in der Bühne', ...)` einfügen:

```ts
  function zoom(): string | undefined {
    return document.getElementById('stage')?.style.getPropertyValue('--zoom');
  }

  it('lässt die Bühne am Rundenbeginn in Ruhe (Krokodil: 20 % Bissgefahr)', () => {
    build([10]);
    expect(zoom()).toBe('0.000');
  });

  it('rückt ab der Rot-Schwelle heran — abgeleitet aus der Bissgefahr des nächsten Drucks', () => {
    build([10]);
    // Krokodil, 10 Zähne: der 8. Druck hat 40,7 % (noch nicht rot), der 9. Druck 55,0 %.
    for (const tooth of [1, 2, 3, 4, 5, 6, 7]) click(tooth);
    expect(zoom()).toBe('0.000');
    click(8);
    expect(zoom()).toBe('0.460');
    click(9);
    expect(zoom()).toBe('1.000');
  });

  it('ist bei einem einzigen Zahn von Anfang an ganz herangerückt', () => {
    build([1], { teethOverride: 1 });
    expect(zoom()).toBe('1.000');
  });

  it('steht nach dem Biss wieder auf 0', () => {
    build([1], { teethOverride: 1 });
    click(1);
    expect(document.getElementById('stage')?.dataset.status).toBe('snapped');
    expect(zoom()).toBe('0.000');
  });

  it('steht nach einer neuen Runde wieder auf 0', () => {
    const { controller } = build([10]);
    for (const tooth of [1, 2, 3, 4, 5, 6, 7, 8]) click(tooth);
    expect(zoom()).toBe('0.460');
    controller.resetRound();
    expect(zoom()).toBe('0.000');
  });
```

- [ ] **Step 2: Scheitern ansehen**

Run: `pnpm vitest run src/presentation/game/gameController.test.ts`
Expected: FAIL — die fünf neuen Fälle rot (`expected '' to be '0.000'`).

- [ ] **Step 3: Den Wert schreiben**

In `src/presentation/game/gameController.ts`:

(a) Im Import aus `'../../core/domain/tension'` den Namen `dangerZoom` ergänzen (alphabetisch vor `isHighDanger`).

(b) In `render()` direkt **nach** der Zeile `this.stage?.style.setProperty('--tension', this.tension.toFixed(3));` einfügen:

```ts
    // Ab der Rot-Schwelle rückt die Bühne heran. Bei geschlossenem Maul gibt es keinen nächsten
    // Druck — dann auch keinen Zoom (wie die Gefahr-Anzeige, die dort verstummt).
    this.stage?.style.setProperty('--zoom', (roundOpen ? dangerZoom(this.tension) : 0).toFixed(3));
```

- [ ] **Step 4: Tests laufen lassen**

Run: `pnpm vitest run src/presentation/game/gameController.test.ts`
Expected: PASS. Zeigt der Fall „rückt ab der Rot-Schwelle heran" `0.459` oder `0.461`, liegt es an der Rundung der Bissgefahr: den erwarteten Wert **nicht** raten, sondern mit `dangerZoom(tensionForPress({ pressIndex: 9, teeth: 10, mode: 'original', liveTeethMin: 1, liveTeethMax: 3 })).toFixed(3)` im Test berechnen (beide Funktionen aus `core/domain/tension` importieren).

- [ ] **Step 5: Das Stylesheet ergänzen**

In `src/presentation/styles/app.css` direkt **vor** dem Kommentar `/* --- Bühne: Blick von vorne oben in das offene Maul … */` (die Zeile über der Regel `.creature { display: block; … }`) einfügen:

```css
/* Heranzoomen bei Rot: die Steuerung schreibt --zoom (0..1, abgeleitet aus der Bissgefahr) an die
   Bühne. Skaliert wird der **Behälter** der Zeichnung — die Zeichnung selbst (`is-lunging`) und die
   Bühne (`is-shaking`) tragen eigene Transformationen. Höchstens 8 %: beim breitesten Kopf (Vampir,
   x 24…616 von 640) bleibt der Rand damit gerade im Bild. Drehpunkt ist die Maulmitte. Wer den
   Faktor anhebt, fährt scripts/pruefen-zoom.py. */
#croc-mount {
  transform-origin: 50% 58%;
  transform: scale(calc(1 + 0.08 * var(--zoom, 0)));
  transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
}
```

und im Block `@media (prefers-reduced-motion: reduce) { … }` nach der Regel für `*` ergänzen:

```css
  /* Ohne Übergang spränge die Bühne — bei reduzierter Bewegung rückt sie gar nicht heran. */
  #croc-mount {
    transform: none;
  }
```

- [ ] **Step 6: Gate und Bau**

Run: `pnpm gate` und `pnpm build`, Exit-Codes je in eigener Zeile prüfen. Expected: beide `0`.

- [ ] **Step 7: Commit**

```bash
git status --short
git add src/presentation/game/gameController.ts src/presentation/game/gameController.test.ts src/presentation/styles/app.css
git commit -m "Bühne: ab 50 % Bissgefahr rückt das Maul heran, beim Biss und in der neuen Runde zurück"
```

---

### Task 3: Sonde im echten Browser

Ob ein herangerückter Zahn noch getroffen wird, ist eine Frage von Pixeln — jsdom rechnet weder CSS noch Geometrie. Die Falle „Eine Vorgabe, die nur für eine Beispielbreite geprüft wird" verlangt die schmalste Bühne.

**Files:**
- Create: `scripts/pruefen-zoom.py`

**Interfaces:**
- Consumes: `#stage`, `#croc-mount`, `.tooth`, `.tooth__hit`, `.tooth__shape`, CSS-Variable `--zoom`, Ablage-Schlüssel `zahn_agent:settings:v1`.
- Produces: Ausgabezeile `Auffälligkeiten: <n>` und Exit-Code 0/1.

- [ ] **Step 1: Die Sonde schreiben**

`scripts/pruefen-zoom.py`:

```python
"""
Zoom-Sonde: prüft im **echten Browser**, dass die herangerückte Bühne keinen Zahn unerreichbar
macht. jsdom rechnet weder CSS noch Geometrie.

Teil A — Geometrie bei vollem Zoom, für jedes Tier, bei Standard-Zahnzahl und bei 12 Zähnen, auf
320, 390 und 820 px Breite. `--zoom` wird dafür von Hand auf 1 gesetzt (der Übergang ist
abgeschaltet). Erwartet je Lage:

    - in der Mitte jeder Trefferfläche liegt ihr eigener Zahn (`elementFromPoint`)
    - keine Trefferfläche ist kleiner geworden
    - jede Zahnzeichnung, die vorher ganz in der Bühne lag, liegt auch danach ganz darin

Teil B — der echte Ablauf:

    - zehn Zähne am Start: keine Skalierung
    - ein Zahn (100 % Bissgefahr): Skalierung 1,08; nach dem Biss wieder keine
    - mit `prefers-reduced-motion`: gar keine Skalierung

Aufruf (der Entwicklungsserver muss laufen):
    uv run --with playwright python scripts/pruefen-zoom.py [URL]

Rückgabe 0 = in Ordnung, 1 = Fund.
"""
import json
import sys

from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321"
SETTINGS_KEY = "zahn_agent:settings:v1"
TIERE = ["crocodile", "wolf", "human", "shark", "mouse", "vampire", "panda", "lion", "panther", "sabertooth"]
BREITEN = [320, 390, 820]


def einstellungen(tier: str, zaehne) -> dict:
    return {"mode": "original", "players": 1, "sound": False, "vibration": False,
            "creature": tier, "teethOverride": zaehne}


MESSEN = """() => {
  const buehne = document.getElementById('stage').getBoundingClientRect();
  const drin = (r) => r.left >= buehne.left - 0.5 && r.right <= buehne.right + 0.5
    && r.top >= buehne.top - 0.5 && r.bottom <= buehne.bottom + 0.5;
  return Array.from(document.querySelectorAll('#stage .tooth')).map((tooth) => {
    const hit = tooth.querySelector('.tooth__hit').getBoundingClientRect();
    const form = tooth.querySelector('.tooth__shape').getBoundingClientRect();
    const oben = document.elementFromPoint(hit.left + hit.width / 2, hit.top + hit.height / 2);
    return {
      zahn: tooth.dataset.tooth,
      trefferBreite: hit.width,
      eigener: !!oben && tooth.contains(oben),
      formDrin: drin(form),
    };
  });
}"""

SKALA = """() => {
  const m = getComputedStyle(document.getElementById('croc-mount')).transform;
  if (m === 'none') return 1;
  const werte = m.replace('matrix(', '').replace(')', '').split(',').map(Number);
  return +werte[0].toFixed(3);
}"""


def main() -> int:
    funde: list[str] = []

    def pruefe(gut: bool, text: str, laut: bool = True) -> None:
        if laut or not gut:
            print(("  ok    " if gut else "  FUND  ") + text)
        if not gut:
            funde.append(text)

    with sync_playwright() as p:
        browser = p.chromium.launch()

        def neue_seite(werte: dict, breite: int = 390, ruhe: bool = False):
            kontext = browser.new_context(viewport={"width": breite, "height": 844},
                                          reduced_motion="reduce" if ruhe else "no-preference")
            seite = kontext.new_page()
            seite.goto(URL, wait_until="load")
            seite.evaluate("([k, v]) => localStorage.setItem(k, v)", [SETTINGS_KEY, json.dumps(werte)])
            seite.reload(wait_until="load")
            seite.wait_for_timeout(500)
            return seite

        print("A — Geometrie bei vollem Zoom")
        for breite in BREITEN:
            for tier in TIERE:
                for zaehne in (None, 12):
                    seite = neue_seite(einstellungen(tier, zaehne), breite)
                    seite.add_style_tag(content="#croc-mount { transition: none !important; }")
                    seite.evaluate("() => document.getElementById('stage').style.setProperty('--zoom', '0')")
                    vorher = seite.evaluate(MESSEN)
                    seite.evaluate("() => document.getElementById('stage').style.setProperty('--zoom', '1')")
                    nachher = seite.evaluate(MESSEN)
                    skala = seite.evaluate(SKALA)
                    lage = f"{breite} px, {tier}, {len(nachher)} Zähne"
                    fremde = [z["zahn"] for z in nachher if not z["eigener"]]
                    kleiner = [n["zahn"] for v, n in zip(vorher, nachher)
                               if n["trefferBreite"] < v["trefferBreite"] - 0.01]
                    raus = [n["zahn"] for v, n in zip(vorher, nachher) if v["formDrin"] and not n["formDrin"]]
                    schon_vorher = [z["zahn"] for z in vorher if not z["eigener"]]
                    pruefe(skala == 1.08, f"{lage}: Skalierung 1,08 (gemessen {skala})", laut=False)
                    pruefe(not [z for z in fremde if z not in schon_vorher],
                           f"{lage}: in der Mitte jeder Trefferfläche liegt der eigene Zahn (fremd: {fremde})", laut=False)
                    pruefe(not kleiner, f"{lage}: keine Trefferfläche ist kleiner geworden ({kleiner})", laut=False)
                    pruefe(not raus, f"{lage}: keine Zahnzeichnung läuft aus der Bühne ({raus})", laut=False)
                    kleinste = min(z["trefferBreite"] for z in nachher)
                    print(f"  gemessen  {lage}: kleinste Trefferfläche {kleinste:.2f} px, "
                          f"vorher {min(z['trefferBreite'] for z in vorher):.2f} px")
                    seite.context.close()

        print("B — der echte Ablauf")
        seite = neue_seite(einstellungen("crocodile", 10))
        seite.wait_for_timeout(800)
        pruefe(seite.evaluate(SKALA) == 1, f"zehn Zähne am Start: keine Skalierung ({seite.evaluate(SKALA)})")
        seite.context.close()

        seite = neue_seite(einstellungen("vampire", 1))
        seite.wait_for_timeout(900)
        pruefe(seite.evaluate(SKALA) == 1.08, f"ein Zahn: Skalierung 1,08 ({seite.evaluate(SKALA)})")
        seite.click("#stage [data-tooth]")
        seite.wait_for_timeout(2000)
        status = seite.evaluate("() => document.getElementById('stage').dataset.status")
        pruefe(status == "snapped", f"der eine Zahn ließ sich bei vollem Zoom drücken (Status {status})")
        pruefe(seite.evaluate(SKALA) == 1, f"nach dem Biss: keine Skalierung ({seite.evaluate(SKALA)})")
        seite.context.close()

        seite = neue_seite(einstellungen("vampire", 1), ruhe=True)
        seite.wait_for_timeout(300)
        pruefe(seite.evaluate(SKALA) == 1, f"reduzierte Bewegung: keine Skalierung ({seite.evaluate(SKALA)})")
        seite.context.close()

        browser.close()

    print(f"\nAuffälligkeiten: {len(funde)}")
    return 1 if funde else 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Server starten und die Sonde fahren**

Vorher prüfen, ob Port 4321 schon antwortet (`curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/`); sonst `pnpm dev` im Hintergrund starten. Die Sonde lädt 63 Seiten und braucht ein bis zwei Minuten — den Aufruf mit einem Timeout von höchstens 600 s fahren.

Run: `PYTHONIOENCODING=utf-8 uv run --with playwright python scripts/pruefen-zoom.py`, danach `echo "sonde=$?"` in eigener Zeile.
Expected: 60 Zeilen `gemessen`, fünf Zeilen `ok` in Teil B, `Auffälligkeiten: 0`, `sonde=0`. Die **Ausgabe ansehen**: die kleinste Trefferfläche steht je Lage mit Vorher-Wert da und muss gewachsen sein.

Ein `FUND` wird behoben, nicht wegerklärt:
- „läuft aus der Bühne" → den Faktor `0.08` in `app.css` senken (in Schritten von 0,01) und den Kommentar dort sowie Entscheidung 3 im Nachtrag anpassen; in der Sonde den erwarteten Wert `1.08` an beiden Stellen mitziehen.
- „fremd" → eine Ebene liegt über der Trefferfläche; mit `document.elementFromPoint` an der Stelle nachsehen, welche, bevor irgendetwas geändert wird.

- [ ] **Step 3: Die Nachbar-Sonden fahren**

```bash
PYTHONIOENCODING=utf-8 uv run --with playwright python scripts/pruefen-trefferflaeche.py http://localhost:4321
PYTHONIOENCODING=utf-8 uv run --with playwright python scripts/pruefen-bedienung.py http://localhost:4321
PYTHONIOENCODING=utf-8 uv run --with playwright python scripts/pruefen-anzeige.py http://localhost:4321
```

Expected: Trefferflächen wie vorher (bei 320 px und 10 Zähnen 44,15 px, alle Tippproben „registriert"), `pruefen-bedienung.py` und `pruefen-anzeige.py` ohne Auffälligkeiten. `pruefen-bedienung.py` zählt, ob etwas die Leiste verdeckt oder die Seite scrollt — eine Skalierung ändert keine Maße, das Ergebnis muss gleich bleiben.

- [ ] **Step 4: Server beenden und Commit**

```bash
git status --short
git add scripts/pruefen-zoom.py
git commit -m "Sonde: voller Zoom auf drei Breiten, jedes Tier, jede Trefferfläche bleibt erreichbar"
```

---

### Task 4: Doku nachziehen

**Files:**
- Modify: `AGENTS.md`, `README.md`, `docs/domain-model.md`, `docs/testing.md`, `docs/workflow.md`, `docs/plan.md`, `docs/e2e-nachweise.md`

**Interfaces:**
- Consumes: Testzahl aus `pnpm test:run`, Ausgabe der Sonde aus Task 3.
- Produces: nichts.

- [ ] **Step 1: Testzahl messen**

Run: `pnpm test:run`, die Zeilen `Test Files` und `Tests` ablesen (es kommen 9 Fälle hinzu: 4 + 5, keine neue Datei). Die **gemessene** Zahl ersetzt die alte in `README.md` (drei Stellen) und `docs/testing.md` (eine Stelle). Die alte Zahl vorher mit `grep -n "Tests" README.md docs/testing.md` feststellen und für Schritt 6 merken.

- [ ] **Step 2: `AGENTS.md`**

Im Abschnitt „Befehle" eine Zeile ergänzen:

```bash
uv run --with playwright python scripts/pruefen-zoom.py        # voller Zoom: bleibt jeder Zahn erreichbar? (Server muss laufen)
```

In der Falle „Eine Vorgabe, die nur für eine Beispielbreite geprüft wird, ist keine Vorgabe." ans Ende anhängen: „Dasselbe gilt für den Zoom bei Rot (`#croc-mount`, höchstens 8 %): `scripts/pruefen-zoom.py` misst ihn auf 320, 390 und 820 px für jedes Tier."

- [ ] **Step 3: `docs/domain-model.md`**

In der Tabelle „Spannungsdramaturgie" eine Zeile anhängen:

```
| Heranzoomen | `dangerZoom`: 0 unter 50 % Bissgefahr, 0,4 an der Schwelle, linear bis 1 beim letzten Zahn; die Bühne skaliert um höchstens 8 % (`--zoom` an `#stage`). Bei geschlossenem Maul 0, bei reduzierter Bewegung gar nicht |
```

- [ ] **Step 4: `docs/testing.md` und `docs/workflow.md`**

In `docs/testing.md` an die Zeile zu `src/core/domain/tension.test.ts` vor dem schließenden ` |` anhängen:

```
; **Zoom der Bühne** (null unter der Rot-Schwelle, Sprung auf 0,4, linear bis 1, unsinnige Werte geklemmt)
```

an die Zeile zu `gameController.test.ts`:

```
; **Heranzoomen**: `--zoom` ist am Rundenbeginn 0, folgt ab der Rot-Schwelle der Bissgefahr und steht nach Biss und neuer Runde wieder auf 0
```

und in der Liste der Sonden ergänzen:

```
- **Zoom-Sonde** — `scripts/pruefen-zoom.py` setzt den vollen Zoom für jedes Tier bei Standard-
  Zahnzahl und 12 Zähnen auf 320, 390 und 820 px und prüft, dass jeder Zahn in der Mitte seiner
  Trefferfläche erreichbar bleibt. Erwartet: 60 Messzeilen und `Auffälligkeiten: 0` (Exit 0).
  `uv run --with playwright python scripts/pruefen-zoom.py`
```

In `docs/workflow.md` in der Tabelle „Skripte im Baum" einfügen:

```
| `pruefen-zoom.py` | Sonde: bei vollem Zoom bleibt jeder Zahn erreichbar — jedes Tier, zwei Zahnzahlen, drei Breiten | `uv run --with playwright python scripts/pruefen-zoom.py` |
```

- [ ] **Step 5: `README.md`, `docs/plan.md`, `docs/e2e-nachweise.md`**

In `README.md` in der Liste der Eigenschaften beim Punkt „**Nervenkitzel:**" vor „Screen-Shake" einfügen: „eine Bühne, die ab 50 % Bissgefahr näher an das Maul rückt,".

Ans Ende von `docs/plan.md` einen Nachtrag „## Nachtrag 12.10.2026 (gebaut): Heranzoomen bei Rot" setzen: Anlass, die sieben **Entscheidungen**, der Absatz „Schon vorhanden" und die drei **Absagen** aus dem Abschnitt „Entscheidungen" dieses Plans (wörtlich), der tatsächlich verwendete Faktor (8 % oder der gesenkte Wert mit Grund), die Zeile „**Offen — nur der Auftraggeber kann es beurteilen:**", und „Gate **N Tests in M Dateien**. Nicht gepusht." mit den gemessenen Zahlen.

In `docs/e2e-nachweise.md` vor „## 6. Von Prüfern gefundene Umgebungsfallen" einen Abschnitt mit der nächsten freien Kennung (`grep -n "^## 5" docs/e2e-nachweise.md | tail -1`) anlegen: „## 5xx. Heranzoomen bei Rot (12.10.2026)". Inhalt: der Aufruf der Sonde; aus ihrer Ausgabe **wörtlich** die Messzeilen für 320 px (20 Zeilen) und Teil B als Codeblock; die kleinste gemessene Trefferfläche über alle 60 Lagen in einem Satz.

- [ ] **Step 6: Doku prüfen**

`ALT` um die alte Testzahl aus Schritt 1 ergänzen (Beispiel mit 404):

```bash
ALT="196|2,29 s|Drei Gebisse|232 Tests|Acht Gebisse|acht Kacheln|vier breite Backenzähne|2,1–2,5 s|293 Tests|404"
ALTE_WERTE="$ALT" ALTE_WERTE_STRIKT=1 bash scripts/doku-pruefen.sh README.md docs/testing.md
echo "doku=$?"
python3 scripts/doku-pfade-pruefen.py . README.md AGENTS.md docs/*.md
echo "pfade=$?"
```

Expected: `doku=0`, „Alle genannten Pfade existieren.", `pfade=0`.

- [ ] **Step 7: Gate, Bau, Commit**

Run: `pnpm gate` und `pnpm build`, Exit-Codes je in eigener Zeile prüfen. Expected: beide `0`.

```bash
git status --short
git add AGENTS.md README.md docs/domain-model.md docs/testing.md docs/workflow.md docs/plan.md docs/e2e-nachweise.md
git commit -m "Doku: Heranzoomen bei Rot — abgeleitete Größe, Nachweis der Sonde, Entscheidungen"
```

**Kein Push.** Dem Auftraggeber melden: was gebaut ist, Testzahl, die kleinste gemessene Trefferfläche bei vollem Zoom, der verwendete Faktor, und dass die Wirkung am Handy nur er beurteilen kann.
