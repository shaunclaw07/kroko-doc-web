# Spielstand sichern, wenn das Gerät ihn wegwirft

Eine Anleitung zum Nachbauen — für dieses Projekt geschrieben, für andere gedacht. Sie beschreibt,
was am 13.10.2026 für Zahn Agent gebaut wurde, in der Reihenfolge, in der man es wieder tun würde,
und sagt bei jedem Schritt, ob er **gefahren** wurde oder nur beschrieben ist.

**Ergebnis am Gerät** (gemeldet vom Auftraggeber am 13.10.2026): mit der Startadresse
`…/s/<code>` klappt alles über das Kinderprofil. Mit der ersten Form `…/?s=<code>` klappte es
nicht — die Freigabe verschwand wieder.

## Regeln in Kürze

- **Anlass:** Das Kinderprofil eines Fire-Tablets verwirft beim Schließen des Browsers alle Daten
  der Seite (gemeldet am 13.10.2026; im Elternprofil desselben Geräts bleiben sie). Die Bitte um
  dauerhaften Speicher (`navigator.storage.persist`) hilft dagegen **nicht** — am Gerät geprüft.
- **Lösung:** Trägt die Adresse einen Code (`…/s/<code>` oder `?s=<code>`), gleicht die Seite ihr Protokoll beim Start und nach
  jedem Biss mit `worker/backup.js` ab (Cloudflare Worker `zahn-agent-backup`, Route
  `zahn-agent.schaflabs.com/api/*`, Datenbank D1 `zahn-agent-backup`). Die Adresse steht außerhalb
  der Ablage und übersteht das Leeren.
- **Die Startadresse ist ein Pfad, keine Abfrage.** Die freigegebene Adresse mit `?s=…` löschte
  das Kinderprofil nach einiger Zeit von selbst wieder (gemeldet am 13.10.2026; die Ursache ist
  eine Vermutung des Auftraggebers, nicht gemessen). Deshalb liefert der Worker unter
  `…/s/<code>` die Spielseite unverändert aus (zweite Route `zahn-agent.schaflabs.com/s/*`), und
  die Seite liest den Code auch aus dem Pfad. Das geht nur, weil jeder Verweis der Seite absolut
  über den Basis-Pfad läuft — ein relativer Verweis zeigte unter `/s/…` ins Leere.
  **Am Gerät bestätigt** (Auftraggeber, 13.10.2026): mit `…/s/<code>` klappt alles über das
  Kinderprofil.
- **Kein Angebot für alle.** Ohne Code ruft die Seite den Worker nie, und der Worker kennt nur
  Codes, die als Zeile in der Tabelle `logs` stehen. Der Code ist das einzige Geheimnis und steht
  **nirgends im Baum** — auch nicht in Tests, Doku oder Commit-Texten.
- **Der Abgleich holt immer erst und führt zusammen** (`syncRoundLog`); nur „Protokoll löschen"
  ersetzt die Sicherung, sonst brächte sie die gelöschten Runden zurück.
- **`api/` geht am Service Worker vorbei** (`public/sw.js`): ein Stand aus dem Vorrat wäre ein
  alter Stand, und der Abgleich schriebe ihn zurück.
- **Ein Auftrag im Argument eines `?.()`-Aufrufs läuft ohne Zuhörer gar nicht.**
  `onStatus?.({ rounds: await job() })` führte `job()` nur aus, wenn jemand zuhörte — die
  Spielseite hört nicht zu und hätte nie gesichert. Erst ausführen, dann melden; der Test dazu
  verdrahtet **ohne** `onStatus`.
- Rezept (Worker ändern, Code anlegen): [`docs/workflow.md`](workflow.md), „Die Sicherung der Runden". Der
  ganze Weg zum Nachbauen, mit allen Aufrufen und Fallen: der Rest dieses Blattes.

## Wann man das braucht

Eine Webapp legt ihren Stand im Browser ab (`localStorage`), und auf einem bestimmten Gerät ist er
nach jeder Sitzung weg. Hier: das **Kinderprofil** eines Fire-Tablets (Fire HD 8, 2024). Im
Elternprofil desselben Geräts blieb alles erhalten — der Browser ist also nicht kaputt, das Profil
verwirft seine Daten mit Absicht.

Was **nicht** hilft, und warum man es trotzdem zuerst probiert:

| Versuch | Ergebnis |
|---|---|
| `navigator.storage.persist()` (dauerhaften Speicher erbitten) | schützt nur vor dem Aufräumen bei knappem Platz; gegen ein Profil, das absichtlich leert, wirkungslos — **am Gerät geprüft** |
| Service Worker, Vorrat (`caches`) | liegt im selben Profil und wird mit verworfen |
| CSV-Export als Handsicherung | das Kinderprofil ließ den Download nicht zu; die Seite meldete trotzdem „exportiert" |

Die Bitte um dauerhaften Speicher kostet zwanzig Zeilen und zeigt, **welche** Ursache vorliegt
(`infrastructure/storage/browserPersistence.ts`, Zeile „Speicher: …" auf der Statistikseite). Erst
wenn sie nichts ändert, lohnt der Rest dieser Anleitung.

## Die Idee

Alles, was die Seite **im** Gerät ablegt, ist weg. Zwei Dinge überstehen das Leeren:

1. **die Adresse**, über die das Gerät die Seite startet (Lesezeichen, freigegebene Website) — sie
   gehört zu den Einstellungen des Profils, nicht zu den Daten der Seite;
2. **ein Server**.

Also trägt die Adresse einen Sicherungscode (`…/s/<code>`), und der Stand liegt unter diesem Code
auf einem kleinen Server. Beim Start holt die Seite ihn, nach jeder Änderung schreibt sie ihn zurück.

```text
Gerät (Ablage wird verworfen)                 Cloudflare
┌──────────────────────────────┐              ┌───────────────────────────────┐
│ Start über …/s/<code>        │  GET  ─────► │ Worker  /api/log/<code>       │
│ Ablage (localStorage)        │ ◄─────  Liste│   └─ D1: logs(code, body, …)  │
│ Zusammenführen, anzeigen     │  PUT  ─────► │                               │
└──────────────────────────────┘              └───────────────────────────────┘
```

**Ohne Code geschieht nichts** — kein Abruf, kein Knopf, kein Hinweis. Die Sicherung ist damit
kein Angebot der öffentlichen Seite, sondern eine Privatsache für die Geräte, deren Startadresse
den Code trägt. Der Worker kennt nur Codes, die der Betreiber selbst angelegt hat.

## Voraussetzungen

- Die Domain der Seite liegt bei Cloudflare, und ihr DNS-Eintrag ist **proxied** (orange Wolke).
  Nur dann kann ein Worker unter demselben Ursprung antworten (`<seite>/api/*`). Hier:
  `zahn-agent.schaflabs.com` → CNAME auf GitHub Pages, proxied.
- Ein Cloudflare-Konto im kostenlosen Tarif genügt (Grenzen unten).
- Wo die Seite ausgeliefert wird, ist gleich (hier GitHub Pages) — der Worker fängt nur `/api/*`
  und `/s/*` ab.

**Warum derselbe Ursprung?** Ein Kinderprofil lässt oft nur freigegebene Domains durch; ein Abruf
zu `*.workers.dev` könnte dort scheitern. Derselbe Ursprung braucht außerdem kein CORS. Ist der
DNS-Eintrag nicht proxied, bleibt nur eine eigene Adresse für den Worker **mit** CORS-Kopfzeilen —
das ist hier **nicht gebaut** und nicht geprüft.

## Schritt 1 — die Cloudflare-Seite

Angelegt wurde alles über die **Cloudflare-API**, aus Claude Code heraus über Cloudflares eigenen
MCP-Server. Eingerichtet (gefahren):

```bash
claude mcp add --transport http cloudflare https://mcp.cloudflare.com/mcp
```

Danach in Claude Code `/mcp` → `cloudflare` → anmelden (Browser, OAuth). Der Eintrag liegt in der
privaten Konfiguration (`~/.claude.json`), nicht im Repo.

Dieselben Schritte gehen auch im Dashboard oder mit `wrangler` — **diese beiden Wege sind
hier nicht gefahren**. Gefahren wurden diese API-Aufrufe (`<konto>` = Konto-ID, `<zone>` = Zonen-ID):

| # | Aufruf | Inhalt |
|---|---|---|
| 1 | `POST /accounts/<konto>/d1/database` | `{ "name": "zahn-agent-backup" }` → liefert die `uuid` der Datenbank |
| 2 | `POST /accounts/<konto>/d1/database/<uuid>/query` | `{ "sql": "CREATE TABLE IF NOT EXISTS logs (code TEXT PRIMARY KEY, body TEXT NOT NULL, updated_at TEXT NOT NULL)" }` |
| 3 | `POST /accounts/<konto>/d1/database/<uuid>/query` | `{ "sql": "INSERT INTO logs (code, body, updated_at) VALUES (?, ?, ?)", "params": ["<code>", "[]", "<zeitpunkt>"] }` |
| 4 | `PUT /accounts/<konto>/workers/scripts/zahn-agent-backup` | `multipart/form-data` mit zwei Teilen: `metadata` (JSON, unten) und `backup.js` (die Datei `worker/backup.js`, Typ `application/javascript+module`) |
| 5 | `POST /zones/<zone>/workers/routes` | `{ "pattern": "zahn-agent.schaflabs.com/api/*", "script": "zahn-agent-backup" }` |
| 6 | `POST /zones/<zone>/workers/routes` | `{ "pattern": "zahn-agent.schaflabs.com/s/*", "script": "zahn-agent-backup" }` |

Die `metadata` aus Schritt 4:

```json
{
  "main_module": "backup.js",
  "compatibility_date": "2026-10-01",
  "bindings": [{ "type": "d1", "name": "DB", "id": "<uuid der Datenbank>" }]
}
```

**Der Code** besteht aus Kleinbuchstaben, Ziffern und Bindestrichen, 12 bis 64 Zeichen (dieselbe
Regel steht in Worker und Seite). Er wird **gewürfelt**, nicht ausgedacht — hier zwölf zufällige
Zeichen aus einem Alphabet ohne verwechselbare Zeichen (`abcdefghjkmnpqrstuvwxyz23456789`), in
Vierergruppen mit einem Wort davor: `wort-xxxx-xxxx-xxxx`. Er steht **nirgends im Repo**: nicht im
Code, nicht in Tests, nicht in der Doku, nicht im Commit-Text.

**Danach die echte Adresse prüfen** (gefahren, mit `curl`):

```bash
U=https://<seite>/api/log
curl -s -w ' [%{http_code}]\n' $U/<code>                                  # []  [200]
curl -s -w ' [%{http_code}]\n' -X PUT -d '[{"probe":1}]' $U/<code>        # [204]
curl -s -w ' [%{http_code}]\n' $U/<code>                                  # [{"probe":1}] [200]
curl -s -w ' [%{http_code}]\n' -X PUT -d '{"a":1}' $U/<code>              # {"error":"not-a-list"} [400]
curl -s -w ' [%{http_code}]\n' $U/fremd-abcd-efgh-9999                    # {"error":"not-found"} [404]
curl -s -w ' [%{http_code}]\n' -X PUT -d '[]' $U/fremd-abcd-efgh-9999     # {"error":"not-found"} [404]
curl -s -w ' [%{http_code}]\n' -X PUT -d '[]' $U/<code>                   # [204]  — Probe wieder leeren
curl -s -o /dev/null -w '[%{http_code}]\n' https://<seite>/               # [200]  — die Seite lädt weiter
curl -s -o /dev/null -w '[%{http_code}]\n' https://<seite>/s/<code>       # [200]  — die Startadresse liefert die Spielseite
curl -s -w ' [%{http_code}]\n' https://<seite>/s/kurz                     # {"error":"not-found"} [404]
```

Eine neue Route greift nicht sofort: der erste Abruf von `/s/<code>` kam hier noch von GitHub
Pages zurück (`404`, „File not found"), Sekunden später antwortete der Worker. Wer gleich nach dem
Anlegen prüft, wiederholt den Abruf, bevor er einen Fehler sucht. Die Antwort auf `/s/<code>` wurde
danach Byte für Byte mit der Spielseite unter `/` verglichen: gleich.

## Schritt 2 — der Worker

Die ganze Datei: [`worker/backup.js`](../worker/backup.js), rund 70 Zeilen, ohne Abhängigkeiten.
Was sie tut, und was davon nicht verhandelbar ist:

- `GET /api/log/<code>` liefert den Stand, `PUT` ersetzt ihn.
- `GET /s/<code>` liefert die Spielseite unverändert aus (der Worker holt `/` vom Ursprung) — die
  **Startadresse ohne Abfrage-Teil**, siehe „Die Startadresse" unten.
- **Ein unbekannter Code ist „nicht gefunden" — beim Lesen und beim Schreiben.** Der Worker legt
  nie eine Zeile an. Sonst könnte sich jeder von außen Speicherplatz holen.
- Angenommen wird nur eine JSON-Liste bis 1,9 MB (D1 nimmt je Zeile höchstens 2 MB).
- Jede Antwort trägt `cache-control: no-store`.

**D1 statt KV**, obwohl KV einfacher wäre: KV ist nur *irgendwann* einheitlich — ein Lesen kurz
nach einem Schreiben kann den alten Stand liefern. Für „Löschen" wäre das fatal: die Seite leert
die Sicherung, liest gleich darauf den alten Stand und führt ihn wieder zusammen — die gelöschten
Runden wären zurück.

Geprüft wird die Datei, die ausgeliefert wird, gegen eine nachgestellte Datenbank:
`src/backupWorker.test.ts`.

## Schritt 3 — die Seite

| Baustein | Datei | Aufgabe |
|---|---|---|
| Code lesen | `infrastructure/storage/httpRemoteLog.ts` (`backupCode`) | aus dem Pfad (`…/s/<code>`) oder aus `?s=`, geprüft gegen die Code-Regel; zusätzlich abgelegt, damit er beim Wechsel zwischen den Seiten weiter gilt |
| Adresse | dieselbe Datei (`backupUrl`) | `<Basis-Pfad>api/log/<code>` |
| Abrufen, Schreiben | dieselbe Datei (`HttpRemoteLog`) | `fetch` mit `cache: 'no-store'`; was zurückkommt, geht durch dieselbe Prüfung wie jede andere Eingabe von außen |
| Zusammenführen | `core/domain/sessionLog.ts` (`mergeRoundLogs`) | reine Funktion, siehe unten |
| Abgleich | `core/use-cases/syncRoundLog.ts` | holen → zusammenführen → beide Seiten auf denselben Stand |
| Verdrahtung | `presentation/game/backupSync.ts` (`wireBackup`) | Abgleiche nacheinander, Ergebnis melden, nie werfen |
| Seiten | `src/pages/index.astro`, `src/pages/statistik.astro` | beim Start abgleichen, nach jeder Änderung abgleichen, Status zeigen |
| Service Worker | `public/sw.js` | `api/` geht immer ans Netz |

**Die Regel des Zusammenführens.** Der Stand der Sicherung bleibt, wie er ist; was nur das Gerät
kennt — die Einträge seit dem letzten Abgleich —, wird angehängt. Dafür braucht jeder Eintrag eine
**Identität, die nicht von einer laufenden Nummer abhängt** (hier: Zeitpunkt, Tier, Zahnzahl, Modus,
Druckfolge). Gleiche Einträge zählen je Vorkommen, nicht als einer.

Das passt, weil der Stand hier ein **Protokoll** ist: eine Liste, an die nur angehängt wird. Ist
der Stand eines anderen Projekts **ein einzelner Zustand** (Punktestand, Einstellungen, ein
Spielfeld), passt diese Regel nicht — dort braucht es eine andere (etwa: der jüngere Stand
gewinnt, mit einem Zeitstempel). Das ist hier **nicht gebaut**.

**Wann abgeglichen wird:** beim Laden jeder Seite, nach jedem abgeschlossenen Eintrag (hier das
Ereignis `kroko:round-finished`), nach einem Import. „Löschen" ist der einzige Fall, der die
Sicherung **ersetzt** statt abgleicht.

## Die Startadresse: Pfad statt Abfrage

Der erste Entwurf trug den Code als Abfrage: `…/?s=<code>`. Im Kinderprofil als erlaubter
Webinhalt freigegeben, **löschte das Tablet diese Freigabe nach einiger Zeit von selbst wieder**
(gemeldet am 13.10.2026). Die Vermutung des Auftraggebers: der Abfrage-Teil in der Adresse. Das
ist **nicht gemessen** — niemand hat dem Tablet dabei zugesehen. Der Umbau auf den Pfad hat
geholfen; das stützt die Vermutung, beweist sie aber nicht.

Die Antwort darauf ist eine Adresse, die wie eine gewöhnliche Seite aussieht: `…/s/<code>`. Eine
statisch ausgelieferte Seite kennt solche Pfade nicht, also liefert der Worker dort die
Spielseite aus, und die Seite liest den Code aus dem Pfad. Zwei Bedingungen:

- **Jeder Verweis der Seite ist absolut** (`/_astro/…`, `/favicon.svg`, `/statistik`). Ein
  relativer Verweis zeigte unter `/s/<code>` auf `/s/_astro/…` — ins Leere. Vorher im gebauten
  HTML nachsehen (`grep -o '\(href\|src\)="[^"]*"' dist/index.html`).
- **Die Abfrage-Form bleibt gültig.** Wer die alte Adresse schon eingetragen hat, verliert nichts.

**Am Gerät bestätigt** (Auftraggeber, 13.10.2026): mit dieser Adresse klappt alles über das
Kinderprofil. Wer nachbaut, nimmt gleich den Pfad und spart sich die Abfrage-Form als Startadresse.

## Die Fallen, in die wir getreten sind

- **Ein Auftrag im Argument eines `?.()`-Aufrufs läuft ohne Zuhörer gar nicht.**
  `onStatus?.({ rounds: await job() })` führt `job()` nur aus, wenn `onStatus` gesetzt ist. Die
  Spielseite hört nicht auf den Status — sie hätte **nie gesichert**, und die Statistikseite (mit
  Zuhörer) hätte alles in Ordnung gemeldet. Gefunden hat es ein Test, der ohne Zuhörer verdrahtet.
- **Erst holen, dann die Ablage lesen.** Liest man die Ablage vor dem Abruf, überschreibt der
  Abgleich einen Eintrag, der während des Wartens entstand. Zwischen Lesen und Schreiben der
  Ablage darf keine Wartezeit liegen.
- **Nie schreiben, ohne vorher geholt zu haben.** Ein Gerät mit leerer Ablage, das nach dem ersten
  neuen Eintrag einfach „seinen Stand" hochlädt, überschreibt hunderte gesicherte Einträge mit
  einem. Deshalb ist jeder Abgleich holen–zusammenführen–schreiben.
- **Abgleiche nacheinander.** Zwei nebeneinander lesen beide den alten Stand der Sicherung, und der
  langsamere schreibt ihn über den neuen.
- **Der Service Worker darf die Sicherung nicht vorhalten.** Unter demselben Ursprung fiele
  `api/…` sonst unter „alles andere: aus dem Vorrat, im Hintergrund auffrischen" — die Seite bekäme
  einen alten Stand und schriebe ihn zurück.
- **Löschen muss ersetzen.** Ein Abgleich nach dem Löschen holt alles wieder.
- **Die Verweise zwischen den Seiten tragen den Code nicht.** Wer ihn nur aus der Adresse liest,
  verliert ihn beim ersten Klick auf „Statistik". Deshalb wird er zusätzlich abgelegt — das Profil
  verwirft ihn später mit, aber dann bringt ihn die Startadresse wieder mit.
- **Der Worker wird nicht mit der Seite ausgeliefert.** Der Push veröffentlicht die Seite; wer
  `worker/backup.js` ändert, lädt ihn selbst neu hoch und prüft die echte Adresse.
- **Die Sicherung ist ein Extra.** Fehler daraus werden gemeldet, aber nie geworfen — das Spiel
  läuft ohne Server weiter, und der nächste Abgleich holt nach.

## Prüfen

| Was | Womit | Erwartet |
|---|---|---|
| Regeln und Verdrahtung | `pnpm gate` | grün |
| die gebaute Seite im echten Browser, Sicherung nachgestellt | `pnpm build`, `pnpm preview --port 4322`, dann `python scripts/pruefen-sicherung.py` | vierzehn Zeilen `ok`, `Auffälligkeiten: 0` |
| der Start ohne Netz nach der Änderung am Service Worker | `python scripts/pruefen-offline.py` | zehn Zeilen `ok`, `Auffälligkeiten: 0` |
| der echte Worker | die `curl`-Zeilen aus Schritt 1 | wie dort notiert |

Die Sonde `pruefen-sicherung.py` stellt genau den Anlass nach: Ablage leeren, Seite mit Code
öffnen, Runden **und Sterne** sind wieder da — über beide Formen der Adresse. Sie rührt den echten Worker und den echten Code
nicht an.

**Was keine Sonde zeigt** und nur am Gerät prüfbar ist — hier beides am 13.10.2026 vom
Auftraggeber bestätigt, auf einem anderen Gerät wieder offen:

- Behält das Profil die freigegebene Startadresse? (`…/s/<code>`: ja. `…/?s=<code>`: nein.)
- Lässt das Profil den Abruf an `api/…` durch? (Ja — unter demselben Ursprung.)

Für die Fehlersuche auf einem anderen Gerät gibt es die Zeile „Sicherung: …" auf der Statistikseite: fehlt sie, kam der Code nicht an;
steht dort „nicht erreichbar", blockt das Profil den Abruf; steht eine Rundenzahl da, läuft es.

## In Betrieb nehmen

1. Die Adresse mit Code einmal auf einem Gerät öffnen, das den Stand **hat** (hier das
   Elternprofil) — damit wandert er in die Sicherung.
2. Dieselbe Adresse auf dem Gerät, das ihn verliert, als **Startpunkt** eintragen — die Form
   `…/s/<code>`, ohne Abfrage-Teil.
3. Etwas spielen, den Browser ganz schließen, über den Startpunkt wieder öffnen.

## Grenzen und Kosten

Kostenloser Tarif, Zahlen aus der Cloudflare-Doku (abgerufen am 13.10.2026):

| Grenze | Wert |
|---|---|
| Worker-Anfragen | 100 000 je Tag |
| Rechenzeit je Anfrage | 10 ms |
| D1: gelesene Zeilen | 5 Millionen je Tag |
| D1: geschriebene Zeilen | 100 000 je Tag |
| D1: Größe einer Zeile | 2 000 000 Byte |

- Ein Abgleich ist eine Anfrage zum Holen und höchstens eine zum Schreiben. Ein Kind erreicht
  diese Grenzen nicht.
- **Der Stand liegt als eine Zeile vor.** Bei rund 170 Byte je Runde reichen 1,9 MB für etwa
  11 000 Runden; danach lehnt der Worker das Schreiben ab (`413`) und die Statistikseite meldet
  „nicht erreichbar". Vorher kann die Rechenzeit knapp werden — der Worker liest die ganze Liste
  ein, um sie zu prüfen. Beides ist **nicht gemessen**, nur gerechnet.
- Ist das Tageskontingent der Anfragen erschöpft, antwortet die Route mit einem Fehler; die Seite
  selbst lädt weiter.

## Sicherheit, ehrlich

- **Der Code ist das einzige Geheimnis.** Wer ihn kennt, kann den Stand lesen und überschreiben. Er
  steht in der Adresse, also auch im Verlauf des Browsers und in jedem Bildschirmfoto.
- Es gibt **keine Bremse gegen Ausprobieren** — die Länge des Codes ist der Schutz (zwölf zufällige
  Zeichen aus 31 sind rund 59 Bit).
- Gesichert wird nur, was ohnehin im Gerät lag: hier Tier, Zahnzahl, Druckfolge und Zeitpunkt
  einer Runde. Wer etwas Persönliches sichern will, braucht mehr als einen Code in der Adresse.
- **Sperren:** die Zeile des Codes löschen (`DELETE FROM logs WHERE code = '<code>'`). Der Stand
  darin ist dann weg.

## Abbauen

Routen löschen, Worker löschen, Datenbank löschen — in dieser Reihenfolge, im Dashboard unter
*Workers & Pages* und *D1*. Die Seite braucht keine Änderung: ohne Code ruft sie die Sicherung
nicht, und mit Code meldet sie „nicht erreichbar". (Nicht gefahren.)
