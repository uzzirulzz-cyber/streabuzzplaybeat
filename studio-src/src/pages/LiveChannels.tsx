import { useState } from 'react';
import { ChannelCard } from '../components/Cards';
import { CHANNELS } from '../data/catalog';
import { Search } from 'lucide-react';

const CATEGORIES = ['All', 'News', 'Sports', 'Entertainment', 'Music', 'Movies', 'Kids', 'Documentary'] as const;
const COUNTRIES = ['All', 'US', 'NL'];

export default function LiveChannels() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<typeof CATEGORIES[number]>('All');
  const [country, setCountry] = useState<typeof COUNTRIES[number]>('All');

  const items = CHANNELS.filter(c => {
    if (cat !== 'All' && c.category !== cat) return false;
    if (country !== 'All' && c.country !== country) return false;
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <header className="mb-6">
        <h1 className="font-['Outfit'] text-2xl font-extrabold">Live TV</h1>
        <p className="mt-1 text-sm text-slate-400">
          {items.length} live channel{items.length !== 1 ? 's' : ''} · authorized test streams only
        </p>
      </header>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter channels…"
            className="w-full rounded-lg border border-slate-800 bg-slate-900/50 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`rounded-full border px-3 py-1.5 text-xs ${cat === c ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {COUNTRIES.map(c => (
          <button key={c} onClick={() => setCountry(c)}
            className={`rounded-full border px-3 py-1 text-[11px] ${country === c ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {items.map(c => <ChannelCard key={c.id} channel={c} />)}
      </div>
      {items.length === 0 && <p className="text-sm text-slate-500">No channels match.</p>}
    </div>
  );
}
