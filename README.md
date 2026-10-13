# PlayBeat TV

> Online entertainment — movies, music, and live channels. In one place.

PlayBeat TV is a single-page web catalog and player for publicly listed free-to-air live
TV channels, movies, music, and Studio entertainment. It aggregates the Free-TV (human-curated)
and iptv-org (per-country) community playlists and plays the original broadcaster URLs in the
browser via hls.js. No stream is hosted, proxied, or re-distributed by this project.

## What's in this repo

```
.
├── index.html                  # The full PlayBeat TV app — single file, ~9.4 MB
│                                # (HTML + CSS + JS + bundled HLS.js + inline channel catalog)
├── embeds/
│   └── studio/
│       └── index.html          # PlayBeat Studio embed stub. Replace with the AI Studio
│                                # export's bundle when ready (see below).
├── api/
│   └── gemini.ts               # Vercel Edge Function proxy for Gemini calls
│                                # (used by the Studio app, keeps the API key server-side)
├── vercel.json                 # Static deployment + rewrites to the storefront worker
├── .gitignore
└── README.md                   # This file
```

## Routes

| Route | Purpose |
|-------|---------|
| `#/` | Home — hero, entertainment chips, featured, countries |
| `#/live` | All published live channels (full catalog) |
| `#/movies` | Movie channels (target: 26) |
| `#/music` | Music channels (English selection, target: 3) |
| `#/documentaries` | Documentary channels (English selection, target: 3) |
| `#/news` | News channels (Arabic selection, target: 9) |
| `#/series` | Series / shows / entertainment channels |
| `#/c/<code>` | Country-specific listing (e.g. `#/c/in`, `#/c/pk`) |
| `#/k/<key>` | Category listing from the catalog |
| `#/search/<q>` | Global search across the whole catalog |
| `#/app/studio` | Embedded PlayBeat Studio (AI Studio export) |

## Deploy to Vercel

This repo is configured for one-click Vercel import — no build step needed.

1. **Import the repo on Vercel**
   - Go to <https://vercel.com/new>
   - Select the `uzzirulzz-cyber/streabuzzplaybeat` repo
   - Vercel will read `vercel.json` and detect a static site (framework: Other,
     no install, no build, output dir: `.`)
   - Click **Deploy**

2. **Set environment variables** (Vercel → Project → Settings → Environment Variables)
   - `GEMINI_API_KEY` — your Google AI Studio API key (used by `/api/gemini`)

3. **Optional custom domain**
   - Add `playbeat.live` (or your domain) under Project → Settings → Domains
   - Update DNS at your registrar to point to Vercel

## Architecture

```
┌─────────────────────────┐        ┌──────────────────────────────┐
│  Vercel (static + edge) │        │  Cloudflare Worker            │
│                         │        │  playbeat-storefront          │
│  • index.html           │        │  (.crdbixx.workers.dev)       │
│  • embeds/studio/...    │        │                               │
│  • /api/gemini (edge)   │        │  • /broadcast-player/*       │
│                         │        │  • /api/storefront/*         │
└───────────┬─────────────┘        │    → stream.playbeat.live:80  │
            │                      └──────────────────────────────┘
            │ rewrites (afterFiles)
            ▼
   /broadcast-player/*   → worker
   /api/storefront/*      → worker
   /*                     → /index.html (SPA fallback)
```

- **Vercel** serves the static frontend and an Edge Function at `/api/gemini`.
- **Cloudflare Worker** (`playbeat-storefront`) proxies the magxtv/storefront backend
  (`stream.playbeat.live:80`) for `/broadcast-player/*` and `/api/storefront/*`.
- **No streams** are proxied through this app — the player loads the original broadcaster
  URL directly via `hls.js`.

## Self-hosting PlayBeat Studio

The Studio app currently loads a stub at `embeds/studio/index.html`. To replace it with
the real AI Studio export:

1. Open <https://ai.studio/apps/5d188f2a-5162-4288-a32e-990a76df807a>
2. Use the download/code option to export the source bundle
3. Drop the bundle's `index.html` at `embeds/studio/index.html` in this repo
4. Push — Vercel will redeploy automatically

**Security checklist before merging the Studio export:**
- [ ] No Gemini API key baked into the client JS (calls must go through `/api/gemini`)
- [ ] No remote `<script>` tags from untrusted domains
- [ ] No `eval` or `Function(...)` invocations
- [ ] No third-party telemetry beacons
- [ ] Channel/stream listings (if any) come from authorized sources only

## Doctrine (must remain true in production)

1. No unauthorized or invented stream URLs in the production catalog
2. Catalog entries carry a verified/unverified flag
3. A channel in dead / blocked / unchecked state never displays LIVE
4. Geo-blocked playback shows an explanation + retry, never a black frame
5. Counts in the UI always match published records
6. Setting a channel to draft removes it from grids and counts

## Credits

- Channel data: [Free-TV/IPTV](https://github.com/Free-TV/IPTV) and
  [iptv-org/iptv](https://github.com/iptv-org/iptv) community playlists.
- HLS playback: [hls.js](https://github.com/video-dev/hls.js).
- AI features (when Studio is wired in): Google Gemini via `/api/gemini`.

## License & disclaimer

This project is a catalog and web player for third-party, publicly listed streams. We host
nothing, proxy nothing (except the storefront backend at `/api/storefront/*`), and charge
nothing. Every stream remains the property of its broadcaster, may be geo-restricted, and
can disappear at any time. Availability is not guaranteed.
