import { useEffect, useRef, useState } from 'react';
import { MUSIC } from '../data/catalog';
import { useApp } from '../hooks/store';
import { Play, Pause, SkipForward, SkipBack, ListMusic } from 'lucide-react';

type Props = {
  currentTrackId: string | null;
  onSelectTrack: (id: string) => void;
};

/**
 * Persistent music player — sticks to the bottom of the screen.
 * Pulls from the global queue + on-the-fly track selection.
 */
export default function MusicPlayer({ currentTrackId, onSelectTrack }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { state, clearQueue } = useApp();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const current = currentTrackId ? MUSIC.find(t => t.id === currentTrackId) : null;

  // Pick the next track from the queue (or wrap)
  const queueAfterCurrent = (() => {
    if (!currentTrackId) return state.queue;
    const idx = state.queue.indexOf(currentTrackId);
    if (idx < 0) return state.queue;
    return [...state.queue.slice(idx + 1), ...state.queue.slice(0, idx)];
  })();
  const nextId = queueAfterCurrent[0] ?? null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.src = current.audioUrl;
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [current?.audioUrl]);

  if (!current) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-[#0a0c10]/95 backdrop-blur-xl">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          if (nextId) onSelectTrack(nextId);
          else setPlaying(false);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <div className={`h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br ${current.cover}`} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{current.title}</div>
          <div className="truncate text-xs text-slate-400">{current.artist} — {current.album}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!state.queue.length || !currentTrackId) return;
              const i = state.queue.indexOf(currentTrackId);
              const prev = state.queue[Math.max(0, i - 1)];
              if (prev) onSelectTrack(prev);
            }}
            className="rounded-full p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            aria-label="Previous"
          ><SkipBack className="h-4 w-4" /></button>
          <button
            onClick={() => { const a = audioRef.current!; if (playing) { a.pause(); } else { a.play(); } }}
            className="rounded-full bg-blue-600 p-2.5 text-white hover:bg-blue-500"
            aria-label={playing ? 'Pause' : 'Play'}
          >{playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button>
          <button
            onClick={() => nextId && onSelectTrack(nextId)}
            className="rounded-full p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            aria-label="Next"
          ><SkipForward className="h-4 w-4" /></button>
        </div>
        <div className="hidden w-64 md:block">
          <div className="text-right text-xs text-slate-500">{fmt(progress)} / {fmt(duration)}</div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
          </div>
        </div>
        {state.queue.length > 0 && (
          <div className="hidden items-center gap-1 text-xs text-slate-400 md:flex">
            <ListMusic className="h-4 w-4" /> {state.queue.length}
            <button onClick={clearQueue} className="ml-1 hover:text-white">Clear</button>
          </div>
        )}
      </div>
    </div>
  );
}

function fmt(s: number) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60); const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
}
