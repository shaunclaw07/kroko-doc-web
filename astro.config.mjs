import { defineConfig } from 'astro/config';

// Basis-Pfad: lokal liegt die Seite unter "/" (so steht es in der README), beim Bau für
// GitHub Pages unter "/zahn-agent/" — der Workflow setzt dafür ASTRO_BASE.
// Interne Verweise gehen deshalb über import.meta.env.BASE_URL, nie absolut mit "/".
//
// Achtung: Astro gibt BASE_URL genau so zurück, wie `base` hier steht. Ohne
// Schluss-Schrägstrich ergäbe `${BASE_URL}statistik` die falsche Adresse
// (/zahn-agentstatistik), deshalb wird der Basis-Pfad hier normalisiert.
const rawBase = process.env.ASTRO_BASE;
if (rawBase && !rawBase.startsWith('/')) {
  throw new Error(`ASTRO_BASE muss mit "/" beginnen, war: ${rawBase}`);
}
const base = rawBase ? `${rawBase.replace(/\/+$/, '')}/` : undefined;

export default defineConfig({
  output: 'static',
  site: 'https://shaunclaw07.github.io',
  base,
  devToolbar: { enabled: false },
});
