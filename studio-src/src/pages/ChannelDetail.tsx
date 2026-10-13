import { useParams, Link } from 'react-router-dom';
import { CHANNELS } from '../data/catalog';
import VideoPlayer from '../components/VideoPlayer';
import { ChannelCard } from '../components/Cards';
import { useApp } from '../hooks/store';
import { ArrowLeft, Radio, Heart } from 'lucide-react';

export default function ChannelDetail() {
  const { id } = useParams();
  const channel = CHANNELS.find(c => c.id === id);
  const { isFavorite, toggleFavorite, recordPlay } = useApp();

  if (!channel) return (
    <div className="px-4 py-12 text-center">
      <p className="text-slate-400">Channel not found.</p>
      <Link to="/live" className="mt-4 inline-block text-blue-400 hover:underline">Back to Live TV</Link>
    </div>
  );

  const fav = isFavorite(channel.id);
  const related = CHANNELS.filter(c => c.id !== channel.id && (c.category === channel.category || c.country === channel.country)).slice(0, 6);

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <Link to="/live" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <header className="mb-6 flex items-start gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white">
          {channel.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-red-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 font-semibold uppercase">
              <Radio className="h-3 w-3 animate-pulse" /> Live
            </span>
          </div>
          <h1 className="mt-1 font-['Outfit'] text-2xl font-extrabold">{channel.name}</h1>
          <div className="mt-1 text-sm text-slate-400">
            {channel.category} · {channel.country} · {channel.language}
          </div>
        </div>
        <button
          onClick={() => toggleFavorite({ id: channel.id, kind: 'channel', title: channel.name })}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${fav ? 'border-rose-500/50 text-rose-400' : 'border-slate-700 text-slate-200 hover:border-slate-600'}`}
        >
          <Heart className={`h-4 w-4 ${fav ? 'fill-rose-500' : ''}`} /> {fav ? 'Saved' : 'Save'}
        </button>
      </header>

      <p className="mb-6 text-sm text-slate-300">{channel.description}</p>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black">
        <VideoPlayer
          src={channel.streamUrl}
          title={channel.name}
          autoPlay
          onProgress={(t) => recordPlay({ id: channel.id, kind: 'channel', title: channel.name }, t)}
        />
      </div>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-['Outfit'] text-lg font-bold">Related channels</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {related.map(c => <ChannelCard key={c.id} channel={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}
