import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Schichten-Wächter. Dieser Test darf nie rot sein: er erzwingt die Importrichtung
 * und dass jede Mappe unter src/ in der Tabelle steht. Eine neue Mappe braucht
 * einen Eintrag in FOLDER_LAYER — sonst schlägt der Lauf fehl.
 */

type Layer = 'domain' | 'ports' | 'use-cases' | 'contract' | 'infrastructure' | 'presentation';

/** Mappe (relativ zu src) -> Schicht. Neue Ordner hier eintragen. */
const FOLDER_LAYER: Readonly<Record<string, Layer>> = {
  'core/domain': 'domain',
  'core/ports': 'ports',
  'core/use-cases': 'use-cases',
  contract: 'contract',
  'infrastructure/audio': 'infrastructure',
  'infrastructure/random': 'infrastructure',
  'infrastructure/storage': 'infrastructure',
  'infrastructure/testing': 'infrastructure',
  'presentation/game': 'presentation',
  'presentation/game/creatures': 'presentation',
  'presentation/stats': 'presentation',
};

/** Was jede Schicht importieren darf. */
const ALLOWED: Readonly<Record<Layer, readonly Layer[]>> = {
  domain: ['domain', 'ports'],
  ports: ['ports', 'domain', 'contract'],
  'use-cases': ['use-cases', 'domain', 'ports', 'contract'],
  contract: ['contract', 'domain'],
  infrastructure: ['infrastructure', 'domain', 'ports', 'use-cases', 'contract'],
  presentation: ['presentation', 'domain', 'ports', 'use-cases', 'contract', 'infrastructure'],
};

const SRC = resolve(import.meta.dirname);

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (entry.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

const ALL_FILES = walk(SRC);
const SOURCE_FILES = ALL_FILES.filter((file) => !file.endsWith('.test.ts'));

/** Ordner, die Quelldateien enthalten (ohne Testverzeichnisse). */
const USED_FOLDERS = [...new Set(SOURCE_FILES.map((file) => relative(SRC, dirname(file)).split(sep).join('/')))].filter(
  (folder) => folder !== '.' && folder !== '',
);

function layerOfFolder(folder: string): Layer | undefined {
  return FOLDER_LAYER[folder];
}

function importsOf(file: string): string[] {
  const content = readFileSync(file, 'utf8');
  return [...content.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1] ?? '');
}

function layerOfImport(file: string, specifier: string): Layer | 'node' | null {
  if (specifier.startsWith('node:')) {
    return 'node';
  }
  if (!specifier.startsWith('.')) {
    return null;
  }
  const target = resolve(dirname(file), specifier);
  const rel = relative(SRC, target).split(sep).join('/');
  const folder = rel.split('/').slice(0, -1).join('/');
  return layerOfFolder(folder) ?? null;
}

describe('Schichten', () => {
  it('kennt jede Mappe unter src/', () => {
    const unknown = USED_FOLDERS.filter((folder) => layerOfFolder(folder) === undefined);
    expect(unknown).toEqual([]);
  });

  it('hält jede Datei in einer erlaubten Schicht', () => {
    const violations: string[] = [];
    for (const file of SOURCE_FILES) {
      const folder = relative(SRC, dirname(file)).split(sep).join('/');
      const own = layerOfFolder(folder);
      if (!own) {
        continue;
      }
      for (const specifier of importsOf(file)) {
        const target = layerOfImport(file, specifier);
        if (target === 'node') {
          if (own !== 'infrastructure') {
            violations.push(`${relative(SRC, file)} (${own}) -> ${specifier} (node)`);
          }
          continue;
        }
        if (target && !ALLOWED[own].includes(target)) {
          violations.push(`${relative(SRC, file)} (${own}) -> ${specifier} (${target})`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('lässt den Kern ohne Browser und ohne Uhr', () => {
    const forbidden = [/\bdocument\b/, /\bwindow\b/, /\blocalStorage\b/, /\bnavigator\b/, /performance\.now/, /new Date\(/];
    const violations: string[] = [];
    for (const file of SOURCE_FILES) {
      const folder = relative(SRC, dirname(file)).split(sep).join('/');
      const layer = layerOfFolder(folder);
      if (layer !== 'domain' && layer !== 'use-cases') {
        continue;
      }
      const content = readFileSync(file, 'utf8');
      for (const pattern of forbidden) {
        if (pattern.test(content)) {
          violations.push(`${relative(SRC, file)} enthält ${pattern}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
