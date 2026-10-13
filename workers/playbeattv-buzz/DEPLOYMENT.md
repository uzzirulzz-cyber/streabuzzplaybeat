# PlayBeatTV.buzz — Cloudflare Deployment Guide

This guide covers what you need to do on the Cloudflare side to wire up
`api.playbeattv.buzz`, `stream.playbeattv.buzz`, and `assets.playbeattv.buzz`
so they point at the Worker code in `workers/playbeattv-buzz/`.

## What's already done

- ✅ Worker source code: `workers/playbeattv-buzz/src/index.ts`
- ✅ D1 schema: `workers/playbeattv-buzz/sql/schema.sql`
- ✅ Seed data (authorized test streams only): `workers/playbeattv-buzz/sql/seed.sql`
- ✅ `wrangler.toml` configured with bindings + routes + cron trigger
- ✅ Storefront integration: `#/app/premium` and `#/admin/monitoring` routes live on Vercel
- ✅ Studio app: multi-source failover VideoPlayer + Trending rail + Monitoring dashboard
- ✅ Catalog schema extends the existing `playbeat-live-catalog` D1 database shape (catalog_channels + epg_programs reused)
- ✅ **No R2 dependency** — assets stored in D1 `assets` table as TEXT (SVG) or base64-encoded TEXT (binary), with on-the-fly SVG gradient fallback

## What you need to do (4 steps — R2 not required)

### Step 1 — Register playbeattv.buzz and add it to Cloudflare

1. Register `playbeattv.buzz` at your preferred registrar (Namecheap, Cloudflare
   Registrar, Porkbun, etc.).
2. In the Cloudflare dashboard: **Add a Site** → enter `playbeattv.buzz` →
   select the Free plan.
3. Cloudflare will give you two nameservers (e.g., `alice.ns.cloudflare.com`,
   `bob.ns.cloudflare.com`). Set those at your registrar.
4. Wait for DNS propagation (usually 5–30 minutes; Cloudflare will email
   you when the zone is active).

### Step 2 — Create the D1 database + apply schema + seed

```bash
cd workers/playbeattv-buzz

# Create the database
npx wrangler d1 create playbeattv-buzz

# Copy the database_id from the command's output into wrangler.toml
# (replace REPLACE_WITH_D1_UUID).

# Apply schema + seed
npx wrangler d1 execute playbeattv-buzz --file=./sql/schema.sql
npx wrangler d1 execute playbeattv-buzz --file=./sql/seed.sql

# Sanity check — should show 8 tables
npx wrangler d1 execute playbeattv-buzz --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'"
```

Expected output:
```
content_items
episodes
platform_health
stream_health
stream_sources
trending
watch_history
assets
```

### Step 3 — Deploy the Worker

```bash
cd workers/playbeattv-buzz
npm install
npx wrangler deploy
```

The first deploy will fail at the "Custom Domains" step because the zone
isn't fully active yet. After the zone is active (Step 1), re-run:

```bash
npx wrangler deploy
```

The Worker will be live at:
- `https://playbeattv-buzz.<your-subdomain>.workers.dev` (always)
- `https://api.playbeattv.buzz` (after zone activation)
- `https://stream.playbeattv.buzz`
- `https://assets.playbeattv.buzz`

### Step 4 — Set the STREAM_TOKEN secret (optional)

If you want to gate the stream proxy so only your storefront can call it:

```bash
npx wrangler secret put STREAM_TOKEN
# paste a random 32-byte hex string when prompted
```

Then update the storefront's `openPlayer` to send the bearer token in
the `Authorization` header when fetching from `stream.playbeattv.buzz`.

For v1, leaving STREAM_TOKEN unset keeps the proxy open (matches the
existing `playbeat-storefront` Worker behavior on `playbeat.live`).

## Verifying the deployment

After all 4 steps:

```bash
# API health
curl https://api.playbeattv.buzz/health
# → {"ok":true,"service":"playbeattv-buzz-api","time":"…"}

# Catalog list
curl https://api.playbeattv.buzz/catalog?kind=movie
# → {"items":[…]}

# Trending
curl https://api.playbeattv.buzz/trending?window=daily
# → {"window":"daily","items":[…]}

# Stream playback — returns the m3u8 manifest (rewritten through Worker)
curl https://stream.playbeattv.buzz/play/mv-001
# → #EXTM3U ...

# Stream health probe
curl https://stream.playbeattv.buzz/health/mv-001
# → {"item_id":"mv-001","status":"alive","latency_ms":89,"sources":2}

# Asset from D1 (sample poster stored as SVG)
curl https://assets.playbeattv.buzz/poster/mv-001.svg
# → <svg>...</svg>

# Asset fallback (deterministic gradient, no D1 entry needed)
curl https://assets.playbeattv.buzz/poster/unknown-item.svg
# → <svg>...</svg>  (generated on the fly)

# Asset endpoint info
curl https://assets.playbeattv.buzz/
# → {"service":"playbeattv-buzz-assets","storage":"D1 (no R2 dependency)",...}

# Monitoring endpoint
curl https://api.playbeattv.buzz/monitoring
# → {"checks":[…]}
```

The storefront at `https://streabuzzplaybeat.vercel.app` will automatically
start using these endpoints once they're live — the React app already
polls `api.playbeattv.buzz/monitoring` every 30s on the Monitoring page,
and probes `stream.playbeattv.buzz/health/<title>` before each channel
playback. Both gracefully fall back to mock data while the Worker is
unreachable.

## Architecture (after deployment)

```
                ┌──────────────────────────────────────────────────────┐
                │              Cloudflare edge network                 │
                │                                                      │
                │  api.playbeattv.buzz     ──┐                         │
                │  stream.playbeattv.buzz   ──┼──> playbeattv-buzz     │
                │  assets.playbeattv.buzz   ──┘    Worker              │
                │                                  │  │                │
                │                                  │  └──> D1 db       │
                │                                  │     ├─ catalog    │
                │                                  │     ├─ stream_links│
                │                                  │     ├─ assets     │
                │                                  │     ├─ health     │
                │                                  │     └─ trending  │
                │                                  └──────> upstream   │
                │                                          broadcaster  │
                │  Cron trigger (every 5 min) ──> runHealthChecks      │
                │                                          │              │
                │                                          ▼              │
                │                                  stream_health table  │
                └──────────────────────────────────────────────────────┘
                                          ▲
                                          │  fetch + CORS
                                          │
                ┌─────────────────────────┴─────────────────────────────┐
                │  Vercel (streabuzzplaybeat project)                    │
                │                                                       │
                │  index.html (9.4 MB storefront)                       │
                │  embeds/studio/ (React Studio bundle)                  │
                │  /api/gemini (Vercel Edge Function → Google Gemini)   │
                │  #/app/premium      → iframe → Studio dashboard        │
                │  #/admin/monitoring → iframe → Studio monitoring       │
                └───────────────────────────────────────────────────────┘
```

**No R2 dependency** — all persistent state lives in D1:
- Catalog (content_items, episodes)
- Stream links (stream_sources — primary + backup URLs)
- Assets (assets table — SVG posters, base64-encoded binary)
- Trending (trending table — refreshed by cron)
- Watch history (watch_history table)
- Stream health (stream_health table)
- Cross-platform monitoring (platform_health table)

## Cross-platform monitoring

The Monitoring dashboard at `#/admin/monitoring` shows health for all
three platforms:

| Platform          | Storefront | API | Stream | Assets |
|-------------------|------------|-----|--------|--------|
| PlayBeat.live     | ok         | ok  | ok     | ok     |
| MagXTV.click      | ok         | ok  | ok     | ok     |
| PlayBeatTV.buzz   | ok         | ok  | ok     | ok     |

After the Worker is deployed, the dashboard reads live data from
`api.playbeattv.buzz/monitoring`. Until then, it shows a deterministic
mock with the correct shape so you can verify the UI works end-to-end.

## Cost notes

- **Vercel Hobby**: free for the storefront (already deployed).
- **Cloudflare Workers Free**: 100,000 requests/day — plenty for v1.
- **Cloudflare D1 Free**: 5 GB storage + 5M rows read/day — the seed
  uses ~40 rows across 8 tables, leaves 99.999% headroom. SVG posters
  are ~600 bytes each, so even 10,000 assets = ~6 MB.
- **Cloudflare DNS**: free, unlimited queries.
- **Cron Triggers**: free, up to 5 per Worker.
- **R2**: not required.

Total additional monthly cost for PlayBeatTV.buzz on the Free tier: $0.
