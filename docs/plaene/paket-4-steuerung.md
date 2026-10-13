# Paket 4 — `gameController.ts` in vier Teile

> **Vorher lesen:** `docs/plaene/00-regeln.md` — die Regeln dort gelten für jeden Schritt.
> **Braucht vorher:** Paket 3 · **Risiko:** mittel · Stand der Zeilenangaben: 13.10.2026

**Ziel:** Die Steuerung führt nur noch den Ablauf einer Runde. Heute trägt sie in 765 Zeilen fünf
Aufgaben; ihr Test hat 1 127 Zeilen.

**Ausgangslage** (Methoden und Zeilen in `src/presentation/game/gameController.ts`):

| Aufgabe | Methoden |
|---|---|
| Haltegeste | `wireTeeth` 155, `canPress` 204, `releasedOnTooth` 228, `beginHold` 251, `cancelHold` 270, `releaseHold` 281 |
| Ablauf eines Drucks | `handlePress` 291, `resolvePress` 304, `startPressBeat` 350, `settle` 363, `snap` 381, `twitch` 410 |
| Effekte auf der Bühne | `markBiter` 423, `markPressed` 441, `lookAt` 451, `shake` 469, `vibrate` 482 |
| Anzeige | `render` 588 (80 Zeilen, 15 `getElementById`), `revealMeterHint` 669, `turnSentence` 686, `mutSentence` 716, `showResult` 740 |
| Protokoll | `recordRound` 510, `syncLog` 543 |

**Grundsatz:** `gameController.test.ts` bleibt das Netz und wird in diesem Paket **nicht
umgeschrieben** — jeder Schritt muss mit ihm grün sein. Neue Tests kommen für die neuen Teile dazu.

**Schritte** (jeder für sich abschließbar und einzeln zu committen)

1. **Anzeige: reines Modell.** Neu `src/presentation/game/hudModel.ts` mit
   `hudModel({ round, tension, roundNumber })` → ein Objekt aus Texten und Zuständen:
   `remaining`, `remainingLabel`, `progressText`, `tensionText`, `turnSentence`, `roundOpen`,
   `finalToothWarning`, `howToVisible`, `meterPercent`, `beatMs`, `zoom`, `tense`, `danger`.
   Alles, was `render()` heute **rechnet**, steht dort; kein `document`. Test ohne jsdom, mit den
   Randfällen aus `AGENTS.md`: bei geschlossenem Maul keine Gefahr („Runde beendet“), ein Zahn
   übrig → Einzahl, vor dem ersten Druck keine 0 %.
2. **Anzeige: Sicht.** Neu `hudView.ts` mit `createHudView(doc, stage, art)` und `apply(model)`:
   alles, was `render()` heute **setzt** (Texte, Klassen an `#hud-panel`, Variablen an der Bühne,
   `data-status`, `data-tension`). `render()` der Steuerung wird zu
   `this.hud.apply(hudModel(...))`. Die Kennungen der Elemente stehen danach an **einer** Stelle.
3. **Ergebnistexte.** `turnSentence`, `mutSentence` und der Text aus `showResult` als reine
   Funktionen nach `resultText.ts`, mit Test.
4. **Haltegeste.** Neu `holdGesture.ts`: `createHoldGesture({ doc, now, wait, canPress, feel,
   onPress, onCancel })`. Sie kennt Zeiger, Halten, Wegschieben, Obergrenze (`HOLD_MAX_MS`),
   das Anhalten von `touchstart` am gehaltenen Zahn — und sonst nichts vom Spiel. Die Steuerung
   reicht `onPress(toothId, heldMs, felt)` herein. `dispose()` hängt die Zuhörer am Dokument ab.
   Danach `scripts/pruefen-halten.py` fahren (16 Zeilen `ok`, darunter die zwei Fälle mit echter
   Berührung) — Unit-Tests sehen den Unterschied zwischen Maus und Finger nicht.
5. **Protokoll.** Neu `roundRecorder.ts`: `createRoundRecorder({ log, clock })` mit `record(round)`
   (liest unmittelbar vor dem Anhängen — die Regel „wer zurückschreibt, liest vorher“), `sync()`
   und `count()`. `clock` liefert die Zeit; heute steht `new Date()` in der Steuerung.
6. **Aufräumen.** Tote Felder und Importe der Steuerung entfernen; die Konstanten
   (`TAP_VIBRATION_MS`, `BITE_VIBRATION_PATTERN`, `HOLD_*`) ziehen zu dem Teil, der sie braucht —
   `AGENTS.md` nennt `TAP_VIBRATION_MS` und `BITE_VIBRATION_PATTERN` mit Fundort: dort nachziehen.

**Abnahme**

- `gameController.ts` unter 400 Zeilen; `render()` unter 15.
- `gameController.test.ts` unverändert grün (Ausnahme: die Herstellung der Abhängigkeiten).
- Sonden `pruefen-halten`, `-blick`, `-zoom`, `-anzeige`, `-bedienung`, `-trefferflaeche` ohne Fund.
- `src/architecture.test.ts` grün (kein neuer Ordner nötig; alle Teile liegen in `presentation/game`).

**Risiko:** Zeitgeber. Jeder verzögerte Rückruf prüft, ob seine Runde noch gilt
(`AGENTS.md`, „Ein Zeitgeber trägt die Runde, zu der er gehört“), und nach `dispose()` läuft
nichts mehr. Beim Herauslösen bleibt `wait` der Steuerung der einzige Weg zu einem Zeitgeber —
kein Teil ruft `setTimeout` selbst.
