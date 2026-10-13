/*
 * Service Worker: hält die Seite vor, damit sie ohne Netz startet.
 *
 * Drei Regeln, und keine davon braucht eine Versionsnummer:
 *   1. Seiten (Navigation)      → erst das Netz, bei Fehler der Vorrat. Wer Netz hat, sieht nie
 *                                 einen alten Stand.
 *   2. Bausteine unter _astro/  → erst der Vorrat. Ihr Name trägt einen Hash des Inhalts, ein
 *                                 gleicher Name ist also immer derselbe Inhalt.
 *   3. alles andere vom selben Ursprung (Symbole, Manifest, Tierstimmen)
 *                               → sofort aus dem Vorrat, im Hintergrund aufgefrischt.
 *
 * Diese Datei ist bewusst von Hand geschrieben und liegt unverändert in public/: sie kennt keine
 * Liste der gebauten Dateien, sondern liest die Bausteine aus dem HTML der Seiten und aus den
 * Skripten, die einander einbinden. Der Vorrat liegt
 * im Browserprofil — verwirft der Browser beim Schließen seine Daten (Kinderprofile), ist auch er
 * weg; gegen Datenverlust hilft er nicht.
 */
const CACHE = 'zahn-agent-v1';
const SCOPE = self.registration.scope;
/** Die Seiten der App, relativ zum Geltungsbereich. */
const PAGES = ['', 'statistik'];
/** Was jede Seite braucht, bevor sie zum ersten Mal ohne Netz geöffnet wird. */
const SHELL = ['manifest.webmanifest', 'favicon.svg', 'logo.svg', 'icon-192.png'];
/**
 * Die Tierstimmen — dieselbe Liste wie `CREATURE_VOICE_FILES` (ein Test hält beide gleich). Die
 * Seite lädt sie erst nach der ersten Geste; wer dann schon ohne Netz ist, bekäme sonst keine.
 */
const VOICES = [
  'crocodile.mp3',
  'wolf.mp3',
  'human.mp3',
  'shark.mp3',
  'mouse.mp3',
  'vampire.mp3',
  'panda.mp3',
  'lion.mp3',
  'panther.mp3',
  'sabertooth.mp3',
  'flytrap.mp3',
  'trex.mp3',
];
const VOICE_DIR = 'sounds/voices/';
const ASSET_DIR = '_astro/';
/**
 * Die Sicherung der Runden (`worker/backup.js`) antwortet unter dem eigenen Ursprung. Sie geht
 * immer ans Netz: ein Stand aus dem Vorrat wäre ein alter Stand, und der Abgleich schriebe ihn zurück.
 */
const API_DIR = 'api/';
/** Unter diesem Schlüssel steht je Seite, welche Bausteine ihr letzter Stand nennt. */
const ASSET_LIST_PREFIX = '__bausteine__/';
/**
 * Der Vorrat führt je Adresse genau eine Antwort. Ohne dies vergleicht der Browser die in `Vary`
 * genannten Kopfzeilen der Anfrage — und verfehlte das Seitenskript, das der Worker selbst ohne
 * `Origin` abgelegt hatte, die Seite aber als Modul mit `Origin` anfragt (gemessen am 12.10.2026:
 * `Vary: Origin`, ohne Netz `net::ERR_FAILED`, kein Zahn auf der Bühne).
 */
const ANY_VARIANT = { ignoreVary: true };

/** Liest die Adressen der Bausteine (_astro/…) aus dem HTML einer Seite. */
function assetsIn(html, pageUrl) {
  const found = new Set();
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let url;
    try {
      url = new URL(match[1], pageUrl);
    } catch {
      continue;
    }
    if (url.href.startsWith(SCOPE + ASSET_DIR)) {
      found.add(url.href);
    }
  }
  return [...found];
}

/**
 * Liest aus einem Skript die Bausteine, die es selbst einbindet (`from"./x.js"`, `import("./x.js")`).
 * Das HTML nennt sie nicht: die Seitenskripte teilen sich Bausteine, die nur sie kennen — ohne
 * diese lud die Seite ohne Netz, zeichnete aber keinen Zahn (gemessen am 12.10.2026).
 */
function importsIn(script, scriptUrl) {
  const found = new Set();
  for (const match of script.matchAll(/["'](\.{1,2}\/[^"']+\.(?:js|css))["']/g)) {
    const url = new URL(match[1], scriptUrl).href;
    if (url.startsWith(SCOPE + ASSET_DIR)) {
      found.add(url);
    }
  }
  return [...found];
}

/** Legt einen Baustein und alles, was er einbindet, in den Vorrat; `seen` sammelt die Adressen. */
async function storeAsset(cache, url, seen) {
  if (seen.has(url)) {
    return;
  }
  seen.add(url);
  let response = await cache.match(url, ANY_VARIANT);
  if (!response) {
    response = await fetch(url);
    if (!storable(response)) {
      return;
    }
    await cache.put(url, response.clone());
  }
  if (url.endsWith('.js')) {
    const script = await response.text();
    await Promise.all(importsIn(script, url).map((next) => storeAsset(cache, next, seen)));
  }
}

function storable(response) {
  return Boolean(response) && response.status === 200 && response.type === 'basic';
}

/**
 * Legt eine Seite samt ihrer Bausteine in den Vorrat und räumt Bausteine weg, die keine Seite mehr
 * nennt — sonst wüchse der Vorrat mit jeder Veröffentlichung.
 */
function storePage(request, response) {
  // Nacheinander, nie nebeneinander: das Aufräumen der einen Seite löschte sonst die Bausteine,
  // die die andere gerade ablegt, aber noch nicht in ihrer Liste führt.
  const stored = storing.then(() => storePageNow(request, response));
  storing = stored.catch(() => undefined);
  return stored;
}

let storing = Promise.resolve();

async function storePageNow(request, response) {
  const cache = await caches.open(CACHE);
  const html = await response.clone().text();
  await cache.put(request, response.clone());
  const seen = new Set();
  await Promise.all(assetsIn(html, response.url || request.url).map((url) => storeAsset(cache, url, seen)));
  const assets = [...seen];
  const listKey = SCOPE + ASSET_LIST_PREFIX + encodeURIComponent(new URL(request.url).pathname);
  await cache.put(listKey, new Response(JSON.stringify(assets)));
  await prune(cache);
}

async function prune(cache) {
  const keys = await cache.keys();
  const needed = new Set();
  for (const key of keys) {
    if (key.url.startsWith(SCOPE + ASSET_LIST_PREFIX)) {
      const list = await (await cache.match(key, ANY_VARIANT)).json();
      list.forEach((url) => needed.add(url));
    }
  }
  await Promise.all(
    keys
      .filter((key) => key.url.startsWith(SCOPE + ASSET_DIR) && !needed.has(key.url))
      .map((key) => cache.delete(key)),
  );
}

async function precache() {
  const cache = await caches.open(CACHE);
  await Promise.all(
    PAGES.map(async (page) => {
      const request = new Request(SCOPE + page);
      const response = await fetch(request);
      if (storable(response)) {
        await storePage(request, response);
      }
    }),
  );
  // Ein fehlendes Symbol oder eine fehlende Stimme darf die Installation nicht verhindern.
  const extras = [...SHELL, ...VOICES.map((file) => VOICE_DIR + file)];
  await Promise.all(extras.map((path) => cache.add(SCOPE + path).catch(() => undefined)));
}

async function pageFirstNetwork(request) {
  try {
    const response = await fetch(request);
    if (storable(response)) {
      // Das Ablegen darf die Antwort nicht aufhalten und nicht scheitern lassen.
      storePage(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (error) {
    const cache = await caches.open(CACHE);
    const stored = (await cache.match(request, { ...ANY_VARIANT, ignoreSearch: true })) ?? (await cache.match(SCOPE, ANY_VARIANT));
    if (stored) {
      return stored;
    }
    throw error;
  }
}

async function assetFirstCache(request) {
  const cache = await caches.open(CACHE);
  const stored = await cache.match(request, ANY_VARIANT);
  if (stored) {
    return stored;
  }
  const response = await fetch(request);
  if (storable(response)) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const stored = await cache.match(request, ANY_VARIANT);
  const refresh = fetch(request).then(async (response) => {
    if (storable(response)) {
      await cache.put(request, response.clone());
    }
    return response;
  });
  if (stored) {
    refresh.catch(() => undefined);
    return stored;
  }
  return refresh;
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  // Fremde Ursprünge, Schreibzugriffe und Teilabrufe gehen unberührt ans Netz.
  if (request.method !== 'GET' || !request.url.startsWith(SCOPE) || request.headers.has('range')) {
    return;
  }
  if (request.url.startsWith(SCOPE + API_DIR)) {
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(pageFirstNetwork(request));
  } else if (request.url.startsWith(SCOPE + ASSET_DIR)) {
    event.respondWith(assetFirstCache(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});
