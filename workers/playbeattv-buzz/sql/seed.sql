-- Seed data for PlayBeatTV.buzz — every stream URL below is a public
-- test stream (Mux / Apple devstreaming / SoundHelix). No invented or
-- unauthorized sources. Each content item has a primary + backup source
-- so the stream Worker can failover on error.
--
-- Run with: wrangler d1 execute playbeattv-buzz --file=./sql/seed.sql

-- "now" placeholder; the Worker uses CURRENT_TIMESTAMP at runtime.
INSERT OR IGNORE INTO content_items (item_id, kind, title, description, year, duration_seconds, genre, rating, poster_color, category, featured, trending, published, added_at, updated_at) VALUES
  ('mv-001', 'movie', 'Big Buck Bunny',       'A giant rabbit with a heart bigger than himself takes revenge on three rodents who killed his butterfly friends.', 2008, 600, 'Animation,Comedy', 7.4, 'from-orange-500 via-amber-600 to-red-700',     'Movies', 1, 1, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('mv-002', 'movie', 'Tears of Steel',       'In an apocalyptic future, a group of warriors and scientists must save the world from an invasion of ruthless robots.', 2012, 720, 'Sci-Fi,Action', 6.8, 'from-cyan-600 via-blue-700 to-indigo-900',     'Movies', 1, 1, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('mv-003', 'movie', 'Sintel',                'A lonely young woman searches for the baby dragon she once rescued, only to discover the cost of her obsession.', 2010, 900, 'Fantasy,Adventure', 7.2, 'from-purple-700 via-violet-800 to-fuchsia-900', 'Movies', 0, 1, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('mv-004', 'movie', 'Caminandes 1: Llama Drama', 'A llama tries to cross a road in Patagonia, with diminishing success.', 2013, 120, 'Animation,Comedy', 7.0, 'from-emerald-500 via-teal-600 to-cyan-800', 'Movies', 0, 0, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('mv-005', 'movie', 'Caminandes 2: Gran Dillama', 'Keno continues his quest to reach the other side of a road, this time with a futuristic pair of glasses.', 2013, 180, 'Animation,Comedy', 7.1, 'from-yellow-500 via-orange-600 to-rose-700', 'Movies', 0, 0, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('mv-006', 'movie', 'Caminandes 3: Llamigos','Keno meets a new friend, an ostrich named Oti, in his never-ending quest to cross the road.', 2016, 180, 'Animation,Comedy', 7.3, 'from-pink-500 via-rose-600 to-red-800', 'Movies', 0, 1, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('sr-001', 'series', 'Open Movie Anthology', 'A curated anthology of Blender open movies, each episode a complete short film.', 2024, 0, 'Animation,Anthology', 8.1, 'from-indigo-700 via-purple-800 to-pink-900', 'Series', 1, 1, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('sr-002', 'series', 'Behind the Render',     'A documentary series on how open-source animated films are made.', 2024, 0, 'Documentary,Tech', 7.9, 'from-slate-700 via-gray-800 to-zinc-900', 'Series', 0, 0, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('sr-003', 'series', 'Loop Worlds',           'Each episode explores a different self-contained world that loops on itself.', 2023, 0, 'Animation,Sci-Fi', 7.7, 'from-emerald-700 via-cyan-800 to-blue-900', 'Series', 0, 1, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('sr-004', 'series', 'Quiet Cities',          'A meditation series on cities at their quietest hours.', 2023, 0, 'Documentary,Travel', 8.0, 'from-amber-600 via-orange-700 to-red-900', 'Series', 1, 1, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('mu-001', 'music_video', 'Mind Relaxing Piano', 'Solo piano loop for focus and rest.', 2024, 168, 'Ambient,Instrumental', 8.0, 'from-violet-600 to-fuchsia-800', 'Music', 1, 1, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('mu-002', 'music_video', 'Afternoon Drive',  'Sun-soaked instrumental for the open road.', 2024, 296, 'Ambient,Instrumental', 7.8, 'from-amber-500 to-orange-700', 'Music', 0, 1, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('mu-003', 'music_video', 'Late Night Loop',  'Lo-fi without being sleepy.', 2024, 360, 'Ambient,Lo-Fi', 7.9, 'from-slate-600 to-indigo-800', 'Music', 0, 0, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('mu-004', 'music_video', 'Open Road',        'Highway-one drive anthem.', 2024, 250, 'Ambient,Instrumental', 7.7, 'from-emerald-500 to-teal-700', 'Music', 0, 1, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('mu-005', 'music_video', 'Solar Flare',      'Solar-cycle inspired electronica.', 2024, 320, 'Electronic', 7.6, 'from-orange-500 to-red-700', 'Music', 0, 0, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z'),
  ('mu-006', 'music_video', 'Coastal Drift',    'Tidal ambient for the long horizon.', 2024, 280, 'Ambient,Instrumental', 7.5, 'from-cyan-500 to-blue-700', 'Music', 0, 0, 1, '2026-10-13T17:00:00Z', '2026-10-13T17:00:00Z');

-- Episodes for the four series
INSERT OR IGNORE INTO episodes (episode_id, series_id, season, episode_number, title, description, duration_seconds, published, added_at) VALUES
  ('sr-001-e01', 'sr-001', 1, 1, 'Big Buck Bunny',    'The bunny meets the rodents.', 600, 1, '2026-10-13T17:00:00Z'),
  ('sr-001-e02', 'sr-001', 1, 2, 'Elephants Dream',   'Two characters explore a mechanical wonder.', 600, 1, '2026-10-13T17:00:00Z'),
  ('sr-001-e03', 'sr-001', 1, 3, 'Sintel',            'A girl, a dragon, a journey.', 900, 1, '2026-10-13T17:00:00Z'),
  ('sr-002-e01', 'sr-002', 1, 1, 'The Blender Institute', 'Inside the Amsterdam studio that started it all.', 1440, 1, '2026-10-13T17:00:00Z'),
  ('sr-002-e02', 'sr-002', 1, 2, 'The Render Farm',   'How thousands of frames become a film.', 1320, 1, '2026-10-13T17:00:00Z'),
  ('sr-002-e03', 'sr-002', 1, 3, 'The Open Movie Pact','Why every asset is CC-BY.', 1680, 1, '2026-10-13T17:00:00Z'),
  ('sr-003-e01', 'sr-003', 1, 1, 'The Lighthouse',    'A keeper who never leaves.', 480, 1, '2026-10-13T17:00:00Z'),
  ('sr-003-e02', 'sr-003', 1, 2, 'The Garden',        'A gardener who plants the same seed every day.', 540, 1, '2026-10-13T17:00:00Z'),
  ('sr-003-e03', 'sr-003', 1, 3, 'The Train',         'A passenger who rides forever.', 420, 1, '2026-10-13T17:00:00Z'),
  ('sr-004-e01', 'sr-004', 1, 1, 'Tokyo, 4 AM',       "The world's largest city at its emptiest.", 1080, 1, '2026-10-13T17:00:00Z'),
  ('sr-004-e02', 'sr-004', 1, 2, 'New York, 3 AM',     'The city that sleeps, briefly.', 960, 1, '2026-10-13T17:00:00Z'),
  ('sr-004-e03', 'sr-004', 1, 3, 'Lagos, 5 AM',       "Africa's megacity wakes up.", 1140, 1, '2026-10-13T17:00:00Z');

-- Stream sources: each item has a primary + backup URL
-- All URLs are public test streams (Mux / Apple devstreaming / SoundHelix).
INSERT OR IGNORE INTO stream_sources (item_id, priority, stream_url, format, authorized, last_check_status, added_at) VALUES
  -- Movies (primary + backup)
  ('mv-001', 1, 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mv-001', 2, 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mv-002', 1, 'https://test-streams.mux.dev/test_001/stream.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mv-002', 2, 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mv-003', 1, 'https://test-streams.mux.dev/test_001/stream.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mv-003', 2, 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mv-004', 1, 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mv-004', 2, 'https://stream.mux.com/maVDsVZciZy4SbiZynfSe01f8c7VU02d00cTTcTcD007oYzgHxHZc00LrKykrhfICBTtsQyvDSV.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mv-005', 1, 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mv-005', 2, 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mv-006', 1, 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mv-006', 2, 'https://stream.mux.com/maVDsVZciZy4SbiZynfSe01f8c7VU02d00cTTcTcD007oYzgHxHZc00LrKykrhfICBTtsQyvDSV.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  -- Series episodes (use the same test streams as the movies)
  ('sr-001', 1, 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('sr-001', 2, 'https://test-streams.mux.dev/test_001/stream.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('sr-002', 1, 'https://test-streams.mux.dev/test_001/stream.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('sr-002', 2, 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('sr-003', 1, 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('sr-003', 2, 'https://test-streams.mux.dev/test_001/stream.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('sr-004', 1, 'https://test-streams.mux.dev/test_001/stream.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('sr-004', 2, 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8', 'hls', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  -- Music videos — these are MP3 audio streams (the assets Worker can wrap
  -- them with a poster image to make them "videos")
  ('mu-001', 1, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'mp4', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mu-002', 1, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'mp4', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mu-003', 1, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'mp4', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mu-004', 1, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'mp4', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mu-005', 1, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'mp4', 1, 'unchecked', '2026-10-13T17:00:00Z'),
  ('mu-006', 1, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', 'mp4', 1, 'unchecked', '2026-10-13T17:00:00Z');

-- Initial trending ranks (deterministic seed; the scheduled Worker will
-- refresh these based on actual play counts)
INSERT OR IGNORE INTO trending (item_id, rank, window, updated_at) VALUES
  ('mv-001', 1, 'daily', '2026-10-13T17:00:00Z'),
  ('sr-001', 2, 'daily', '2026-10-13T17:00:00Z'),
  ('mu-001', 3, 'daily', '2026-10-13T17:00:00Z'),
  ('mv-002', 4, 'daily', '2026-10-13T17:00:00Z'),
  ('sr-004', 5, 'daily', '2026-10-13T17:00:00Z'),
  ('mu-004', 6, 'daily', '2026-10-13T17:00:00Z'),
  ('mv-006', 1, 'weekly', '2026-10-13T17:00:00Z'),
  ('sr-001', 2, 'weekly', '2026-10-13T17:00:00Z'),
  ('mv-001', 3, 'weekly', '2026-10-13T17:00:00Z'),
  ('sr-004', 4, 'weekly', '2026-10-13T17:00:00Z'),
  ('mu-001', 5, 'weekly', '2026-10-13T17:00:00Z'),
  ('mv-002', 6, 'weekly', '2026-10-13T17:00:00Z');
