import { MUSIC } from '../data/catalog';
import { MusicCard } from '../components/Cards';
import { Play } from 'lucide-react';

type Props = { onPlayTrack: (id: string) => void };

export default function MusicPage({ onPlayTrack }: Props) {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-['Outfit'] text-2xl font-extrabold">Music</h1>
          <p className="mt-1 text-sm text-slate-400">{MUSIC.length} tracks · ambient, focus, drive</p>
        </div>
        <button
          onClick={() => onPlayTrack(MUSIC[0].id)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <Play className="h-4 w-4 fill-white" /> Play all
        </button>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {MUSIC.map(t => <MusicCard key={t.id} track={t} onPlay={onPlayTrack} />)}
      </div>
    </div>
  );
}
