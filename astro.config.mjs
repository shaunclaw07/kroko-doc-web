import { defineConfig } from 'astro/config';

// Basis-Pfad: Die Seite liegt unter "/" — lokal (http://localhost:4321) und veröffentlicht
// unter der eigenen Domain https://zahn-agent.schaflabs.com/. Interne Verweise gehen trotzdem
// über import.meta.env.BASE_URL, nie absolut mit "/" — das hält sie heil, falls die Seite je
// wieder unter einem Unterpfad laufen soll (Projektseite ohne eigene Domain).
//
// Achtung: Astro gibt BASE_URL genau so zurück, wie `base` hier steht. Ohne
// Schluss-Schrägstrich ergäbe `${BASE_URL}statistik` die falsche Adresse
// (/zahn_agentstatistik), deshalb wird der Basis-Pfad hier normalisiert.
//
// ASTRO_BASE ist der Notausgang für einen Unterpfad: `ASTRO_BASE=/pfad pnpm build`.
const rawBase = process.env.ASTRO_BASE;
if (rawBase && !rawBase.startsWith('/')) {
  throw new Error(`ASTRO_BASE muss mit "/" beginnen, war: ${rawBase}`);
}
const base = rawBase ? `${rawBase.replace(/\/+$/, '')}/` : undefined;

export default defineConfig({
  output: 'static',
  site: 'https://zahn-agent.schaflabs.com',
  base,
  devToolbar: { enabled: false },
});
