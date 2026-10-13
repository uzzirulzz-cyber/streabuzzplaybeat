-- PlayBeatTV.buzz — D1 catalog schema (compatible with the existing
-- playbeat-live-catalog schema; reuses catalog_channels + epg_programs
-- and adds VOD content, stream sources, trending, watch history,
-- stream health, and cross-platform monitoring).
--
-- Run with: wrangler d1 execute playbeattv-buzz --file=./sql/schema.sql
-- (or via the API: POST /accounts/{acct}/d1/database/{db}/query with the
-- SQL in the body).

PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────────────────────────────────
-- content_items — VOD catalog (movies, series, music_videos, docs)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_items (
  item_id          TEXT PRIMARY KEY,
  kind             TEXT NOT NULL CHECK (kind IN ('movie','series','music_video','documentary')),
  title            TEXT NOT NULL,
  description      TEXT,
  year             INTEGER,
  duration_seconds INTEGER,
  genre            TEXT,                                  -- comma-separated
  rating           REAL DEFAULT 0,
  poster_color    TEXT DEFAULT 'from-slate-700 to-zinc-900',
  category        TEXT NOT NULL DEFAULT 'Entertainment',
  featured        INTEGER NOT NULL DEFAULT 0,
  trending        INTEGER NOT NULL DEFAULT 0,
  published       INTEGER NOT NULL DEFAULT 1,
  added_at        TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_content_kind        ON content_items(kind);
CREATE INDEX IF NOT EXISTS idx_content_published   ON content_items(published);
CREATE INDEX IF NOT EXISTS idx_content_trending   ON content_items(trending) WHERE trending = 1;
CREATE INDEX IF NOT EXISTS idx_content_featured   ON content_items(featured) WHERE featured = 1;

-- ─────────────────────────────────────────────────────────────────────
-- episodes — one row per series episode
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS episodes (
  episode_id      TEXT PRIMARY KEY,
  series_id       TEXT NOT NULL,
  season          INTEGER NOT NULL DEFAULT 1,
  episode_number  INTEGER NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  duration_seconds INTEGER,
  published       INTEGER NOT NULL DEFAULT 1,
  added_at        TEXT NOT NULL,
  FOREIGN KEY (series_id) REFERENCES content_items(item_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_episodes_series ON episodes(series_id, season, episode_number);

-- ─────────────────────────────────────────────────────────────────────
-- stream_sources — primary + backup URLs per content item or channel.
-- The stream Worker tries sources in priority order; the availability
-- Worker records health here so the API can return a status badge with
-- each catalog entry.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stream_sources (
  source_id          INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id           TEXT NOT NULL,                          -- content_items.item_id OR catalog_channels.channel_id
  priority          INTEGER NOT NULL DEFAULT 1,             -- 1 = primary, 2 = first backup, …
  stream_url        TEXT NOT NULL,
  format            TEXT NOT NULL DEFAULT 'hls',           -- hls | dash | mp4 | youtube
  authorized        INTEGER NOT NULL DEFAULT 1,
  drm               INTEGER NOT NULL DEFAULT 0,
  last_check_at     TEXT,
  last_check_status TEXT DEFAULT 'unchecked',               -- alive | flaky | blocked | unreachable | unchecked
  last_check_latency_ms INTEGER,
  added_at          TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES content_items(item_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_stream_sources_item ON stream_sources(item_id, priority);

-- ─────────────────────────────────────────────────────────────────────
-- trending — refreshed by a scheduled Worker (Cron Trigger).
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trending (
  item_id    TEXT NOT NULL,
  rank       INTEGER NOT NULL,
  window     TEXT NOT NULL CHECK (window IN ('daily','weekly','monthly')),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (item_id, window)
);
CREATE INDEX IF NOT EXISTS idx_trending_window ON trending(window, rank);

-- ─────────────────────────────────────────────────────────────────────
-- watch_history — per-session continue-watching (no auth; session_id
-- is generated in the browser and stored in localStorage).
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS watch_history (
  session_id        TEXT NOT NULL,
  item_id           TEXT NOT NULL,
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  completed         INTEGER NOT NULL DEFAULT 0,
  last_played_at    TEXT NOT NULL,
  PRIMARY KEY (session_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_watch_history_session ON watch_history(session_id, last_played_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- stream_health — latest snapshot per source (overwritten on each check)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stream_health (
  source_id     INTEGER PRIMARY KEY,
  status        TEXT NOT NULL,
  last_check_at TEXT NOT NULL,
  latency_ms    INTEGER,
  error_message TEXT,
  FOREIGN KEY (source_id) REFERENCES stream_sources(source_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────
-- platform_health — cross-platform monitoring for the central dashboard.
-- One row per (platform, endpoint, check) — kept for 14 days, older
-- rows are pruned by the scheduled Worker.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_health (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  platform    TEXT NOT NULL,                                -- playbeat.live | magxtv.click | playbeattv.buzz
  endpoint    TEXT NOT NULL,                                -- storefront | api | stream | assets
  checked_at  TEXT NOT NULL,
  status      TEXT NOT NULL,                                -- ok | degraded | down
  latency_ms  INTEGER,
  error       TEXT
);
CREATE INDEX IF NOT EXISTS idx_platform_health_recent ON platform_health(platform, endpoint, checked_at DESC);
