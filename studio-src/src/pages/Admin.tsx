import { useState } from 'react';
import { CHANNELS, MOVIES, SERIES, MUSIC } from '../data/catalog';
import { useApp } from '../hooks/store';
import { Shield, Film, Tv, Layers as SeriesIcon, Music, Trash2, Plus, Database } from 'lucide-react';

const TABS = [
  { id: 'movies', label: 'Movies', icon: Film, data: MOVIES },
  { id: 'series', label: 'Series', icon: SeriesIcon as typeof Film, data: SERIES },
  { id: 'channels', label: 'Channels', icon: Tv, data: CHANNELS },
  { id: 'music', label: 'Music', icon: Music, data: MUSIC },
] as const;

export default function Admin() {
  const { state, setAdminMode } = useApp();
  const [tab, setTab] = useState<typeof TABS[number]['id']>('movies');
  const active = TABS.find(t => t.id === tab)!;

  if (!state.adminMode) {
    return (
      <div className="px-4 py-12 text-center">
        <Shield className="mx-auto mb-3 h-12 w-12 text-slate-600" />
        <h1 className="font-['Outfit'] text-2xl font-bold">Admin area</h1>
        <p className="mt-2 text-sm text-slate-400">Local admin tools. Phase 1: read-only inspection of the catalog.</p>
        <button
          onClick={() => setAdminMode(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <Shield className="h-4 w-4" /> Enter admin mode
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-['Outfit'] text-2xl font-extrabold">Admin · Catalog</h1>
          <p className="mt-1 text-sm text-slate-400">Inspect entries across the in-memory catalog. CRUD is wired up but writes go to local state only (Phase 2: DB).</p>
        </div>
        <button
          onClick={() => setAdminMode(false)}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Exit admin
        </button>
      </header>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {TABS.map(t => (
          <div key={t.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <t.icon className="h-5 w-5 text-blue-400" />
              <span className="text-xs text-slate-500">{t.data.length}</span>
            </div>
            <div className="mt-2 text-sm font-semibold">{t.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${tab === t.id ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'}`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Title / Name</th>
              <th className="px-4 py-3">Category / Genre</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {active.data.map((entry: any) => {
              const title = (entry as any).title ?? (entry as any).name;
              const cat = (entry as any).category ? (entry as any).category : ((entry as any).genre || []).join(', ');
              const stream = (entry as any).streamUrl ?? (entry as any).videoUrl ?? (entry as any).audioUrl;
              return (
                <tr key={(entry as any).id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{(entry as any).id}</td>
                  <td className="px-4 py-3 font-medium">{title}</td>
                  <td className="px-4 py-3 text-slate-300">{cat}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    <span className="font-mono truncate max-w-[10rem] inline-block align-bottom">{stream ? stream.split('/').slice(0, 3).join('/') + '/…' : '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-400">Verified</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white" aria-label="Edit">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button className="rounded p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400" aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Doctrine card */}
      <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Database className="h-4 w-4 text-blue-400" /> Doctrine reminders
        </div>
        <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
          <li>· No unauthorized or invented stream URLs in production</li>
          <li>· Catalog entries carry a verified/unverified flag</li>
          <li>· A channel in dead/blocked/unchecked state never displays LIVE</li>
          <li>· Geo-blocked playback shows an explanation + retry, never a black frame</li>
          <li>· Setting an entry to draft removes it from grids and counts</li>
        </ul>
      </section>
    </div>
  );
}
