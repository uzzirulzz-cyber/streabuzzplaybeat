import { Link, useLocation } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { LayoutDashboard, Tv, Film, Layers as SeriesIcon, Music, Shield, Search, Heart, Menu, X } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/live', label: 'Live TV', icon: Tv },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/series', label: 'Series', icon: SeriesIcon as typeof Film },
  { to: '/music', label: 'Music', icon: Music },
  { to: '/favorites', label: 'Favorites', icon: Heart },
  { to: '/admin', label: 'Admin', icon: Shield },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0a0c10]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-800/80 bg-[#0c0f15] md:flex">
        <div className="flex items-center gap-2 border-b border-slate-800/80 px-6 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </div>
          <div>
            <div className="font-['Outfit'] text-base font-bold leading-tight">PlayBeat</div>
            <div className="text-[10px] uppercase tracking-[.2em] text-blue-400">Studio</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <Link key={to} to={to} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? 'bg-blue-500/10 text-blue-300' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800/80 p-4 text-[11px] text-slate-500">
          v0.1 · Phase 1 catalog
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-800/80 bg-[#0a0c10]/95 px-4 py-3 backdrop-blur-xl md:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-slate-800">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <span className="font-['Outfit'] text-sm font-bold">PlayBeat Studio</span>
          </div>
        </header>

        {/* Search bar (always visible on top) */}
        <div className="sticky top-0 z-20 hidden items-center gap-3 border-b border-slate-800/80 bg-[#0a0c10]/80 px-6 py-3 backdrop-blur-xl md:flex">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <form action="/search" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const q = String(fd.get('q') || ''); if (q) window.location.hash = `#/search/${encodeURIComponent(q)}`; else window.location.hash = '#/search'; }}>
              <input
                name="q"
                type="search"
                placeholder="Search titles, channels, artists…"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 py-2 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </form>
          </div>
          <div className="ml-auto text-xs text-slate-500">Online entertainment · Movies · Music · Live</div>
        </div>

        <main className="flex-1 pb-24">{children}</main>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-64 bg-[#0c0f15] p-4" onClick={e => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <span className="font-['Outfit'] font-bold">Menu</span>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-slate-800">
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
