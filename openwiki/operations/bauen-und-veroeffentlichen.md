---
type: "Referenz"
title: "Bauen, Basis-Pfad und Veröffentlichen"
openwiki_generated: true
verified:
  - by: openwiki/0.7.2
    at: 2026-10-17T07:24:18.878Z
sources:
  - id: openwiki-source-baf30c604828cfde90a8ab63
    resource: repo://.githooks/pre-push
  - id: openwiki-source-5f219f204b3e870beec929d9
    resource: repo://.github/workflows/pages.yml
  - id: openwiki-source-ea70eb6c045047448e446296
    resource: repo://.gitignore
  - id: openwiki-source-8037e2358a2c4f9b2c722a11
    resource: repo://AGENTS.md
  - id: openwiki-source-c50574f22a4c0741148fc769
    resource: repo://astro.config.mjs
  - id: openwiki-source-da7929b6e2478aead956fb3c
    resource: repo://biome.jsonc
  - id: openwiki-source-e9ab88bcfec0a7529d1320d5
    resource: repo://docs/e2e-nachweise.md
  - id: openwiki-source-bf27fb010957bd7d3b81f9b1
    resource: repo://docs/testing.md
  - id: openwiki-source-cc7175a0c3a0d5f1359efcc1
    resource: repo://docs/workflow.md
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-40275cb92c3610938f16ade3
    resource: repo://pnpm-workspace.yaml
  - id: openwiki-source-38596c151c7c7968cfad4c77
    resource: repo://public/CNAME
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-ad8323e49006a330d0966d64
    resource: repo://src/bedienleiste.test.ts
  - id: openwiki-source-2ba05d27de1bbb3a67fed564
    resource: repo://src/icon.test.ts
  - id: openwiki-source-3d948f6b5017c86e48e3707e
    resource: repo://src/infrastructure/storage/httpRemoteLog.ts
  - id: openwiki-source-bcfa27fbe676fba0ccd1ec77
    resource: repo://src/layouts/Base.astro
  - id: openwiki-source-1b681c4ce8d10cbab258bb09
    resource: repo://src/pages/index.astro
  - id: openwiki-source-0cdf8374d35c07aba8b29729
    resource: repo://src/pages/statistik.astro
  - id: openwiki-source-fbadcd8591b65031efaaedce
    resource: repo://vitest.config.ts
generated: { by: "openwiki/0.7.2", at: "2026-10-17T07:24:18.878Z" }
---


# Bauen, Basis-Pfad und Veröffentlichen

`pnpm build` macht aus zwei `.astro`-Seiten eine statische Seite; ein Push auf `main` prüft,
baut und liefert sie auf GitHub Pages aus. Diese Seite beschreibt diesen Weg: was der Bau
erzeugt, warum jeder interne Verweis über `import.meta.env.BASE_URL` läuft (und was
`ASTRO_BASE` daran ändert), in welcher Reihenfolge der Workflow prüft und ausliefert, was lokal
schon vor dem Push aufhält und welche Umgebungsfallen dabei schon zugeschlagen haben. Wie
geprüft wird und was das Gate im Einzelnen umfasst, steht auf
[Prüfen und Gate](../testing/pruefen-und-gate.md); wie die Seite im Ganzen gebaut ist, auf
[Architektur-Überblick](../architecture/ueberblick.md).

## Der Bau: zwei Seiten, kein Server

| Befehl | Was er tut | Ergebnis |
|---|---|---|
| `pnpm dev` | Entwicklungsserver mit Sofort-Aktualisierung | <http://localhost:4321> (nicht `127.0.0.1`) |
| `pnpm build` | `astro build`, statisch nach `dist/` | `dist/index.html`, `dist/statistik/index.html` |
| `pnpm preview` | liefert `dist/` lokal aus | <http://localhost:4321>; die Sonden erwarten `--port 4322` |

`astro.config.mjs` setzt `output: 'static'`, die öffentliche Adresse als `site` und schaltet die
Entwicklungs-Werkzeugleiste ab (`devToolbar: { enabled: false }`). Der Bau erzeugt die zwei Seiten
und kopiert `public/` unverändert mit nach `dist/` — Symbole, `manifest.webmanifest`, `sw.js`, die
Tierstimmen und `CNAME`. `dist/` steht in `.gitignore`: veröffentlicht wird nur, was der Workflow
selbst baut, nie ein eingecheckter Bau. Weil keine Funktion auf einem Server liegt, genügt für
alles außer der Sicherung (`api/…`, siehe [Sicherungs-Worker](../integrations/sicherung-worker.md))
sogar `python3 -m http.server` in `dist/`.

**Jede Datei in `src/pages/` wird zu einer Seite.** Das ist der Grund, warum Tests und Gehilfen
der Seiten daneben liegen und nicht darin (`src/bedienleiste.test.ts` sagt das in seinem
Kopfkommentar) — eine neue Seite ist also nicht nur eine neue Datei, sondern auch ein neuer Pfad,
der im Vorrat des Service Workers auftauchen muss.

## Der Basis-Pfad: eine Regel und ein Notausgang

Die Seite liegt lokal **und** veröffentlicht unter `/` — lokal `http://localhost:4321`,
veröffentlicht unter <https://zahn-agent.schaflabs.com/>. Trotzdem gilt für **jeden** internen
Verweis (Link, Icon, Manifest, Laufzeit-Abruf, Service-Worker-Anmeldung) eine harte Regel:

> Adressen entstehen immer aus `import.meta.env.BASE_URL`, nie absolut mit `"/"`.

Der Grund ist nicht die heutige Adresse, sondern die nächste: fällt die eigene Domain je weg,
läuft die Seite wieder als Projektseite unter einem Unterpfad. Ein fest eingetragenes `/statistik`
zeigt dann ins Leere, `${BASE_URL}statistik` nicht.

So sieht das im Baum aus:

| Stelle | Verwendung |
|---|---|
| `src/layouts/Base.astro` | Favicon, `icon-192.png`, `apple-touch-icon.png`, `manifest.webmanifest`; Anmeldung des Service Workers mit `${base}sw.js` und `scope: base` — und nur im Bau (`import.meta.env.PROD`) |
| `src/pages/index.astro` | `const base = import.meta.env.BASE_URL`; Kopfzeilen-Symbol `${BASE_URL}logo.svg`; Verweis auf die Statistik `${base}statistik`; `voiceBaseUrl: import.meta.env.BASE_URL` an die Ton-Engine; `backupUrl(import.meta.env.BASE_URL, code)` |
| `src/pages/statistik.astro` | Kopfzeilen-Symbol und Rückweg `href={import.meta.env.BASE_URL}`; `backupUrl(…)` für die Sicherung |
| `src/infrastructure/storage/httpRemoteLog.ts` | `backupUrl(baseUrl, code)` → `${baseUrl}api/log/${code}` |
| `public/sw.js` | Geltungsbereich und Vorratsnamen relativ zur Anmeldung, siehe [Offline und Service Worker](../integrations/offline-service-worker.md) |

### `ASTRO_BASE` und die Normalisierung

`ASTRO_BASE` ist der **Notausgang** für einen Unterpfad. `astro.config.mjs` prüft und normalisiert
den Wert, bevor Astro ihn übernimmt:

- fehlt die Variable, bleibt `base` unbestimmt und Astro liefert `BASE_URL = "/"` (genau so baut der
  Workflow);
- ein Wert ohne führenden `/` bricht den Bau mit `ASTRO_BASE muss mit "/" beginnen, war: …` ab;
- Schluss-Schrägstriche werden entfernt und **genau einer** angehängt.

Der letzte Punkt ist kein Schönheitsfehler: Astro gibt `BASE_URL` genau so zurück, wie `base`
konfiguriert ist. Ohne den erzwungenen Schluss-Schrägstrich ergäbe `${BASE_URL}statistik` die
Adresse `/zahn_agentstatistik`.

| Eingabe | `base` | `BASE_URL` | `${BASE_URL}statistik` |
|---|---|---|---|
| `ASTRO_BASE` nicht gesetzt | unbestimmt (Astro-Vorgabe `/`) | `/` | `/statistik` |
| `ASTRO_BASE=/zahn_agent` | `/zahn_agent/` | `/zahn_agent/` | `/zahn_agent/statistik` |
| `ASTRO_BASE=/zahn_agent/` | `/zahn_agent/` | `/zahn_agent/` | `/zahn_agent/statistik` |
| `ASTRO_BASE=/` | `/` | `/` | `/statistik` |
| `ASTRO_BASE=zahn_agent` | — Bau bricht ab | — | — |

**Nachgemessen**, nicht nur abgeleitet: `ASTRO_BASE=/zahn_agent pnpm build` schreibt
`voiceBaseUrl:"/zahn_agent/"` ins gebaute Skript, der Normalbau `voiceBaseUrl:"/"`; im
`dist/index.html` stehen dann `/zahn_agent/statistik` bzw. `/statistik`.

### Nach Verweisänderungen: im Bau nachsehen

Ein grüner Linter sagt nichts über Adressen. Deshalb gehört zu jeder Änderung an Verweisen ein
Bau und ein Blick in die Ausgabe: `pnpm build`, dann in `dist/index.html` nachsehen, welche
Adressen wirklich drinstehen — erwartet sind `/statistik`, `/_astro/…`, `/favicon.svg`,
`/logo.svg` und `/manifest.webmanifest`. Dieselbe Erwartung hält die Bau- und
Auslieferungssonde fest, die `ls dist` gegen die Liste der ausgelieferten Dateien stellt.

### Falle unter Windows

Git Bash schreibt einen Wert, der mit `/` beginnt, in einen Windows-Pfad um — `ASTRO_BASE=/zahn_agent
pnpm build` bricht dort ab. Abhilfe:

```bash
MSYS_NO_PATHCONV=1 MSYS2_ENV_CONV_EXCL=ASTRO_BASE ASTRO_BASE=/zahn_agent pnpm build
```

## Veröffentlichen: der Ablauf

```mermaid
flowchart TD
    push["git push auf main"] --> hook{"pre-push: pnpm gate gruen?"}
    hook -->|nein| abbruch["Push bricht ab, main bleibt unveraendert"]
    hook -->|ja| aufmain["Stand liegt auf main"]
    aufmain --> bauen["pages.yml, Job bauen"]
    bauen --> schritte["checkout, pnpm 12.6.0, Node 22, pnpm install --frozen-lockfile"]
    schritte --> gate{"pnpm gate gruen?"}
    gate -->|nein| rot["Job bauen scheitert: kein Artefakt, nichts wird ausgeliefert"]
    gate -->|ja| build["pnpm build nach dist/"]
    build --> upload["upload-pages-artifact mit path dist"]
    upload --> ausliefern["Job ausliefern: deploy-pages im environment github-pages"]
    ausliefern --> live["https://zahn-agent.schaflabs.com/"]
```

Der Weg eines Commits bis zur veröffentlichten Seite — lokal und im Workflow hängt dieselbe
Bedingung davor.

`.github/workflows/pages.yml` läuft bei jedem Push auf `main` und zusätzlich per
`workflow_dispatch` (Actions → „Seite veroeffentlichen" → Run workflow). Zwei Jobs, einer davon
abhängig:

1. **`bauen`** — `actions/checkout`, `pnpm/action-setup` mit festgenagelter Version `12.6.0`
   (`run_install: false`), `actions/setup-node` mit `node-version: 22` und `cache: pnpm`, dann
   `pnpm install --frozen-lockfile`, `pnpm gate`, `pnpm build` und
   `actions/upload-pages-artifact` mit `path: dist`.
2. **`ausliefern`** — `needs: bauen`, `environment: github-pages` samt `page_url` und
   `actions/deploy-pages`.

**Ein rotes Gate liefert nicht aus.** Das ist keine Konvention, sondern die Job-Abhängigkeit:
`ausliefern` startet nur, wenn `bauen` durchgelaufen ist — und `bauen` bricht vor dem Bau ab, wenn
`pnpm gate` fällt. Lokal grün muss also vor dem Push stehen, nicht erst im Workflow.

Rahmenbedingungen, die man selten anfasst: `permissions` gibt `contents: read`, `pages: write` und
`id-token: write` (die Auslieferung läuft über OIDC, nicht über ein Token im Klartext), und
`concurrency: { group: pages, cancel-in-progress: true }` sorgt dafür, dass ein neuer Push einen
noch laufenden Lauf abbricht, statt zwei Stände um dieselbe Domain konkurrieren zu lassen.

### Was der Push nicht ausliefert

- **Den Worker nicht.** `pages.yml` veröffentlicht ausschließlich die Seite. Wer
  `worker/backup.js` ändert, lädt die Datei danach bei Cloudflare neu hoch und prüft die echte
  Adresse (unbekannter Code → `404`, bekannter Code → Liste).
- **Die Sonden nicht.** Sie brauchen einen Browser, eine laufende Vorschau und mehrere Minuten,
  einige messen Zeit — ein Fehlalarm hielte eine heile Seite zurück. Sie laufen von Hand vor dem
  Push, nach jeder Änderung an Stil, Bedienung, `public/sw.js` oder einer Zeichnung.
- **Die Doku-Prüfung nicht.** `doku-pruefen.sh` und `doku-pfade-pruefen.py` sind Handläufe; kein
  Skript im Workflow sieht Doku an.
- **Nichts aus dem Baum als fertigen Bau.** `dist/` ist nicht im Repo; ausgeliefert wird das
  Artefakt des Laufs.

Ein zweiter Workflow (`.github/workflows/openwiki-update.yml`) pflegt die Wiki-Seiten per Zeitplan
und Pull Request — er hängt nicht an `main` und berührt `dist/` nicht.

## Lokal davor: der pre-push-Hook

`.githooks/pre-push` fährt vor jedem Push dasselbe `pnpm gate` wie der Workflow und bricht bei Rot
ab; die Meldungen nennen auch den Weg zurück (Fund im Code beheben, neu fahren, committen, erneut
pushen). Eingehängt wird der Ordner über `git config core.hooksPath .githooks` — das erledigt das
`prepare`-Skript bei `pnpm install`, in einem frischen Klon also von selbst. Der Hook ersetzt das
Gate nicht: `git push --no-verify` umgeht ihn und ist nur mit ausdrücklichem Ja des Auftraggebers
zulässig.

## Domain, CNAME und DNS

Die Seite gehört dem Repo über `public/CNAME` — eine Zeile, `zahn-agent.schaflabs.com`. Diese Datei
liegt in `public/` und wandert beim Bau mit nach `dist/`; sie ist der Grund, warum GitHub Pages die
Domain dem Repo zuordnet. Der DNS-Eintrag liegt bei Cloudflare in der Zone `schaflabs.com` als
CNAME auf `shaunclaw07.github.io` (proxied). Weil die Domain auf der Wurzel liegt, baut der
Workflow **ohne** `ASTRO_BASE` — Basis-Pfad `/`. Die alte Projektadresse
`https://shaunclaw07.github.io/zahn_agent/` leitet mit `301` auf die Domain um.

Daraus folgt die eine Falle dieses Themas: Wer die Domain in der Pages-Konfiguration einträgt,
aber `public/CNAME` vergisst, bekommt einen Bau ohne Domainzuordnung; wer den Workflow mit
`ASTRO_BASE` baut, obwohl die Domain auf der Wurzel liegt, veröffentlicht `/zahn_agent/statistik`
unter einer Domain, die `/statistik` erwartet.

## Umgebung: Node, pnpm und keine Fremdquellen

| Größe | Festlegung | Wo |
|---|---|---|
| Node | `^22.22.2`, `^24.15.0` oder `>=26.0.0` — die Schnittmenge, die Astro 7, vitest 5 und TypeScript 7 verlangen | `engines.node` in `package.json` |
| pnpm | `>=9.0.0`; der Workflow nagelt `12.6.0` fest | `engines.pnpm`, `pages.yml` |
| Bau | `astro build` mit Rolldown (Astro 7) | `pnpm build` |

Ein „Unsupported engine"-Fehler beim Start heißt: Node ist zu alt. Die Fassung im Workflow (22) ist
nicht die einzige zulässige, aber die, die ausgeliefert wird; lokal ist Node 26 im Einsatz
(`docs/workflow.md`), und `engines.node` nennt die Schnittmenge, die die drei Bauwerkzeuge
verlangen.

**Die pnpm-Version steht im Workflow, nicht als `packageManager` in `package.json`**: pnpm 12 hängt
sonst ein zweites Dokument an `pnpm-lock.yaml` (`lockfileVersion` doppelt). Die Reihenfolge der
Schritte ist ebenfalls nicht beliebig — `pnpm/action-setup` läuft vor `setup-node`, weil der
Schritt `cache: pnpm` pnpm schon vorfinden muss, um Speicherort und Schlüssel zu bestimmen.

**`allowBuilds` statt `pnpm`-Feld:** pnpm blockiert Installationsskripte von Abhängigkeiten und
liest die Erlaubnis seit Version 12 nicht mehr aus dem `pnpm`-Feld in `package.json`. Die
Zuordnung steht deshalb in `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  esbuild: true
  sharp: true
```

Eine neue native Abhängigkeit gehört dort eingetragen, sonst bricht `pnpm install` mit
`ERR_PNPM_IGNORED_BUILDS` ab. Die Form nicht raten: `pnpm approve-builds --all` schreibt sie selbst.

**Keine externen Schriften, Bilder oder CDNs.** Die Zeichnung ist SVG-Markup, die Spielklänge sind
mit Web Audio synthetisiert; die einzige Ausnahme sind die Tierstimmen als kurze MP3 im eigenen
Baum (`public/sounds/voices/`, Herkunft und Lizenz in `QUELLEN.md`). Eine Seite, die auf einen
fremden Ursprung zeigt, wäre im Betrieb ein zweiter Ausfallpunkt — und im Start ohne Netz ein
Loch im Vorrat des Service Workers.

## Lint: was Biome prüft und was nicht

`pnpm lint` ist `biome lint --error-on-warnings .` — der Schalter ist Absicht: Regeln des
Regelsatzes `recommended` (etwa `noUnusedVariables`) sind **Warnungen**, und ohne ihn endete ein
Lauf mit Funden trotzdem mit Exit 0. So fällt jede Warnung ins Gate.

Der Bereich ist bewusst schmal (`files.includes` in `biome.jsonc`): `src/**`, `public/sw.js`,
`worker/**` — also der Quelltext des Spiels, der Service Worker und der Cloudflare-Worker. Kein
Formatierer und keine Assists (Importe sortieren): beides schriebe beim ersten Lauf fast jede Datei
um und machte `git blame` unlesbar.

Abgeschaltete Regeln stehen **mit Begründung an der Regel** und dürfen nicht ohne Rückfrage
erweitert werden:

| Regel | Warum ab |
|---|---|
| `correctness/noPrecisionLoss` | Die Lanczos-Koeffizienten sind die veröffentlichte Tabelle; ihre letzten Stellen liegen unter der Genauigkeit eines `double` |
| `suspicious/noDuplicateProperties` | Bewusste Rückfallwerte (`max-height: 82vh` vor `88dvh`, `max-width` mit `100vh` vor `100dvh`) |
| `complexity/noImportantStyles` | `.hidden` muss jede andere Regel schlagen; bei reduzierter Bewegung muss das Abschalten der Animation `!important` sein |
| `style/noDescendingSpecificity` | Die Reihenfolge der CSS-Regeln ist aus dem gewachsenen Stylesheet übernommen — Umsortieren änderte die Kaskade |
| `correctness/noUnusedImports`, `noUnusedVariables` (nur `**/*.astro`) | Biome liest in `.astro` nur das Frontmatter; `{title}` und `<Base …>` in der Vorlage gälten sonst als unbenutzt |
| `style/noNonNullAssertion` (nur `**/*.test.ts`) | Tests nutzen `!` bewusst dort, wo die Alternative nur Umstand wäre |

Fällt der Linter, wird der Fund **im Code** behoben und `pnpm gate` neu gefahren.
`biome lint --write` hilft dabei nicht überall — ungenutzte Importe und Variablen gelten Biome als
unsichere Korrektur und bleiben stehen. Eine Regel abzuschalten, ein `// biome-ignore` zu setzen
oder `--no-verify` zu benutzen, braucht das Ja des Auftraggebers.

## Was diesen Weg prüft — und was nicht

Zwei Unit-Tests halten die Basis-Pfad-Regel an den Seiten fest, ohne zu bauen: `src/icon.test.ts`
verlangt im Kopfbereich beider Seiten ein `<img>` mit `import.meta.env.BASE_URL` und `logo.svg`,
und `src/bedienleiste.test.ts` verlangt `voiceBaseUrl: import.meta.env.BASE_URL` sowie das Fehlen
fester Pfade wie `'/sounds/`. Die Anmeldung des Service Workers nur im Bau und über den Basis-Pfad
prüft `src/offline.test.ts`.

Die **Ausgabe** des Baus prüft kein Test: `vitest.config.ts` sammelt nur `src/**/*.test.ts`, und
weder `pnpm gate` noch der pre-push-Hook fahren `astro build`. Ein falscher Verweis im gebauten
`dist/index.html` fällt daher nur beim manuellen Nachsehen (siehe oben) oder in einer Browser-Sonde
auf. Wer an Verweisen, `astro.config.mjs` oder `public/CNAME` arbeitet, sollte den Bau deshalb
selbst fahren und in `dist/` nachsehen.

## Weiterlesen

- [Prüfen und Gate](../testing/pruefen-und-gate.md) — was `pnpm gate` umfasst, welche Sonden es gibt
- [Architektur-Überblick](../architecture/ueberblick.md) — zwei Seiten, statischer Bau, wo der Basis-Pfad im Ganzen sitzt
- [Sprache und Konventionen](../concepts/sprache-und-konventionen.md) — Coderegeln, Doku-Regeln, warum das Gate im Code geheilt wird
- [Offline und Service Worker](../integrations/offline-service-worker.md) — der Vorrat, der aus `dist/` entsteht
- [Sicherungs-Worker](../integrations/sicherung-worker.md) — was der Push **nicht** ausliefert
