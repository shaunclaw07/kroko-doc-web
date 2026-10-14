# Plan: Aufräumen für die nächsten Features (acht Pakete)

Stand 13.10.2026. Anlass: die Frage des Auftraggebers, ob ein Refactoring künftige Features
einfacher und den Code sauberer macht. Die Analyse hat acht Stellen ergeben; jede ist hier ein
**Paket**, das ein Agent für sich ausführen kann. Kein Paket ändert, was ein Spieler sieht oder
hört — wo doch, steht es als „Offen (Auftraggeber)“ dabei und wird vorher gefragt.

Diese Datei ist die Arbeitsdatei (`docs/workflow.md`, „Vor der Planung“) und hier nur die
**Übersicht**: jedes Paket hat seine eigene Datei unter `docs/plaene/`, damit es in einer eigenen
Sitzung ausgeführt werden kann. Ein erledigtes Paket verliert seine Datei und seine Zeile hier;
ist alles erledigt, verschwindet der Ordner und diese Datei wird geleert.

## Die Pakete

Gemeinsame Regeln für alle: [`docs/plaene/00-regeln.md`](plaene/00-regeln.md).

| Paket | Inhalt | Datei | Braucht vorher | Risiko |
| 4 | `gameController.ts` in vier Teile | [`docs/plaene/paket-4-steuerung.md`](plaene/paket-4-steuerung.md) | Paket 3 | mittel |
| 5 | Gemeinsames Gerüst und ein Befehl für alle Sonden | [`docs/plaene/paket-5-sonden.md`](plaene/paket-5-sonden.md) | besser nach Paket 1 | klein |
| 6 | `app.css` nach Bauteilen aufteilen | [`docs/plaene/paket-6-stylesheet.md`](plaene/paket-6-stylesheet.md) | — | klein |
| 7 | `AGENTS.md` auf den Einstieg kürzen | [`docs/plaene/paket-7-agents-md.md`](plaene/paket-7-agents-md.md) | — | klein |
| 8 | Linter ins Gate | [`docs/plaene/paket-8-linter.md`](plaene/paket-8-linter.md) | Entscheidung des Auftraggebers | klein |

Empfohlene Folge: 1 → 2 → 3 → 4, dann 5; 6, 7 und 8 jederzeit dazwischen.

## Eine Sitzung starten

Je Sitzung **ein** Paket. Der Auftrag an den Agenten:

```text
Setze das Paket aus docs/plaene/paket-<N>-<name>.md um. Lies zuerst AGENTS.md,
docs/plaene/00-regeln.md und die Datei des Pakets ganz. Halte dich an die Regeln, belege am
Ende jeden Punkt der Abnahme samt Gegenprobe, mache einen Commit und pushe nicht. Steht im
Paket „Offen (Auftraggeber)“ oder geht eine Abnahme anders aus als beschrieben, frag mich.
```
