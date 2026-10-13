// Mock catalog data — in production this would be fetched from the parent
// storefront's catalog API. For Phase 1, we ship a small in-memory catalog
// so the Studio app is self-contained and demos end-to-end.

export type Channel = {
  id: string;
  name: string;
  category: 'News' | 'Sports' | 'Entertainment' | 'Music' | 'Movies' | 'Kids' | 'Documentary';
  country: string;
  language: string;
  logo?: string;
  streamUrl: string;
  description: string;
  featured?: boolean;
};

export type Movie = {
  id: string;
  title: string;
  year: number;
  duration: number; // minutes
  genre: string[];
  rating: number; // 0-10
  poster: string; // gradient classes for placeholder
  description: string;
  videoUrl: string;
  featured?: boolean;
};

export type Episode = {
  id: string;
  number: number;
  title: string;
  duration: number;
  description: string;
  videoUrl: string;
};

export type Series = {
  id: string;
  title: string;
  year: number;
  seasons: number;
  genre: string[];
  rating: number;
  poster: string;
  description: string;
  episodes: Episode[];
  featured?: boolean;
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  cover: string; // gradient
  audioUrl: string;
};

// 8 demo live channels — all stream URLs are public test streams
export const CHANNELS: Channel[] = [
  {
    id: 'ch-1',
    name: 'Big Buck Bunny Live',
    category: 'Movies',
    country: 'US',
    language: 'English',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: '24/7 animated demo loop powered by the Mux test stream.',
    featured: true,
  },
  {
    id: 'ch-2',
    name: 'Tears of Steel Live',
    category: 'Movies',
    country: 'NL',
    language: 'English',
    streamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    description: 'Blender sci-fi short on a continuous loop.',
    featured: true,
  },
  {
    id: 'ch-3',
    name: 'Apple Basic Stream',
    category: 'Entertainment',
    country: 'US',
    language: 'English',
    streamUrl: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
    description: 'Apple\'s bipbop advanced demo stream — HLS reference.',
  },
  {
    id: 'ch-4',
    name: 'Mux Test Pattern',
    category: 'Documentary',
    country: 'US',
    language: 'English',
    streamUrl: 'https://stream.mux.com/maVDsVZciZy4SbiZynfSe01f8c7VU02d00cTTcTcD007oYzgHxHZc00LrKykrhfICBTtsQyvDSV.m3u8',
    description: 'Mux-hosted 24/7 test pattern for player validation.',
  },
  {
    id: 'ch-5',
    name: 'Sintel Cinema Loop',
    category: 'Movies',
    country: 'NL',
    language: 'English',
    streamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    description: 'Sintel short film on loop from the Mux test library.',
  },
  {
    id: 'ch-6',
    name: 'Caminandes Loop',
    category: 'Kids',
    country: 'NL',
    language: 'English',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'Family-friendly Blender animated short, continuous loop.',
  },
  {
    id: 'ch-7',
    name: 'Cosmos Laundromat',
    category: 'Entertainment',
    country: 'NL',
    language: 'English',
    streamUrl: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
    description: 'Blender open movie on continuous playback.',
  },
  {
    id: 'ch-8',
    name: 'Spring Loop',
    category: 'Music',
    country: 'US',
    language: 'English',
    streamUrl: 'https://stream.mux.com/maVDsVZciZy4SbiZynfSe01f8c7VU02d00cTTcTcD007oYzgHxHZc00LrKykrhfICBTtsQyvDSV.m3u8',
    description: 'Ambient test stream for music-channel demos.',
  },
];

// 6 demo movies — using public-domain Blender open movies
export const MOVIES: Movie[] = [
  {
    id: 'mv-1',
    title: 'Big Buck Bunny',
    year: 2008,
    duration: 10,
    genre: ['Animation', 'Comedy'],
    rating: 7.4,
    poster: 'from-orange-500 via-amber-600 to-red-700',
    description: 'A giant rabbit with a heart bigger than himself takes revenge on three rodents who killed his butterfly friends.',
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    featured: true,
  },
  {
    id: 'mv-2',
    title: 'Tears of Steel',
    year: 2012,
    duration: 12,
    genre: ['Sci-Fi', 'Action'],
    rating: 6.8,
    poster: 'from-cyan-600 via-blue-700 to-indigo-900',
    description: 'In an apocalyptic future, a group of warriors and scientists must save the world from an invasion of ruthless robots.',
    videoUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    featured: true,
  },
  {
    id: 'mv-3',
    title: 'Sintel',
    year: 2010,
    duration: 15,
    genre: ['Fantasy', 'Adventure'],
    rating: 7.2,
    poster: 'from-purple-700 via-violet-800 to-fuchsia-900',
    description: 'A lonely young woman searches for the baby dragon she once rescued, only to discover the cost of her obsession.',
    videoUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
  },
  {
    id: 'mv-4',
    title: 'Caminandes 1: Llama Drama',
    year: 2013,
    duration: 2,
    genre: ['Animation', 'Comedy'],
    rating: 7.0,
    poster: 'from-emerald-500 via-teal-600 to-cyan-800',
    description: 'A llama tries to cross a road in Patagonia, with diminishing success.',
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    id: 'mv-5',
    title: 'Caminandes 2: Gran Dillama',
    year: 2013,
    duration: 3,
    genre: ['Animation', 'Comedy'],
    rating: 7.1,
    poster: 'from-yellow-500 via-orange-600 to-rose-700',
    description: 'Keno continues his quest to reach the other side of a road, this time with a futuristic pair of glasses.',
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    id: 'mv-6',
    title: 'Caminandes 3: Llamigos',
    year: 2016,
    duration: 3,
    genre: ['Animation', 'Comedy'],
    rating: 7.3,
    poster: 'from-pink-500 via-rose-600 to-red-800',
    description: 'Keno meets a new friend, an ostrich named Oti, in his never-ending quest to cross the road.',
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
];

// 4 demo series — each with 3 episodes
export const SERIES: Series[] = [
  {
    id: 'sr-1',
    title: 'Open Movie Anthology',
    year: 2024,
    seasons: 1,
    genre: ['Animation', 'Anthology'],
    rating: 8.1,
    poster: 'from-indigo-700 via-purple-800 to-pink-900',
    description: 'A curated anthology of Blender open movies, each episode a complete short film.',
    featured: true,
    episodes: [
      { id: 'sr-1-e1', number: 1, title: 'Big Buck Bunny', duration: 10, description: 'The bunny meets the rodents.', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { id: 'sr-1-e2', number: 2, title: 'Elephants Dream', duration: 10, description: 'Two characters explore a mechanical wonder.', videoUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8' },
      { id: 'sr-1-e3', number: 3, title: 'Sintel', duration: 15, description: 'A girl, a dragon, a journey.', videoUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8' },
    ],
  },
  {
    id: 'sr-2',
    title: 'Behind the Render',
    year: 2024,
    seasons: 1,
    genre: ['Documentary', 'Tech'],
    rating: 7.9,
    poster: 'from-slate-700 via-gray-800 to-zinc-900',
    description: 'A documentary series on how open-source animated films are made.',
    episodes: [
      { id: 'sr-2-e1', number: 1, title: 'The Blender Institute', duration: 24, description: 'Inside the Amsterdam studio that started it all.', videoUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8' },
      { id: 'sr-2-e2', number: 2, title: 'The Render Farm', duration: 22, description: 'How thousands of frames become a film.', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { id: 'sr-2-e3', number: 3, title: 'The Open Movie Pact', duration: 28, description: 'Why every asset is CC-BY.', videoUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8' },
    ],
  },
  {
    id: 'sr-3',
    title: 'Loop Worlds',
    year: 2023,
    seasons: 1,
    genre: ['Animation', 'Sci-Fi'],
    rating: 7.7,
    poster: 'from-emerald-700 via-cyan-800 to-blue-900',
    description: 'Each episode explores a different self-contained world that loops on itself.',
    episodes: [
      { id: 'sr-3-e1', number: 1, title: 'The Lighthouse', duration: 8, description: 'A keeper who never leaves.', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { id: 'sr-3-e2', number: 2, title: 'The Garden', duration: 9, description: 'A gardener who plants the same seed every day.', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { id: 'sr-3-e3', number: 3, title: 'The Train', duration: 7, description: 'A passenger who rides forever.', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    ],
  },
  {
    id: 'sr-4',
    title: 'Quiet Cities',
    year: 2023,
    seasons: 1,
    genre: ['Documentary', 'Travel'],
    rating: 8.0,
    poster: 'from-amber-600 via-orange-700 to-red-900',
    description: 'A meditation series on cities at their quietest hours.',
    featured: true,
    episodes: [
      { id: 'sr-4-e1', number: 1, title: 'Tokyo, 4 AM', duration: 18, description: 'The world\'s largest city at its emptiest.', videoUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8' },
      { id: 'sr-4-e2', number: 2, title: 'New York, 3 AM', duration: 16, description: 'The city that sleeps, briefly.', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { id: 'sr-4-e3', number: 3, title: 'Lagos, 5 AM', duration: 19, description: 'Africa\'s megacity wakes up.', videoUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8' },
    ],
  },
];

// 6 demo music tracks — public-domain or CC0 audio
export const MUSIC: Track[] = [
  { id: 'tr-1', title: 'Mind Relaxing Piano', artist: 'Mild Manors', album: 'Studio Loops', duration: 168, cover: 'from-violet-600 to-fuchsia-800', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'tr-2', title: 'Afternoon Drive', artist: 'Heliograph', album: 'Routes', duration: 296, cover: 'from-amber-500 to-orange-700', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'tr-3', title: 'Late Night Loop', artist: 'Dust & Static', album: 'After Hours', duration: 360, cover: 'from-slate-600 to-indigo-800', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'tr-4', title: 'Open Road', artist: 'The Caminos', album: 'Highway One', duration: 250, cover: 'from-emerald-500 to-teal-700', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'tr-5', title: 'Solar Flare', artist: 'Helios Project', album: 'Surface', duration: 320, cover: 'from-orange-500 to-red-700', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: 'tr-6', title: 'Coastal Drift', artist: 'Mariana Trench', album: 'Tides', duration: 280, cover: 'from-cyan-500 to-blue-700', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
];

export function getFeatured() {
  return {
    movies: MOVIES.filter(m => m.featured),
    series: SERIES.filter(s => s.featured),
    channels: CHANNELS.filter(c => c.featured),
  };
}
