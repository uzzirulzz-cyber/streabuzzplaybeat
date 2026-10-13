import { Link } from 'react-router-dom';
import { Heart, Star, Play } from 'lucide-react';
import { useApp } from '../hooks/store';
import type { Movie, Series, Channel, Track } from '../data/catalog';

type CommonProps = { id: string; title: string; subtitle: string; to: string; favoriteKey?: string };

function CardShell({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="group relative block overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 transition-all hover:border-slate-700 hover:shadow-2xl hover:shadow-black/40">
      {children}
    </Link>
  );
}

function FavoriteButton({ id }: { id: string }) {
  const { isFavorite, toggleFavorite } = useApp();
  const active = isFavorite(id);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite({ id, kind: 'movie', title: '' }); }}
      className="absolute right-2 top-2 z-10 rounded-full bg-black/40 p-1.5 backdrop-blur transition hover:bg-black/60"
      aria-label={active ? 'Remove favorite' : 'Add favorite'}
    >
      <Heart className={`h-3.5 w-3.5 ${active ? 'fill-rose-500 text-rose-500' : 'text-slate-200'}`} />
    </button>
  );
}

function PlayBadge() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
      <div className="rounded-full bg-blue-600/90 p-3 shadow-xl">
        <Play className="h-5 w-5 fill-white text-white" />
      </div>
    </div>
  );
}

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <CardShell to={`/movies/${movie.id}`}>
      <FavoriteButton id={movie.id} />
      <div className={`aspect-[2/3] w-full bg-gradient-to-br ${movie.poster}`} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3">
        <div className="truncate text-sm font-semibold text-white">{movie.title}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-300">
          <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{movie.rating.toFixed(1)}</span>
          <span>·</span>
          <span>{movie.year}</span>
          <span>·</span>
          <span>{movie.duration}m</span>
        </div>
      </div>
      <PlayBadge />
    </CardShell>
  );
}

export function SeriesCard({ series }: { series: Series }) {
  return (
    <CardShell to={`/series/${series.id}`}>
      <FavoriteButton id={series.id} />
      <div className={`aspect-[2/3] w-full bg-gradient-to-br ${series.poster}`} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3">
        <div className="truncate text-sm font-semibold text-white">{series.title}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-300">
          <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{series.rating.toFixed(1)}</span>
          <span>·</span>
          <span>{series.seasons} season{series.seasons !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{series.episodes.length} eps</span>
        </div>
      </div>
      <PlayBadge />
    </CardShell>
  );
}

export function ChannelCard({ channel }: { channel: Channel }) {
  const { recordPlay } = useApp();
  return (
    <Link
      to={`/live/${channel.id}`}
      onClick={() => recordPlay({ id: channel.id, kind: 'channel', title: channel.name })}
      className="group flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 transition hover:border-slate-700 hover:bg-slate-900"
    >
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold">
        {channel.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{channel.name}</div>
        <div className="truncate text-xs text-slate-400">{channel.category} · {channel.country} · {channel.language}</div>
      </div>
      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400">Live</span>
    </Link>
  );
}

export function MusicCard({ track, onPlay }: { track: Track; onPlay: (id: string) => void }) {
  const { enqueueTrack } = useApp();
  return (
    <div className="group rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 transition hover:border-slate-700 hover:bg-slate-900">
      <div className={`mb-3 aspect-square w-full rounded-lg bg-gradient-to-br ${track.cover} relative overflow-hidden`}>
        <button
          onClick={() => { enqueueTrack(track.id); onPlay(track.id); }}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100"
          aria-label={`Play ${track.title}`}
        >
          <div className="rounded-full bg-white p-3 shadow-xl">
            <Play className="h-5 w-5 fill-slate-900 text-slate-900" />
          </div>
        </button>
      </div>
      <div className="truncate text-sm font-semibold">{track.title}</div>
      <div className="truncate text-xs text-slate-400">{track.artist}</div>
      <div className="truncate text-[11px] text-slate-500">{track.album}</div>
    </div>
  );
}

export function ContentRow<T>({ title, items, render }: { title: string; items: T[]; render: (item: T, i: number) => React.ReactNode }) {
  if (!items.length) return null;
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-['Outfit'] text-lg font-bold text-slate-100">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((it, i) => <div key={i}>{render(it, i)}</div>)}
      </div>
    </section>
  );
}
