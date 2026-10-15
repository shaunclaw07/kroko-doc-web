// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CREATURE_VOICE_FILES } from './infrastructure/audio/creatureVoices';

/**
 * Sonde für den Start ohne Netz: lädt `public/sw.js` in eine nachgestellte Worker-Umgebung und
 * prüft seine drei Regeln (Seiten: erst Netz, dann Vorrat; Bausteine: erst Vorrat; Rest: Vorrat
 * und im Hintergrund auffrischen). Liegt neben `src/pages/` — ein Test dort bräche den Bau.
 * Ob ein echter Browser die Seite ohne Netz startet, misst `scripts/pruefen-offline.py`.
 */

const ROOT = join(__dirname, '..');
const SW_SOURCE = readFileSync(join(ROOT, 'public', 'sw.js'), 'utf8');
const SCOPE = 'https://beispiel.test/';

function page(...assets: string[]): string {
  return `<html><head>${assets.map((asset) => `<link rel="stylesheet" href="/_astro/${asset}">`).join('')}</head></html>`;
}

/** Antwort wie vom eigenen Ursprung: `type` ist dort `basic`, bei `new Response()` aber `default`. */
function sameOrigin(body: string, status = 200): Response {
  const response = new Response(body, { status });
  Object.defineProperty(response, 'type', { value: 'basic' });
  const clone = response.clone.bind(response);
  response.clone = () => {
    const copy = clone();
    Object.defineProperty(copy, 'type', { value: 'basic' });
    return copy;
  };
  return response;
}

class FakeCache {
  readonly entries = new Map<string, Response>();

  private key(request: Request | string, ignoreSearch = false): string {
    const url = new URL(typeof request === 'string' ? request : request.url);
    if (ignoreSearch) {
      url.search = '';
    }
    return url.href;
  }

  /**
   * Streng wie ein Server mit `Vary`: ohne `ignoreVary` findet der Vorrat nichts. Im echten Browser
   * verfehlte er so das Seitenskript (`Vary: Origin`, gemessen am 12.10.2026).
   */
  async match(
    request: Request | string,
    options?: { ignoreSearch?: boolean; ignoreVary?: boolean },
  ): Promise<Response | undefined> {
    if (options?.ignoreVary !== true) {
      return undefined;
    }
    return this.entries.get(this.key(request, options?.ignoreSearch))?.clone();
  }

  async put(request: Request | string, response: Response): Promise<void> {
    this.entries.set(this.key(request), response);
  }

  async add(url: string): Promise<void> {
    const response = await this.network(url);
    if (!response.ok) {
      throw new Error(`nicht ladbar: ${url}`);
    }
    await this.put(url, response);
  }

  async delete(request: Request | string | { url: string }): Promise<boolean> {
    return this.entries.delete(typeof request === 'string' ? request : request.url);
  }

  async keys(): Promise<{ url: string }[]> {
    return [...this.entries.keys()].map((url) => ({ url }));
  }

  network: (url: string) => Promise<Response> = async () => sameOrigin('');
}

type Listener = (event: FetchLike) => void;

interface FetchLike {
  request?: Request;
  waitUntil?: (work: Promise<unknown>) => void;
  respondWith?: (answer: Promise<Response>) => void;
}

function worker(site: Record<string, string>) {
  const cache = new FakeCache();
  const state = { online: true, fetched: [] as string[], site: { ...site } };
  const network = async (input: Request | string): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.url;
    state.fetched.push(url);
    if (!state.online) {
      throw new TypeError('kein Netz');
    }
    const body = state.site[url.slice(SCOPE.length)];
    return body === undefined ? sameOrigin('fehlt', 404) : sameOrigin(body);
  };
  cache.network = network;
  const listeners = new Map<string, Listener>();
  const self = {
    registration: { scope: SCOPE },
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    skipWaiting: async () => undefined,
    clients: { claim: async () => undefined },
  };
  const caches = {
    open: async () => cache,
    keys: async () => ['zahn-agent-v1', 'alter-vorrat'],
    delete: async () => true,
  };
  new Function('self', 'caches', 'fetch', SW_SOURCE)(self, caches, network);

  const lifecycle = async (type: 'install' | 'activate'): Promise<void> => {
    let work: Promise<unknown> = Promise.resolve();
    listeners.get(type)?.({ waitUntil: (promise) => (work = promise) });
    await work;
  };
  /** Stellt eine Anfrage; `null` heißt: der Worker hat sie dem Browser überlassen. */
  const request = async (path: string, init: RequestInit & { navigate?: boolean } = {}): Promise<Response | null> => {
    const { navigate, ...rest } = init;
    const req = new Request(path.startsWith('http') ? path : SCOPE + path, rest);
    Object.defineProperty(req, 'mode', { value: navigate ? 'navigate' : 'cors' });
    let answer: Promise<Response> | null = null;
    listeners.get('fetch')?.({ request: req, respondWith: (promise) => (answer = promise) });
    const settled = answer as Promise<Response> | null;
    const response = settled ? await settled : null;
    // Das Ablegen läuft neben der Antwort her — hier abwarten, damit der Test es sieht.
    await new Promise((resolve) => setTimeout(resolve, 0));
    return response;
  };
  return { cache, state, lifecycle, request };
}

const SITE = {
  '': page('index.AAA.js', 'app.BBB.css'),
  statistik: page('stats.CCC.js', 'app.BBB.css'),
  // Die Seitenskripte teilen sich einen Baustein, den nur sie selbst nennen — nicht das HTML.
  '_astro/index.AAA.js': 'import{a}from"./geteilt.DDD.js";spiel',
  '_astro/geteilt.DDD.js': 'export const a=1;import("./spaet.EEE.js")',
  '_astro/spaet.EEE.js': 'spaet',
  '_astro/app.BBB.css': 'stil',
  '_astro/stats.CCC.js': 'statistik',
  'manifest.webmanifest': '{}',
  'favicon.svg': '<svg/>',
  'logo.svg': '<svg/>',
  'icon-192.png': 'png',
  'sounds/voices/wolf.mp3': 'heul',
};

describe('Start ohne Netz (Service Worker)', () => {
  it('legt bei der Installation beide Seiten samt ihrer Bausteine und Symbole in den Vorrat', async () => {
    const { cache, lifecycle } = worker(SITE);
    await lifecycle('install');
    for (const path of ['', 'statistik', '_astro/index.AAA.js', '_astro/app.BBB.css', '_astro/stats.CCC.js', 'manifest.webmanifest', 'logo.svg']) {
      expect(cache.entries.has(SCOPE + path), `${path || 'Startseite'} fehlt im Vorrat`).toBe(true);
    }
  });

  it('lässt sich von einem fehlenden Symbol nicht an der Installation hindern', async () => {
    const { 'logo.svg': _missing, ...rest } = SITE;
    const { cache, lifecycle } = worker(rest);
    await expect(lifecycle('install')).resolves.toBeUndefined();
    expect(cache.entries.has(SCOPE)).toBe(true);
  });

  it('liefert ohne Netz beide Seiten und ihre Bausteine aus dem Vorrat', async () => {
    const { state, lifecycle, request } = worker(SITE);
    await lifecycle('install');
    state.online = false;
    expect(await (await request('', { navigate: true }))?.text()).toBe(SITE['']);
    expect(await (await request('statistik', { navigate: true }))?.text()).toBe(SITE.statistik);
    expect(await (await request('_astro/index.AAA.js'))?.text()).toBe(SITE['_astro/index.AAA.js']);
  });

  it('hält auch Bausteine vor, die nur ein anderer Baustein einbindet — nicht das HTML', async () => {
    // Gemessen am 12.10.2026 im echten Browser: ohne Netz lud die Seite, zeichnete aber keinen
    // Zahn — das Seitenskript importiert einen geteilten Baustein, den das HTML nicht nennt.
    const { cache, state, lifecycle, request } = worker(SITE);
    await lifecycle('install');
    state.online = false;
    expect(await (await request('_astro/geteilt.DDD.js'))?.text()).toBe(SITE['_astro/geteilt.DDD.js']);
    expect(await (await request('_astro/spaet.EEE.js'))?.text()).toBe('spaet');
    expect(cache.entries.has(`${SCOPE}_astro/geteilt.DDD.js`)).toBe(true);
  });

  it('fällt ohne Netz bei einer unbekannten Adresse auf die Startseite zurück', async () => {
    const { state, lifecycle, request } = worker(SITE);
    await lifecycle('install');
    state.online = false;
    expect(await (await request('?quelle=startbildschirm', { navigate: true }))?.text()).toBe(SITE['']);
    expect(await (await request('gibt-es-nicht', { navigate: true }))?.text()).toBe(SITE['']);
  });

  it('zeigt mit Netz immer den neuen Stand der Seite und räumt Bausteine weg, die keine Seite mehr nennt', async () => {
    const { cache, state, lifecycle, request } = worker(SITE);
    await lifecycle('install');
    state.site[''] = page('index.NEU.js', 'app.BBB.css');
    state.site['_astro/index.NEU.js'] = 'spiel neu';

    expect(await (await request('', { navigate: true }))?.text()).toBe(state.site['']);
    expect(cache.entries.has(`${SCOPE}_astro/index.NEU.js`)).toBe(true);
    expect(cache.entries.has(`${SCOPE}_astro/index.AAA.js`), 'der alte Baustein bleibt liegen').toBe(false);
    expect(cache.entries.has(`${SCOPE}_astro/stats.CCC.js`), 'die Statistikseite braucht ihn noch').toBe(true);
    expect(cache.entries.has(`${SCOPE}_astro/geteilt.DDD.js`), 'nur der alte Baustein band ihn ein').toBe(false);

    state.online = false;
    expect(await (await request('', { navigate: true }))?.text()).toBe(state.site['']);
    expect(await (await request('_astro/index.NEU.js'))?.text()).toBe('spiel neu');
  });

  it('holt einen Baustein mit Hash im Namen nicht noch einmal aus dem Netz', async () => {
    const { state, lifecycle, request } = worker(SITE);
    await lifecycle('install');
    state.fetched.length = 0;
    await request('_astro/app.BBB.css');
    expect(state.fetched).toEqual([]);
  });

  it('hält die Tierstimmen schon bei der Installation vor — sie werden erst nach der ersten Geste geladen', async () => {
    const { state, lifecycle, request } = worker(SITE);
    await lifecycle('install');
    state.online = false;
    expect(await (await request('sounds/voices/wolf.mp3'))?.text()).toBe('heul');
  });

  it('hält eine Datei, die niemand vorab nennt, nach dem ersten Abruf vor', async () => {
    const { state, lifecycle, request } = worker({ ...SITE, 'icon-512.png': 'gross' });
    await lifecycle('install');
    expect(await (await request('icon-512.png'))?.text()).toBe('gross');
    state.online = false;
    expect(await (await request('icon-512.png'))?.text()).toBe('gross');
  });

  it('legt keine Fehlerseite in den Vorrat', async () => {
    const { cache, lifecycle, request } = worker(SITE);
    await lifecycle('install');
    expect((await request('sounds/voices/einhorn.mp3'))?.status).toBe(404);
    expect(cache.entries.has(`${SCOPE}sounds/voices/einhorn.mp3`)).toBe(false);
  });

  it('überlässt fremde Ursprünge, Schreibzugriffe und Teilabrufe dem Browser', async () => {
    const { lifecycle, request } = worker(SITE);
    await lifecycle('install');
    expect(await request('https://anderswo.test/skript.js')).toBeNull();
    expect(await request('statistik', { method: 'POST' })).toBeNull();
    expect(await request('sounds/voices/wolf.mp3', { headers: { range: 'bytes=0-99' } })).toBeNull();
  });

  it('lässt die Sicherung der Runden immer ans Netz (ein Stand aus dem Vorrat wäre ein alter)', async () => {
    const { lifecycle, request } = worker(SITE);
    await lifecycle('install');
    expect(await request('api/log/kroko-abcd-efgh-2345')).toBeNull();
  });

  it('räumt beim Aktivieren fremde Vorräte weg, ohne zu scheitern', async () => {
    const { lifecycle } = worker(SITE);
    await expect(lifecycle('activate')).resolves.toBeUndefined();
  });
});

describe('Installierbarkeit', () => {
  it('meldet den Service Worker im Seitengerüst an — nur im Bau und über den Basis-Pfad', () => {
    const layout = readFileSync(join(ROOT, 'src', 'layouts', 'Base.astro'), 'utf8');
    expect(layout).toContain("'serviceWorker' in navigator");
    expect(layout).toContain('import.meta.env.PROD');
    // Der Vorlagen-Text in Base.astro ist der Prüfgegenstand — `${base}` ist hier Absicht.
    // biome-ignore lint/suspicious/noTemplateCurlyInString: geprüft wird genau diese Zeichenfolge
    expect(layout).toContain('register(`${base}sw.js`, { scope: base })');
    expect(layout).not.toMatch(/register\(\s*['"`]\//);
  });

  it('nennt im Manifest alles, was ein Browser zum Installieren verlangt', () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, 'public', 'manifest.webmanifest'), 'utf8')) as Record<string, unknown>;
    expect(manifest).toMatchObject({ id: './', lang: 'de', start_url: './', scope: './', display: 'standalone' });
    for (const field of ['name', 'short_name', 'description', 'theme_color', 'background_color']) {
      expect(manifest[field], `${field} fehlt`).toBeTruthy();
    }
  });

  it('hält genau die Stimmen vor, die das Spiel kennt', () => {
    const list = /const VOICES = \[([^\]]+)\]/.exec(SW_SOURCE)?.[1] ?? '';
    const voices = [...list.matchAll(/'([^']+)'/g)].map((match) => match[1] ?? '');
    expect(voices.sort()).toEqual(Object.values(CREATURE_VOICE_FILES).sort());
    expect(SW_SOURCE).toContain("const VOICE_DIR = 'sounds/voices/';");
  });

  it('hält im Service Worker nur Dateien vor, die es gibt', () => {
    const shell = /const SHELL = \[([^\]]+)\]/.exec(SW_SOURCE)?.[1] ?? '';
    const files = [...shell.matchAll(/'([^']+)'/g)].map((match) => match[1] ?? '');
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(() => readFileSync(join(ROOT, 'public', file)), `${file} fehlt in public/`).not.toThrow();
    }
  });
});
