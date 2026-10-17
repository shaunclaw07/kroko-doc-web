# Tier-Sätze und Zahnzahlen: die Belege

> **Art:** Nachweis — Zweck: Belege der Tier-Sätze und Zahnzahlen, je Lebewesen mit Quelle.
> **Verwandt:** [`docs/workflow.md`](workflow.md), [`docs/plan.md`](plan.md)

Jeder Satz im Katalogfeld `fact` („Wusstest du?") und jede Zahl in `realTeeth`
(`src/core/domain/creature.ts`) hat hier seine Quelle. Wer einen Satz ergänzt oder ändert, trägt
die Quelle mit Fundstelle und Abrufdatum hier ein — Rezept: [`docs/workflow.md`](workflow.md), „Einen Tier-Satz
ergänzen oder ändern". Herkunft und Lizenz der **Stimmen** stehen woanders:
`public/sounds/voices/QUELLEN.md`.

Bis zum 13.10.2026 standen diese Belege verstreut in [`docs/plan.md`](plan.md); die Datei ist seitdem nur
noch der Plan des gerade laufenden Features.

## Die Sätze

Quelle ist de.wikipedia, abgerufen am 12.10.2026 (Venusfliegenfalle und T-Rex: 13.10.2026), soweit
nicht anders genannt.

| Wesen | Satz | Beleg |
|---|---|---|
| Krokodil | Einem Krokodil wachsen neue Zähne nach — viele Male in seinem Leben. | *Krokodile*, Abschnitt Gebiss: „einen mehrfachen, regelmäßigen Zahnwechsel“; „Mit zunehmendem Alter findet der Zahnwechsel jedoch immer seltener statt und endet schließlich ganz“ — deshalb „viele Male“ und nicht „ein Leben lang“ |
| Wolf | Ein Wolf hat 42 Zähne. Das sind zehn mehr, als ein erwachsener Mensch hat. | *Wolf*: „Insgesamt haben Wölfe somit 42 Zähne.“; *Zahn*: 32 bleibende Zähne |
| Mensch | Du bekommst zweimal Zähne: erst 20 Milchzähne, später bis zu 32 bleibende. | *Milchzahn*: „besteht das Milchgebiss aus 20 Zähnen“; *Zahn*: „insgesamt 32 bleibende Zähne (inklusive der Weisheitszähne)“ |
| Hai | Ein Hai verliert ständig Zähne. Dahinter wartet schon die nächste Reihe. | *Revolvergebiss*: die Zähne wachsen „auf der Innenseite des Kiefers beständig nach“, „wobei der vorderste Zahn letztlich ausfällt“ |
| Maus | Die Nagezähne einer Maus wachsen ihr ganzes Leben lang. Darum nagt sie so viel. | *Nagezahn*: „dauerwachsende Schneidezähne“; „Ein Nagetrieb sorgt für eine dem Wachstum angeglichene Abnutzung.“ (für die Nagetiere, die Maus ist nicht eigens genannt) |
| Vampir | Vampire gibt es nur in Geschichten. Ihre spitzen Zähne heißen bei dir Eckzähne. | *Eckzahn*: „nur eine Höckerspitze (Eckzahnspitze)“ |
| Panda | Ein Panda frisst fast nur Bambus. Dafür hat er besonders breite Backenzähne. | *Großer Panda*: „ernähren sich zu 99 % von Bambus“; die Backenzähne „sind größer und breiter als die der anderen Vertreter ihrer Familie“ |
| Löwe | Ein Löwe hat 30 Zähne. Die vier langen heißen Fangzähne. | Zahnformel unten; „Alle Raubtiere besitzen vier dolchartige Eckzähne, die als Fangzähne zum Ergreifen und Töten der Beute [dienen]“ |
| Panther | Ein schwarzer Panther ist ein Leopard mit schwarzem Fell. | *Leopard*: „Der Leopard (Panthera pardus), auch Panther“; der schwarze Panther ist die melanistische Form desselben Tieres |
| Säbelzahntiger | Seine Säbel ragten bis zu 20 cm aus dem Kiefer. Das Tier ist seit rund 12.000 Jahren ausgestorben. | *Smilodon*: die Säbel ragten „bis zu 20 cm aus dem Kiefer“; die Art starb vor rund 12.000 Jahren aus |
| Venusfliegenfalle | Die Venusfliegenfalle ist eine Pflanze. Ihre Klappe schnappt in einer Zehntelsekunde zu. | *Venusfliegenfalle*: „Der Fangmechanismus ist mit einer Dauer von bis zu 100 Millisekunden …“; ausgelöst nach zwei Berührungen der Fühlborsten innerhalb von 20 Sekunden |
| T-Rex | Der längste Zahn eines T-Rex war mit Wurzel etwa 30 cm lang — so lang wie ein Lineal. | *Tyrannosaurus*: „Der größte gefundene Zahn wird inklusive Zahnwurzel auf 30 cm Länge geschätzt“ |

Zwei Sätze wurden beim Belegen **umformuliert**: beim Krokodil stand zuerst „immer wieder“, beim
Panda „breite Mahlzähne“ — die Quelle sagt „mehrfach, … endet schließlich ganz“ und „breiter“.

## Die Zahnzahlen (`realTeeth`) und was die Zeichnung daraus macht

- **Wolf: 42**, **Mensch: 32** — siehe die Sätze oben.
- **Großer Panda: 42.** „Wie die meisten Bären haben sie 42 Zähne, die hinteren Vorbackenzähne und
  die Backenzähne sind größer und breiter als die der anderen Vertreter ihrer Familie“
  (de.wikipedia, *Großer Panda*). Das Profil zeigt deshalb breite Mahlzähne.
- **Löwe: 30**, Zahnformel I 3/3 · C 1/1 · P 3/2 · M 1/1 (lionalert.org, *Lion Physiology*;
  University of the Free State, *Predator Species: Lion*; *Mammalian Species*: „Dental formula is
  i 3/3, c 1/1, p 3/2, m 1/1, total 30“).
- **Panther/Leopard: 30**, dieselbe Zahnformel. Belegt über den Arabischen Leoparden (Feldführer
  *Mammals of AlUla*: „the dental formula of the Arabian Leopard is 'I 3/3, C 1/1, P 3/2,
  M 1/1'“). Raubkatzen haben vier dolchartige Eckzähne — deshalb zeichnet der Panther **vier**
  Fangzähne, nicht zwei.
- **Säbelzahntiger (Smilodon): 26–28** (de.wikipedia, *Smilodon*); im Katalog steht der untere
  Wert.
- **T-Rex: 58.** Vier Zähne je Seite im Zwischenkieferbein, zwölf je Seite im Oberkiefer, dreizehn
  je Unterkieferast (en.wikipedia, *Tyrannosaurus*, abgerufen 13.10.2026). Dazu aus de.wikipedia,
  *Tyrannosaurus*: Arme „nur einem Meter“ lang; lebte „vor etwa 68 bis 66 Millionen Jahren“.
- **Venusfliegenfalle: 0.** Sie hat keine Zähne, sondern Randborsten; eine Zahl je Blatthälfte
  nennt weder der deutsche noch der englische Artikel — also steht keine im Spiel, und die
  Kurzinfo sagt „keine Zähne“. Die Innenseite ist „bei Sonneneinstrahlung innenseitig stark rot
  gefärbt“ — daher der rosenrote Rachen auch bei der Pflanze.
- **Hai: 300**, **Maus: 16**, **Vampir: 32** — ohne eigene Fundstelle: der Hai trägt Hunderte
  Zähne in Reihen (die Zahl ist ein Spaßwert), die Maus vier Nagezähne und zwölf Backenzähne, der
  Vampir das Gebiss des Menschen.

## Offen

`realTeeth: 32` beim **Krokodil** ist **nicht belegt** und vermutlich zu niedrig. Gefunden wurden
nur schwache Quellen (ein Zoo: „about 60 teeth“; ein Safari-Blog: 64–68 beim Nilkrokodil),
de.wikipedia nennt keine Zahl. Der Wert bleibt stehen, bis eine belastbare Quelle da ist — er steht
im Regeln-Blatt als „Echtes Gebiss: 32 Zähne“.
