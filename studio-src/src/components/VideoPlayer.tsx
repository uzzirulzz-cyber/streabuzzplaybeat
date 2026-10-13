import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

type Props = {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  /** Start muted so the browser's autoplay policy doesn't block playback.
   *  User can unmute via the native controls. Defaults to true when autoPlay is on. */
  startMuted?: boolean;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  className?: string;
};

/**
 * HLS.js-aware video player.
 * - Safari/iOS: native HLS support, no hls.js needed.
 * - Other browsers: hls.js attaches to <video>.
 * - Falls back gracefully if the manifest fails.
 * - When autoPlay is requested, the video starts muted by default (Chrome /
 *   Safari block unmuted autoplay without a user gesture). The viewer can
 *   unmute via the native controls.
 */
export default function VideoPlayer({ src, poster, title, autoPlay, startMuted = true, onProgress, onEnded, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;

    setStatus('loading');
    setErrorMsg(null);

    // Required for autoplay to actually fire on most browsers
    if (autoPlay) video.muted = startMuted;

    let hls: Hls | null = null;
    const isM3U8 = /\.m3u8(\?|$)/i.test(src) || src.includes('.m3u8');

    const tryPlay = () => {
      if (!autoPlay) return;
      video.play().then(() => setStatus('playing')).catch((err) => {
        // Autoplay was blocked — try once more with mute forced on
        video.muted = true;
        video.play().then(() => setStatus('playing')).catch(() => {
          setStatus('idle');
          setErrorMsg('Tap play to start (browser blocked autoplay).');
        });
      });
    };

    if (isM3U8 && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari / iOS)
      video.src = src;
      video.load();
      video.addEventListener('loadedmetadata', tryPlay, { once: true });
    } else if (isM3U8 && Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 20,
        enableWorker: true,
        // be tolerant of test-stream hiccups
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 2,
        levelLoadingTimeOut: 10000,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, tryPlay);
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) {
          const reason = d.details || 'unknown error';
          setErrorMsg(`Stream error: ${reason}. The channel may be offline or geo-restricted.`);
          setStatus('error');
          // try to recover
          switch (d.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad(); break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              // hls.js's recoverMedia() is exposed on the instance; cast to any
              // because the type defs are sometimes missing this method.
              (hls as any)?.recoverMedia?.(); break;
            default:
              hls?.destroy(); break;
          }
        }
      });
    } else {
      // MP4 or unsupported
      video.src = src;
      video.load();
      video.addEventListener('loadedmetadata', tryPlay, { once: true });
    }

    return () => {
      if (hls) hls.destroy();
      video.removeEventListener('loadedmetadata', tryPlay);
    };
  }, [src, autoPlay, startMuted]);

  return (
    <div className={`relative w-full bg-black ${className ?? ''}`}>
      <video
        ref={ref}
        poster={poster}
        title={title}
        controls
        playsInline
        autoPlay={autoPlay}
        muted={autoPlay ? startMuted : undefined}
        // Tell the browser this is a live stream — affects buffering & seeking UI
        // (note: HLS.js handles actual segmenting; this is a UX hint only)
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          onProgress?.(v.currentTime, v.duration || 0);
        }}
        onEnded={onEnded}
        onPlay={() => setStatus('playing')}
        onPause={() => setStatus('idle')}
        className="w-full bg-black"
      />
      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
            Loading stream…
          </div>
        </div>
      )}
      {status === 'error' && errorMsg && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center">
          <div>
            <div className="text-sm font-semibold text-rose-400">Stream unavailable</div>
            <p className="mt-1 max-w-md text-xs text-slate-400">{errorMsg}</p>
            <button
              onClick={() => { const v = ref.current; if (v) { v.muted = true; v.play().catch(() => {}); } }}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
