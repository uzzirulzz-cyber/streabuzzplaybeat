import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sparkles, Play, ChevronRight, Film, Tv, Layers as SeriesIcon, Music as MusicIcon } from 'lucide-react';
import { MOVIES, SERIES, CHANNELS, MUSIC, getFeatured } from '../data/catalog';
import { MovieCard, SeriesCard, ChannelCard, MusicCard, ContentRow } from '../components/Cards';
import { getAIRecommendations, pingGemini, type AIRecommendation } from '../lib/gemini';
import { useApp } from '../hooks/store';
import type { Movie, Series, Channel, Track } from '../data/catalog';

type MusicStateProps = { onPlayTrack: (id: string) => void };

export default function Dashboard({ onPlayTrack }: MusicStateProps) {
  const { state, recordPlay } = useApp();
  const featured = getFeatured();
  const hero = featured.movies[0] || MOVIES[0];

  const [aiPicks, setAiPicks] = useState<AIRecommendation[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    pingGemini().then(setAiEnabled);
  }, []);

  async function runAI(prompt?: string) {
    const p = prompt ?? aiPrompt;
    if (!p.trim()) return;
    setAiStatus('loading');
    const picks = await getAIRecommendations(p);
    setAiPicks(picks);
    setAiStatus('ok');
  }

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      {/* Hero */}
      <section className="relative mb-10 overflow-hidden rounded-2xl">
        <div className={`absolute inset-0 bg-gradient-to-br ${hero.poster} opacity-90`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/70 to-transparent" />
        <div className="relative px-6 py-10 md:px-12 md:py-16">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300 backdrop-blur">
            <Sparkles className="h-3 w-3" /> Featured today
          </div>
          <h1 className="font-['Outfit'] text-3xl font-extrabold leading-tight text-white md:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-300 md:text-base">{hero.description}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <span>{hero.year}</span>
            <span>·</span>
            <span>{Math.floor(hero.duration / 60)}h {hero.duration % 60}m</span>
            <span>·</span>
            <span className="rounded border border-amber-500/50 px-1.5 py-0.5 text-amber-400">{hero.rating.toFixed(1)}</span>
            <span>·</span>
            <span>{hero.genre.join(' · ')}</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/movies/${hero.id}`}
              onClick={() => recordPlay({ id: hero.id, kind: 'movie', title: hero.title })}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500"
            >
              <Play className="h-4 w-4 fill-white" /> Watch now
            </Link>
            <Link to="/movies" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/50">
              Browse all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Continue watching */}
      {state.continueWatching.length > 0 && (
        <ContentRow
          title="Continue Watching"
          items={state.continueWatching.slice(-6).reverse()}
          render={(item) => {
            const m = MOVIES.find(x => x.id === item.id);
            if (m) return <MovieCard key={item.id} movie={m} />;
            const s = SERIES.find(x => x.id === item.id);
            if (s) return <SeriesCard key={item.id} series={s} />;
            return null;
          }}
        />
      )}

      {/* AI recommendations */}
      <section className="mb-10">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-400" />
          <h2 className="font-['Outfit'] text-lg font-bold">AI Picks</h2>
          <span className={`ml-2 text-xs ${aiEnabled === null ? 'text-slate-500' : aiEnabled ? 'text-emerald-400' : 'text-amber-400'}`}>
            {aiEnabled === null ? 'checking…' : aiEnabled ? 'Gemini online' : 'fallback mode'}
          </span>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {['chill evening', 'study focus', 'workout energy', 'family night'].map(p => (
            <button key={p} onClick={() => { setAiPrompt(p); runAI(p); }}
              className="rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300 hover:border-blue-500 hover:text-blue-300">
              {p}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); runAI(); }} className="mb-4 flex gap-2">
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe your mood or pick a chip above…"
            className="flex-1 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" disabled={aiStatus === 'loading'}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
            {aiStatus === 'loading' ? 'Thinking…' : 'Get picks'}
          </button>
        </form>
        {aiPicks.length > 0 && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {aiPicks.map(p => (
              <AIPickCard key={`${p.kind}-${p.id}`} pick={p} />
            ))}
          </div>
        )}
      </section>

      <ContentRow title="Featured Movies" items={featured.movies}
        render={(m: Movie) => <MovieCard movie={m} />} />
      <ContentRow title="Featured Series" items={featured.series}
        render={(s: Series) => <SeriesCard series={s} />} />
      <ContentRow title="Featured Live Channels" items={featured.channels}
        render={(c: Channel) => <ChannelCard channel={c} />} />
      <ContentRow title="Featured Music" items={MUSIC.slice(0, 6)}
        render={(t: Track) => <MusicCard track={t} onPlay={onPlayTrack} />} />

      {/* Quick links */}
      <section className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { to: '/movies', label: 'Movies', icon: Film },
          { to: '/live', label: 'Live TV', icon: Tv },
          { to: '/series', label: 'Series', icon: SeriesIcon },
          { to: '/music', label: 'Music', icon: MusicIcon },
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="group flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 hover:border-slate-700 hover:bg-slate-900">
            <Icon className="h-6 w-6 text-blue-400" />
            <div>
              <div className="text-sm font-semibold">{label}</div>
              <div className="text-xs text-slate-500">Explore →</div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

function AIPickCard({ pick }: { pick: AIRecommendation }) {
  const to = pick.kind === 'movie' ? `/movies/${pick.id}` :
             pick.kind === 'series' ? `/series/${pick.id}` :
             pick.kind === 'channel' ? `/live/${pick.id}` :
             `/music`;
  return (
    <Link to={to} className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 hover:border-blue-500 hover:bg-slate-900">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-400">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{pick.title}</div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500">{pick.kind}</div>
        <p className="mt-1 text-xs text-slate-400">{pick.reason}</p>
      </div>
    </Link>
  );
}
