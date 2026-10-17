# Herkunft der Bibliotheken für public/wiki/

Kopien der Dateien, die der OpenWiki-Visualizer normalerweise von jsdelivr lädt.
Sie liegen hier, damit die Seite unter der eigenen Domain **ohne externe Abrufe** läuft
(Zusage im README: „keine externen Schriften, Bilder, CDNs; alles lokal").
`scripts/wiki-export.sh` kopiert sie nach `public/wiki/vendor/`. Stand: 17.10.2026.

| Datei | Paket | Fassung | Lizenz | Quelle |
|---|---|---|---|---|
| `force-graph.min.js` | force-graph | 1.49.5 | MIT | https://cdn.jsdelivr.net/npm/force-graph@1.49.5/dist/force-graph.min.js |
| `marked.min.js` | marked | 12.0.2 | MIT | https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js |
| `purify.min.js` | dompurify | 3.4.12 | Apache-2.0 / MPL-2.0 | https://cdn.jsdelivr.net/npm/dompurify@3.4.12/dist/purify.min.js |
| `mermaid.min.js` | mermaid | 11.16.0 | MIT | https://cdn.jsdelivr.net/npm/mermaid@11.16.0/dist/mermaid.min.js |

Zum Auffrischen: die Fassungen im HTML des Exports nachsehen und hier mit anheben.
