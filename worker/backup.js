/*
 * Sicherung des Rundenprotokolls (Cloudflare Worker, Route `zahn-agent.schaflabs.com/api/*`).
 *
 * Anlass: ein Kinderprofil, das beim Schließen des Browsers seine Daten verwirft — die Sterne des
 * Tier-Albums waren nach jeder Sitzung weg. Die Seite gleicht ihr Protokoll mit diesem Worker ab,
 * wenn ihre Adresse einen Sicherungscode trägt (`?s=…`); ohne Code ruft sie ihn nie.
 *
 *   GET /api/log/<code>   → das Protokoll als JSON-Liste
 *   PUT /api/log/<code>   → ersetzt es durch die gesendete Liste
 *
 * Dies ist kein Angebot für alle: es gibt nur die Codes, die der Betreiber selbst angelegt hat
 * (eine Zeile je Code in der Tabelle `logs`). Ein unbekannter Code ist „nicht gefunden" — niemand
 * kann sich von außen einen Speicherplatz anlegen. Der Code ist das einzige Geheimnis; er steht
 * nirgends im Baum.
 *
 * Tabelle (D1, Bindung `DB`):
 *   CREATE TABLE logs (code TEXT PRIMARY KEY, body TEXT NOT NULL, updated_at TEXT NOT NULL);
 *
 * Geprüft in `src/backupWorker.test.ts`; ausgeliefert wird diese Datei unverändert.
 */

/** Dieselbe Regel wie in der Seite (`infrastructure/storage/httpRemoteLog.ts`). */
const CODE_PATTERN = /^[a-z0-9-]{12,64}$/;
/** D1 nimmt je Zeile höchstens 2 MB; das sind rund 11 000 Runden. */
export const MAX_BODY_BYTES = 1_900_000;

const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

function answer(status, error) {
  return new Response(JSON.stringify({ error }), { status, headers: HEADERS });
}

export default {
  async fetch(request, env) {
    const match = /^\/api\/log\/([^/]+)$/.exec(new URL(request.url).pathname);
    const code = match?.[1] ?? '';
    if (!CODE_PATTERN.test(code)) {
      return answer(404, 'not-found');
    }
    const row = await env.DB.prepare('SELECT body FROM logs WHERE code = ?').bind(code).first();
    if (!row) {
      return answer(404, 'not-found');
    }
    if (request.method === 'GET') {
      return new Response(row.body, { headers: HEADERS });
    }
    if (request.method !== 'PUT') {
      return answer(405, 'method-not-allowed');
    }
    const body = await request.text();
    if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
      return answer(413, 'too-large');
    }
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      return answer(400, 'invalid-json');
    }
    if (!Array.isArray(parsed)) {
      return answer(400, 'not-a-list');
    }
    await env.DB.prepare('UPDATE logs SET body = ?, updated_at = ? WHERE code = ?')
      .bind(body, new Date().toISOString(), code)
      .run();
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  },
};
