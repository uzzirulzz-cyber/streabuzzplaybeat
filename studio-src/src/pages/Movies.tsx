import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOVIES } from '../data/catalog';
import { MovieCard } from '../components/Cards';
import VideoPlayer from '../components/VideoPlayer';
import { useApp } from '../hooks/store';
import { ArrowLeft, Heart, Play, Star } from 'lucide-react';

export function MoviesList() {
  const [q, setQ] = useState('');
  const items = MOVIES.filter(m => !q || m.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <header className="mb-6">
        <h1 className="font-['Outfit'] text-2xl font-extrabold">Movies</h1>
        <p className="mt-1 text-sm text-slate-400">{items.length} titles · open-movie catalogue</p>
      </header>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search movies…"
        className="mb-6 w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map(m => <MovieCard key={m.id} movie={m} />)}
      </div>
    </div>
  );
}

export function MovieDetail() {
  const { id } = useParams();
  const movie = MOVIES.find(m => m.id === id);
  const { isFavorite, toggleFavorite, recordPlay } = useApp();

  if (!movie) return (
    <div className="px-4 py-12 text-center">
      <p className="text-slate-400">Movie not found.</p>
      <Link to="/movies" className="mt-4 inline-block text-blue-400 hover:underline">Back to Movies</Link>
    </div>
  );

  const fav = isFavorite(movie.id);

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <Link to="/movies" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
        <div className={`aspect-[2/3] rounded-xl bg-gradient-to-br ${movie.poster}`} />
        <div>
          <h1 className="font-['Outfit'] text-3xl font-extrabold">{movie.title}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {movie.rating.toFixed(1)}</span>
            <span>·</span><span>{movie.year}</span>
            <span>·</span><span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
            <span>·</span><span>{movie.genre.join(', ')}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{movie.description}</p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => recordPlay({ id: movie.id, kind: 'movie', title: movie.title })}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Play className="h-4 w-4 fill-white" /> Play
            </button>
            <button
              onClick={() => toggleFavorite({ id: movie.id, kind: 'movie', title: movie.title })}
              className={`inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold ${fav ? 'border-rose-500/50 text-rose-400' : 'border-slate-700 text-slate-200 hover:border-slate-600'}`}
            >
              <Heart className={`h-4 w-4 ${fav ? 'fill-rose-500' : ''}`} /> {fav ? 'Favorited' : 'Favorite'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-black">
        <VideoPlayer src={movie.videoUrl} title={movie.title} onProgress={(t) => recordPlay({ id: movie.id, kind: 'movie', title: movie.title }, t)} />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-['Outfit'] text-lg font-bold">More like this</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {MOVIES.filter(m => m.id !== movie.id).slice(0, 5).map(m => <MovieCard key={m.id} movie={m} />)}
        </div>
      </section>
    </div>
  );
}
