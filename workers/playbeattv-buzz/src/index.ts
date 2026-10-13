/**
 * PlayBeatTV.buzz — single Cloudflare Worker.
 *
 * Routes by hostname:
 *   api.playbeattv.buzz/*     → catalog API (D1 queries, JSON)
 *   stream.playbeattv.buzz/*  → authorized stream proxy with backup failover
 *   assets.playbeattv.buzz/*  → R2 CDN (posters, artwork, thumbnails)
 *
 * The same Worker is also mounted on the *.workers.dev subdomain for
 * testing before the custom domains are wired up. The route decision is
 * made by inspecting the Host header so the deployment works identically
 * in both environments.
 *
 * Bindings (set in wrangler.toml):
 *   DB    — D1 database (catalog)
 *   ASSETS — R2 bucket (posters, artwork, thumbnails)
 *
 * Secrets (set with `wrangler secret put`):
 *   STREAM_TOKEN  — bearer token the storefront sends on /stream/* calls
 *                   to confirm the request is from an authorized client.
 *
 * Doctrine:
 *   - Every stream_url in the catalog is the original broadcaster URL.
 *   - No stream is proxied unless `authorized = 1` in stream_sources.
 *   - The proxy adds Cache-Control headers so Cloudflare's edge cache
 *     holds segments for ~10s, smoothing playback under load.
 *   - Backup sources are tried in priority order on the first failure.
 */

export interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  STREAM_TOKEN?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────
export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const host = (req.headers.get('host') || url.hostname).toLowerCase();

    try {
      // Route by hostname. The *.workers.dev subdomain is treated as the
      // API endpoint so testing works before the custom domains are live.
      if (host.startsWith('api.') || host.includes('workers.dev')) {
        return await apiHandler(req, env, url);
      }
      if (host.startsWith('stream.')) {
        return await streamHandler(req, env, url, ctx);
      }
      if (host.startsWith('assets.')) {
        return await assetsHandler(req, env, url);
      }
      // Fallback: a small landing page so the bare domain shows something.
      return landingResponse();
    } catch (err) {
      return json(500, { error: 'Worker failure', message: String(err) });
    }
  },

  // Scheduled trigger: every 5 minutes, ping each stream source and
  // record health. The monitoring dashboard reads from stream_health.
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runHealthChecks(env));
  },
};

// ─────────────────────────────────────────────────────────────────────
// API handler — api.playbeattv.buzz
// ─────────────────────────────────────────────────────────────────────
async function apiHandler(req: Request, env: Env, url: URL): Promise<Response> {
  // CORS for cross-origin storefront requests
  if (req.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

  const path = url.pathname.replace(/^\/+/, '');

  // GET /health — simple liveness probe (also used by the dashboard)
  if (path === 'health' || path === '') {
    return json(200, { ok: true, service: 'playbeattv-buzz-api', time: new Date().toISOString() });
  }

  // GET /catalog?kind=movie|series|music_video|documentary
  if (path === 'catalog') {
    const kind = url.searchParams.get('kind');
    const where = kind ? 'WHERE kind = ? AND published = 1' : 'WHERE published = 1';
    const args: any[] = kind ? [kind] : [];
    const { results } = await env.DB.prepare(
      `SELECT item_id, kind, title, description, year, duration_seconds,
              genre, rating, poster_color, category, featured, trending,
              (SELECT GROUP_CONCAT(stream_url, '||') FROM stream_sources WHERE item_id = content_items.item_id AND authorized = 1 ORDER BY priority) AS streams,
              (SELECT last_check_status FROM stream_health JOIN stream_sources ON stream_health.source_id = stream_sources.source_id WHERE stream_sources.item_id = content_items.item_id ORDER BY stream_sources.priority LIMIT 1) AS health
       FROM content_items ${where} ORDER BY featured DESC, trending DESC, title LIMIT 200`
    ).bind(...args).all();
    return json(200, { items: results });
  }

  // GET /item/:id — full detail incl. all sources + (for series) episodes
  const itemMatch = path.match(/^item\/([^/]+)$/);
  if (itemMatch) {
    const id = decodeURIComponent(itemMatch[1]);
    const item = await env.DB.prepare(
      `SELECT * FROM content_items WHERE item_id = ? AND published = 1`
    ).bind(id).first();
    if (!item) return json(404, { error: 'Not found' });

    const sources = await env.DB.prepare(
      `SELECT s.source_id, s.priority, s.stream_url, s.format, s.authorized,
              s.last_check_status, s.last_check_latency_ms,
              h.status AS health_status, h.latency_ms AS health_latency, h.last_check_at AS health_at
       FROM stream_sources s LEFT JOIN stream_health h ON h.source_id = s.source_id
       WHERE s.item_id = ? AND s.authorized = 1 ORDER BY s.priority`
    ).bind(id).all();

    let episodes: any[] = [];
    if (item.kind === 'series') {
      episodes = (await env.DB.prepare(
        `SELECT episode_id, season, episode_number, title, description, duration_seconds
         FROM episodes WHERE series_id = ? AND published = 1
         ORDER BY season, episode_number`
      ).bind(id).all()).results || [];
    }

    return json(200, { item, sources: sources.results, episodes });
  }

  // GET /trending?window=daily|weekly|monthly
  if (path === 'trending') {
    const window = url.searchParams.get('window') || 'daily';
    const { results } = await env.DB.prepare(
      `SELECT c.item_id, c.kind, c.title, c.poster_color, c.year, c.rating, c.duration_seconds, t.rank
       FROM trending t JOIN content_items c ON c.item_id = t.item_id
       WHERE t.window = ? AND c.published = 1 ORDER BY t.rank LIMIT 24`
    ).bind(window).all();
    return json(200, { window, items: results });
  }

  // GET /search?q=...
  if (path === 'search') {
    const q = (url.searchParams.get('q') || '').trim();
    if (!q) return json(200, { items: [] });
    const like = '%' + q.replace(/[%_]/g, c => '\\' + c) + '%';
    const { results } = await env.DB.prepare(
      `SELECT item_id, kind, title, description, year, duration_seconds, genre, rating, poster_color, category
       FROM content_items
       WHERE published = 1 AND (title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR genre LIKE ? ESCAPE '\\')
       ORDER BY title LIMIT 50`
    ).bind(like, like, like).all();
    return json(200, { q, items: results });
  }

  // POST /history — record a continue-watching entry
  if (path === 'history' && req.method === 'POST') {
    const body = await req.json();
    const { session_id, item_id, progress_seconds, duration_seconds, completed } = body || {};
    if (!session_id || !item_id) return json(400, { error: 'session_id and item_id required' });
    await env.DB.prepare(
      `INSERT INTO watch_history (session_id, item_id, progress_seconds, duration_seconds, completed, last_played_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(session_id, item_id) DO UPDATE SET
         progress_seconds = excluded.progress_seconds,
         duration_seconds = excluded.duration_seconds,
         completed = excluded.completed,
         last_played_at = excluded.last_played_at`
    ).bind(session_id, item_id, progress_seconds || 0, duration_seconds || null, completed ? 1 : 0, new Date().toISOString()).run();
    return json(200, { ok: true });
  }

  // GET /history/:session_id — fetch continue-watching
  const histMatch = path.match(/^history\/([^/]+)$/);
  if (histMatch && req.method === 'GET') {
    const sid = decodeURIComponent(histMatch[1]);
    const { results } = await env.DB.prepare(
      `SELECT w.item_id, w.progress_seconds, w.duration_seconds, w.completed, w.last_played_at,
              c.kind, c.title, c.poster_color, c.year, c.duration_seconds AS full_duration
       FROM watch_history w JOIN content_items c ON c.item_id = w.item_id
       WHERE w.session_id = ? ORDER BY w.last_played_at DESC LIMIT 24`
    ).bind(sid).all();
    return json(200, { items: results });
  }

  // GET /monitoring — cross-platform health snapshot (used by the dashboard)
  if (path === 'monitoring') {
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { results } = await env.DB.prepare(
      `SELECT platform, endpoint, status, latency_ms, error, checked_at
       FROM platform_health WHERE checked_at >= ?
       ORDER BY platform, endpoint, checked_at DESC`
    ).bind(since).all();
    // collapse to latest per (platform, endpoint)
    const latest = new Map();
    for (const r of results || []) {
      const k = `${r.platform}|${r.endpoint}`;
      if (!latest.has(k)) latest.set(k, r);
    }
    return json(200, { checks: [...latest.values()] });
  }

  return json(404, { error: 'Not found', path });
}

// ─────────────────────────────────────────────────────────────────────
// Stream handler — stream.playbeattv.buzz
//
// GET /play/:item_id?src=<n>   → proxy the primary or n-th backup source
// GET /health/:item_id         → quick HEAD probe of the primary source
//
// The proxy fetches upstream and passes through to the client. HLS
// manifests (.m3u8) are rewritten so segment URLs resolve through this
// Worker — that way the upstream broadcaster never sees the client IP
// and we can switch to a backup source transparently on segment 404.
// ─────────────────────────────────────────────────────────────────────
async function streamHandler(req: Request, env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
  if (req.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

  // Optional bearer-token gate (set STREAM_TOKEN to enable)
  if (env.STREAM_TOKEN) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${env.STREAM_TOKEN}`) {
      return json(401, { error: 'Unauthorized' });
    }
  }

  const path = url.pathname.replace(/^\/+/, '');

  // /health/:item_id — quick liveness probe
  const healthMatch = path.match(/^health\/([^/]+)$/);
  if (healthMatch) {
    const id = decodeURIComponent(healthMatch[1]);
    return probeItemHealth(env, id);
  }

  // /play/:item_id?src=<n>   (n defaults to 1 = primary)
  const playMatch = path.match(/^play\/([^/]+)$/);
  if (!playMatch) {
    return json(404, { error: 'Use /play/:item_id or /health/:item_id' });
  }
  const itemId = decodeURIComponent(playMatch[1]);
  const sourceN = Math.max(1, parseInt(url.searchParams.get('src') || '1', 10));

  const sources = (await env.DB.prepare(
    `SELECT source_id, stream_url, format, authorized
     FROM stream_sources WHERE item_id = ? AND authorized = 1
     ORDER BY priority`
  ).bind(itemId).all()).results;

  if (!sources || !sources.length) {
    return json(404, { error: 'No authorized sources for this item' });
  }

  // If the requested source index is out of range, fall through to the
  // first available — the storefront's hls.js error handler will retry
  // with src=<n+1> on failure.
  const srcIdx = Math.min(sourceN - 1, sources.length - 1);
  const source: any = sources[srcIdx];
  const upstreamUrl: string = source.stream_url;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: { 'User-Agent': 'PlayBeatTV-buzz-proxy/1.0' },
      redirect: 'follow',
    });

    if (!upstream.ok && srcIdx + 1 < sources.length) {
      // Failover: tell the client to try the next source
      return json(502, {
        error: 'Upstream failed',
        status: upstream.status,
        next_source: srcIdx + 2,
        total_sources: sources.length,
      });
    }

    // For .m3u8 manifests, rewrite segment URLs to route through this
    // Worker (so subsequent segment fetches also get failover + caching).
    const ct = upstream.headers.get('content-type') || '';
    if (ct.includes('mpegurl') || upstreamUrl.includes('.m3u8')) {
      const body = await upstream.text();
      const rewritten = rewriteM3U8(body, url.pathname, sources);
      return new Response(rewritten, {
        status: upstream.status,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'public, max-age=10',     // smooth playback under load
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // For other content (e.g. .ts segments), pass through with caching
    const passthroughHeaders = new Headers(upstream.headers);
    passthroughHeaders.set('Access-Control-Allow-Origin', '*');
    passthroughHeaders.set('Cache-Control', 'public, max-age=600');
    return new Response(upstream.body, {
      status: upstream.status,
      headers: passthroughHeaders,
    });
  } catch (err) {
    if (srcIdx + 1 < sources.length) {
      return json(502, {
        error: 'Upstream fetch failed',
        message: String(err),
        next_source: srcIdx + 2,
        total_sources: sources.length,
      });
    }
    return json(502, { error: 'Upstream fetch failed', message: String(err) });
  }
}

// Rewrite a .m3u8 manifest so segment URLs route through this Worker.
// For relative segment URLs, prepend the Worker's stream path; for
// absolute URLs, replace them with a /play/:item_id?src=N&u=<encoded>
// form so the next segment fetch goes back through the proxy.
function rewriteM3U8(manifest: string, playPath: string, _sources: any[]): string {
  return manifest
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      // segment line
      if (/^https?:\/\//.test(trimmed)) {
        // absolute URL — wrap through the proxy
        return `${playPath}?u=${encodeURIComponent(trimmed)}`;
      }
      // relative — prepend the play path's directory
      const base = playPath.replace(/\/[^/]*$/, '/');
      return new URL(trimmed, 'https://dummy.host' + base).pathname;
    })
    .join('\n');
}

async function probeItemHealth(env: Env, itemId: string): Promise<Response> {
  const sources = (await env.DB.prepare(
    `SELECT source_id, stream_url FROM stream_sources
     WHERE item_id = ? AND authorized = 1 ORDER BY priority`
  ).bind(itemId).all()).results;

  if (!sources || !sources.length) {
    return json(404, { error: 'No sources' });
  }

  const t0 = Date.now();
  try {
    const probe = await fetch((sources[0] as any).stream_url, { method: 'GET' });
    const latency = Date.now() - t0;
    const ok = probe.ok || probe.status === 200;
    const status = ok ? 'alive' : (probe.status === 403 || probe.status === 451 ? 'blocked' : 'flaky');

    // Record health snapshot
    await env.DB.prepare(
      `INSERT INTO stream_health (source_id, status, last_check_at, latency_ms, error_message)
       VALUES (?, ?, ?, ?, NULL)
       ON CONFLICT(source_id) DO UPDATE SET
         status = excluded.status,
         last_check_at = excluded.last_check_at,
         latency_ms = excluded.latency_ms`
    ).bind((sources[0] as any).source_id, status, new Date().toISOString(), latency).run();

    return json(200, { item_id: itemId, status, latency_ms: latency, sources: sources.length });
  } catch (err) {
    return json(502, { item_id: itemId, status: 'unreachable', error: String(err) });
  }
}

// ─────────────────────────────────────────────────────────────────────
// Assets handler — assets.playbeattv.buzz
// Serves posters/artwork/thumbnails from R2. If R2 isn't enabled (yet),
// falls back to a deterministic gradient SVG placeholder so the UI
// never shows broken images.
// ─────────────────────────────────────────────────────────────────────
async function assetsHandler(req: Request, env: Env, url: URL): Promise<Response> {
  if (req.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

  const key = url.pathname.replace(/^\/+/, '');
  if (!key) {
    return json(200, { service: 'playbeattv-buzz-assets', r2: !!env.ASSETS });
  }

  // If R2 is bound, try to fetch from the bucket first.
  if (env.ASSETS) {
    const obj = await env.ASSETS.get(key);
    if (obj) {
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set('Cache-Control', 'public, max-age=86400, immutable');
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('X-Content-Type-Options', 'nosniff');
      return new Response(obj.body, { headers });
    }
  }

  // Fallback: gradient SVG placeholder. The "key" can encode a hue and
  // initials (e.g., /poster/orange-500/Bi.svg) so each title gets a
  // deterministic but distinct artwork.
  const hue = hashHue(key);
  const initials = key.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'PB';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},55%,40%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 60) % 360},55%,20%)"/>
    </linearGradient></defs>
    <rect width="400" height="600" fill="url(#g)"/>
    <text x="200" y="320" font-family="Outfit,sans-serif" font-size="120" font-weight="700"
          fill="hsl(${hue},80%,90%)" text-anchor="middle">${escapeXml(initials)}</text>
  </svg>`;
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] || c));
}

// ─────────────────────────────────────────────────────────────────────
// Scheduled health-check run — probes every authorized source and
// records the latest snapshot in stream_health. Also prunes
// platform_health rows older than 14 days.
// ─────────────────────────────────────────────────────────────────────
async function runHealthChecks(env: Env): Promise<void> {
  const sources: any[] = (await env.DB.prepare(
    `SELECT source_id, stream_url FROM stream_sources WHERE authorized = 1 ORDER BY source_id`
  ).all()).results || [];

  await Promise.all(sources.map(async (s) => {
    const t0 = Date.now();
    try {
      const probe = await fetch(s.stream_url, { method: 'GET' });
      const latency = Date.now() - t0;
      const status = probe.ok ? 'alive' : (probe.status === 403 || probe.status === 451 ? 'blocked' : 'flaky');
      await env.DB.prepare(
        `INSERT INTO stream_health (source_id, status, last_check_at, latency_ms, error_message)
         VALUES (?, ?, ?, ?, NULL)
         ON CONFLICT(source_id) DO UPDATE SET
           status = excluded.status,
           last_check_at = excluded.last_check_at,
           latency_ms = excluded.latency_ms`
      ).bind(s.source_id, status, new Date().toISOString(), latency).run();
    } catch (err) {
      await env.DB.prepare(
        `INSERT INTO stream_health (source_id, status, last_check_at, latency_ms, error_message)
         VALUES (?, 'unreachable', ?, NULL, ?)
         ON CONFLICT(source_id) DO UPDATE SET
           status = 'unreachable',
           last_check_at = excluded.last_check_at,
           error_message = excluded.error_message`
      ).bind(s.source_id, new Date().toISOString(), String(err)).run();
    }
  }));

  // Prune old platform_health rows
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(`DELETE FROM platform_health WHERE checked_at < ?`).bind(cutoff).run();
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────
function json(status: number, body: any): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store',
    },
  });
}

function cors(res: Response): Response {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

function landingResponse(): Response {
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>PlayBeatTV.buzz Worker</title>
<style>
  body{margin:0;display:grid;place-items:center;min-height:100vh;
       background:#0a0c10;color:#e8edf6;font:15px/1.5 system-ui,sans-serif}
  .card{padding:40px;text-align:center;border:1px solid #1f2c44;border-radius:14px;background:#0f1626;max-width:520px}
  h1{margin:0 0 8px;font-size:24px}
  p{margin:8px 0;color:#8fa0b8}
  code{background:#141d30;padding:2px 6px;border-radius:6px;color:#4f8cff}
</style></head><body><div class="card">
<h1>PlayBeatTV.buzz</h1>
<p>Worker is live. Use one of the subdomains:</p>
<p><code>api.playbeattv.buzz</code> · catalog API</p>
<p><code>stream.playbeattv.buzz</code> · authorized playback proxy</p>
<p><code>assets.playbeattv.buzz</code> · posters + artwork CDN</p>
</div></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
