import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { MOVIES, SERIES, CHANNELS, MUSIC } from '../data/catalog';

// Global app state — favorites, continue watching, recently played, queue.

type CatalogRef = { id: string; kind: 'movie' | 'series' | 'channel' | 'track'; title: string; };

type AppState = {
  favorites: CatalogRef[];
  continueWatching: { id: string; kind: CatalogRef['kind']; title: string; progress: number; }[];
  recentlyPlayed: CatalogRef[];
  queue: string[]; // music track IDs
  adminMode: boolean;
};

type AppContextValue = {
  state: AppState;
  toggleFavorite: (item: CatalogRef) => void;
  isFavorite: (id: string) => boolean;
  recordPlay: (item: CatalogRef, progress?: number) => void;
  enqueueTrack: (id: string) => void;
  clearQueue: () => void;
  setAdminMode: (v: boolean) => void;
};

const DEFAULT_STATE: AppState = {
  favorites: [],
  continueWatching: [],
  recentlyPlayed: [],
  queue: [],
  adminMode: false,
};

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = 'playbeat-studio-state';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_STATE, ...JSON.parse(saved) };
    } catch { /* storage blocked */ }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* private mode */ }
  }, [state]);

  const value: AppContextValue = {
    state,
    toggleFavorite: (item) => setState(s => {
      const exists = s.favorites.find(f => f.id === item.id);
      return {
        ...s,
        favorites: exists
          ? s.favorites.filter(f => f.id !== item.id)
          : [...s.favorites, item],
      };
    }),
    isFavorite: (id) => state.favorites.some(f => f.id === id),
    recordPlay: (item, progress = 0) => setState(s => {
      const cw = s.continueWatching.filter(c => c.id !== item.id);
      const recently = [{ ...item }, ...s.recentlyPlayed.filter(r => r.id !== item.id)].slice(0, 12);
      return {
        ...s,
        continueWatching: [...cw, { id: item.id, kind: item.kind, title: item.title, progress }].slice(-12),
        recentlyPlayed: recently,
      };
    }),
    enqueueTrack: (id) => setState(s => ({
      ...s,
      queue: Array.from(new Set([...s.queue, id])),
    })),
    clearQueue: () => setState(s => ({ ...s, queue: [] })),
    setAdminMode: (v) => setState(s => ({ ...s, adminMode: v })),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Convenience lookup helpers
export function findMovie(id: string) { return MOVIES.find(m => m.id === id); }
export function findSeries(id: string) { return SERIES.find(s => s.id === id); }
export function findChannel(id: string) { return CHANNELS.find(c => c.id === id); }
export function findTrack(id: string) { return MUSIC.find(t => t.id === id); }
