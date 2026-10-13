import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SERIES } from '../data/catalog';
import { SeriesCard } from '../components/Cards';
import VideoPlayer from '../components/VideoPlayer';
import { useApp } from '../hooks/store';
import { ArrowLeft, Heart, Star, Play } from 'lucide-react';

export function SeriesList() {
  const [q, setQ] = useState('');
  const items = SERIES.filter(s => !q || s.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <header className="mb-6">
        <h1 className="font-['Outfit'] text-2xl font-extrabold">Series</h1>
        <p className="mt-1 text-sm text-slate-400">{items.length} series · open anthology</p>
      </header>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search series…"
        className="mb-6 w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map(s => <SeriesCard key={s.id} series={s} />)}
      </div>
    </div>
  );
}

export function SeriesDetail() {
  const { id } = useParams();
  const series = SERIES.find(s => s.id === id);
  const [playing, setPlaying] = useState<string | null>(null);
  const { isFavorite, toggleFavorite, recordPlay } = useApp();

  if (!series) return (
    <div className="px-4 py-12 text-center">
      <p className="text-slate-400">Series not found.</p>
      <Link to="/series" className="mt-4 inline-block text-blue-400 hover:underline">Back to Series</Link>
    </div>
  );

  const fav = isFavorite(series.id);
  const playingEpisode = playing ? series.episodes.find(e => e.id === playing) : series.episodes[0];

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <Link to="/series" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
        <div className={`aspect-[2/3] rounded-xl bg-gradient-to-br ${series.poster}`} />
        <div>
          <h1 className="font-['Outfit'] text-3xl font-extrabold">{series.title}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {series.rating.toFixed(1)}</span>
            <span>·</span><span>{series.year}</span>
            <span>·</span><span>{series.seasons} season{series.seasons !== 1 ? 's' : ''}</span>
            <span>·</span><span>{series.episodes.length} episodes</span>
            <span>·</span><span>{series.genre.join(', ')}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{series.description}</p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => { setPlaying(series.episodes[0].id); recordPlay({ id: series.id, kind: 'series', title: series.title }); }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Play className="h-4 w-4 fill-white" /> Play S1:E1
            </button>
            <button
              onClick={() => toggleFavorite({ id: series.id, kind: 'series', title: series.title })}
              className={`inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold ${fav ? 'border-rose-500/50 text-rose-400' : 'border-slate-700 text-slate-200 hover:border-slate-600'}`}
            >
              <Heart className={`h-4 w-4 ${fav ? 'fill-rose-500' : ''}`} /> {fav ? 'Favorited' : 'Favorite'}
            </button>
          </div>
        </div>
      </div>

      {playingEpisode && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-black">
          <VideoPlayer
            sources={[
              { url: playingEpisode.videoUrl, label: 'primary' },
              ...(playingEpisode.backupUrl ? [{ url: playingEpisode.backupUrl, label: 'backup' }] : []),
              ...(series.backupUrl ? [{ url: series.backupUrl, label: 'series backup' }] : []),
            ]}
            title={`${series.title} — E${playingEpisode.number}`}
            autoPlay
          />
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-4 font-['Outfit'] text-lg font-bold">Episodes</h2>
        <div className="space-y-2">
          {series.episodes.map(ep => (
            <button
              key={ep.id}
              onClick={() => setPlaying(ep.id)}
              className={`flex w-full items-center gap-4 rounded-xl border p-3 text-left transition ${playing === ep.id ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-800 text-sm font-bold text-slate-300">
                {ep.number}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{ep.title}</div>
                <div className="truncate text-xs text-slate-400">{ep.description}</div>
              </div>
              <div className="text-xs text-slate-500">{ep.duration}m</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-['Outfit'] text-lg font-bold">More like this</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {SERIES.filter(s => s.id !== series.id).slice(0, 5).map(s => <SeriesCard key={s.id} series={s} />)}
        </div>
      </section>
    </div>
  );
}
