#!/usr/bin/env node
// Kopiert die mitgelieferten Bibliotheken nach public/wiki/vendor/.
//
// Sie liegen aus Lizenz- und Nachweisgründen sichtbar in scripts/vendor/wiki/ und
// werden hierher kopiert, statt doppelt im Git zu liegen (public/wiki/vendor/ ist
// in .gitignore). Läuft als erster Schritt von `pnpm build`, damit auch der
// Workflow eine vollständige Seite baut.
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const hier = dirname(fileURLToPath(import.meta.url));
const quelle = join(hier, 'vendor', 'wiki');
const ziel = join(hier, '..', 'public', 'wiki', 'vendor');

mkdirSync(ziel, { recursive: true });
const dateien = readdirSync(quelle);
for (const f of dateien) {
  copyFileSync(join(quelle, f), join(ziel, f));
}
console.log(`wiki-vendor: ${dateien.length} Datei(en) nach public/wiki/vendor/ kopiert`);
