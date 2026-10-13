import { useApp } from '../hooks/store';
import { MOVIES, SERIES, CHANNELS, MUSIC } from '../data/catalog';
import { MovieCard, SeriesCard, ChannelCard, MusicCard } from '../components/Cards';
import { Heart } from 'lucide-react';

type Props = { onPlayTrack: (id: string) => void };

export default function Favorites({ onPlayTrack }: Props) {
  const { state } = useApp();

  const movies = state.favorites.map(f => MOVIES.find(m => m.id === f.id)).filter(Boolean) as typeof MOVIES;
  const series = state.favorites.map(f => SERIES.find(s => s.id === f.id)).filter(Boolean) as typeof SERIES;
  const channels = state.favorites.map(f => CHANNELS.find(c => c.id === f.id)).filter(Boolean) as typeof CHANNELS;
  const tracks = state.favorites.map(f => MUSIC.find(t => t.id === f.id)).filter(Boolean) as typeof MUSIC;

  const total = movies.length + series.length + channels.length + tracks.length;

  if (total === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <Heart className="mx-auto mb-3 h-12 w-12 text-slate-600" />
        <h1 className="font-['Outfit'] text-2xl font-bold">No favorites yet</h1>
        <p className="mt-2 text-sm text-slate-400">Tap the heart on any title to build your list.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <header className="mb-6">
        <h1 className="font-['Outfit'] text-2xl font-extrabold">Favorites</h1>
        <p className="mt-1 text-sm text-slate-400">{total} item{total !== 1 ? 's' : ''} saved</p>
      </header>

      {movies.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-['Outfit'] text-lg font-bold">Movies</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {movies.map(m => <MovieCard key={m.id} movie={m} />)}
          </div>
        </section>
      )}

      {series.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-['Outfit'] text-lg font-bold">Series</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {series.map(s => <SeriesCard key={s.id} series={s} />)}
          </div>
        </section>
      )}

      {channels.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-['Outfit'] text-lg font-bold">Channels</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {channels.map(c => <ChannelCard key={c.id} channel={c} />)}
          </div>
        </section>
      )}

      {tracks.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-['Outfit'] text-lg font-bold">Tracks</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {tracks.map(t => <MusicCard key={t.id} track={t} onPlay={onPlayTrack} />)}
          </div>
        </section>
      )}
    </div>
  );
}
