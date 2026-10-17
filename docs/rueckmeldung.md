# Rückmeldung an den Nutzer (Ton, Vibration)

Was der Spieler hört und spürt — und wie eine Anzeige zu sprechen hat. Bis zum 14.10.2026 stand
dieser Abschnitt in [`AGENTS.md`](../AGENTS.md); dort war er in jeder Sitzung im Blick, hier liest ihn, wer dem
Index folgt. Die Nähte nach außen (`SoundPort`, `HapticsPort`) stehen in [`docs/architecture.md`](architecture.md).

- **Anzeigen werden benannt.** Jede Zahl bekommt ihr Substantiv („Bissgefahr 34 %", „6 von 10
  gedrückt"). Ein Wert ohne Wort ist keine Aussage: der Balken sah jahrelang aus wie eine
  Fortschrittsanzeige, war aber ein Gefahrenmesser — und ein neuer Spieler konnte ihn deshalb nicht
  deuten. Füllung und Farbe dürfen **zwei verschiedene** Dinge sagen, aber beide müssen benannt sein.
  **Eine Ausnahme, vom Auftraggeber entschieden (13.10.2026):** die Zahl der Bissgefahr
  („Bissgefahr 8 %") ist nicht mehr zu sehen — sein Sohn störte sich daran, „das bringt den Kindern
  keinen Mehrwert". Die Farbe des Balkens trägt die Gefahr jetzt allein; ihren Namen hat sie noch im
  Regeln-Blatt, im einmaligen Hinweis unter dem Balken und für Vorleser (`#hud-tension` ist
  `sr-only`, nicht entfernt — Tests und Sonde lesen den Wert dort weiter).

- **Der Ergebnissatz wiederholt den Titel nicht — und bei zwei Spielern nennt der Titel den
  Gewinner.** Der Titel („Zugeschnappt!“ bzw. „Spieler 2 hat gewonnen!“) sagt den Ausgang, der Text
  die Auskunft: welcher Zahn der falsche war, wie viele Zähne scharf waren — bei einem einzigen
  heißt es „der einzige scharfe“, weil die Aufzählung sonst nur die Zahl wiederholt hätte, die schon
  am Satzanfang steht — und bei zwei Spielern, wer ihn gedrückt hat. Beides steht in **einem**
  Absatz und **einem** Element: jede zusätzliche Zeile im Ergebnis-Kasten bräche die Spielseite auf
  320 × 568 (gemessen, `scripts/pruefen-bedienung.py`). Die Nummer des Drucks („der 3. Druck dieser
  Runde“) ist nicht mehr zu sehen — sie ist die Zahl der gedrückten Zähne, steht vollständig im
  Protokoll (`pressIndex`, siehe [`docs/domain-model.md`](domain-model.md), „Position“) und die Statistikseite zeigt
  sie weiter. Bei **drei und vier Spielern** (nur im Protokoll, etwa aus einem Import) gibt es drei
  Gewinner, dort bleibt es beim Verlierer-Satz. Wortlaut und Tests:
  `src/presentation/game/resultText.ts`.

- **Browser-Schnittstellen nie direkt in der Bedienung:** Ton läuft über `SoundPort`, Vibration über
  `HapticsPort` (`core/ports/haptics.ts`), umgesetzt in `infrastructure/`. Der Controller ruft
  `this.deps.haptics?.vibrate(...)` — ein `navigator`-Zugriff steht dort nicht.
- **Was der Browser nicht kann, wird gesagt:** `isSupported()` entscheidet, ob der Schalter bedienbar
  ist. Safari auf iOS kennt keine Vibration — dann ist der Griff abgeblendet und es steht ein Satz
  dabei. Ein Schalter, der still nichts tut, ist ein Fehler und kostet den Nutzer eine Fehlersuche.
- **Muster sind Absicht:** `TAP_VIBRATION_MS = 25` (`core/ports/haptics.ts`) bei **jedem** Zahndruck — direkt aus der
  Fingerberührung heraus (seit dem Halten: beim **Auflegen** des Fingers, nicht beim Loslassen),
  ohne Verzögerung, das ist die zuverlässigste Stelle für einen Stoß —
  und `BITE_VIBRATION_PATTERN = [120, 50, 220]` (`core/ports/haptics.ts`) beim Zuschnappen. Kurze Stöße unter ~20 ms setzen
  manche Geräte gar nicht um.
- Vibration ist ein Extra: Fehler daraus werden geschluckt, das Spiel darf davon nie anhalten.
- **Belegte Grenzen der Schnittstelle** (MDN, `Navigator.vibrate`, Stand 30.11.2025): sie verlangt
  keine Berechtigung (Chrome hat deshalb *keine* Website-Einstellung dafür) und nur „sticky user
  activation" — ein einziger früherer Fingertipp genügt. Zurückhalten können sie der Stumm- bzw.
  Nicht-stören-Modus und eine abgeschaltete Systemvibration. Safari auf iOS kennt sie nicht.
  Kein Gerät im Arbeitsumfeld: das Gefühl am Handy kann nur der Nutzer prüfen — ein Druck auf einen
  Zahn gibt die Rückmeldung sofort, er ist damit die beste Probe.
- **Auch ein stummes oder ausgestorbenes Vorbild bekommt eine Datei — mit ehrlicher Zeile.** Die
  Venusfliegenfalle summt wie ihre Beute (eine Fliege), der T-Rex brüllt mit der tiefer gelegten
  Stimme des Alligators; [`QUELLEN.md`](../public/sounds/voices/QUELLEN.md) sagt bei beiden, was es wirklich ist. Wikimedia Commons hatte
  keine Fliege — gefunden bei BigSoundBank (CC0). Wer dort sucht, liest die Lizenzzeile der
  einzelnen Seite, nicht die der Startseite.
- **Tierstimmen sind Dateien — die einzigen.** Je Tier ein MP3 von höchstens 1,5 s unter
  `public/sounds/voices/`, jede mit Urheber, Lizenz und Quelle in [`QUELLEN.md`](../public/sounds/voices/QUELLEN.md) daneben (ein Test
  liefert keine Datei ohne diese Zeile aus). Alle Spielklänge bleiben synthetisiert. Gespielt wird
  über `SoundPort.playVoice(creatureId)` im **selben** Audio-Kontext (`decodeAudioData`), nicht
  über ein `<audio>`-Element — so gelten Ton-Schalter, Freigabe und `stopAll()` ohne zweite Regel.
  Anlässe: beim Wählen eines **anderen** Tiers und 120 ms nach dem Biss; nie vor einem Urteil, nie
  bei einem harmlosen Zahn — die Stimme darf nichts verraten. Der Tierwechsel ruft `stopAll()`,
  **bevor** das neue Tier sich meldet (danach schnitte er genau die neue Stimme ab). Geladen wird
  erst nach der ersten Geste und nur bei eingeschaltetem Ton; eine Stimme, die mehr als 0,5 s zu
  spät kommt, entfällt. Adressen nur über den Basis-Pfad (`voiceBaseUrl: import.meta.env.BASE_URL`).
  **Wie etwas klingt, kann ich nicht prüfen** — Ausschnitt, Lautstärke und Rauschen hört nur der
  Auftraggeber. Rezept: [`docs/workflow.md`](workflow.md), „Eine Tierstimme ergänzen oder tauschen".
- **Vor der ersten Nutzergeste plant der Ton nichts.** Der Browser hält einen Audio-Kontext an, bis
  der Nutzer etwas tut; seine Uhr steht so lange, und alles, was in dieser Zeit geplant wird, startet
  beim Freigeben **gleichzeitig**. Der frühere Herzschlag lief ab Seitenstart: nach 20 s Leerlauf
  lagen 50 Schläge übereinander (gemessen am 12.10.2026 mit angehaltenem Kontext: Spitzenpegel 6,6
  statt 0,26). Deshalb: `play()` tut vor `unlock()` nichts, und `unlock()` bittet bei **jeder** Geste
  um Freigabe, solange der Kontext nicht läuft (iOS hält ihn nach einem Anruf wieder an). **Den
  Herzschlag gibt es seit dem 12.10.2026 nicht mehr** (vom Auftraggeber abgewählt); seitdem
  wiederholt sich kein Klang mehr von selbst. Wer wieder einen einführt, lässt ihn ausfallen,
  solange der Kontext nicht `running` ist.
