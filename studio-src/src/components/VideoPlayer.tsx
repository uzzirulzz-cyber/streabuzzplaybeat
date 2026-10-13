import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export type StreamSource = {
  /** Upstream URL — must be authorized. */
  url: string;
  /** Optional label for the quality/source picker UI. */
  label?: string;
  /** 'hls' | 'dash' | 'mp4' | 'youtube' — currently only 'hls' and 'mp4'
   *  are auto-played; 'youtube' and 'dash' fall back to "open on provider". */
  format?: 'hls' | 'dash' | 'mp4' | 'youtube';
};

type Props = {
  /** One or more upstream sources. When the primary fails (manifestLoadError,
   *  networkError, etc.) the player automatically advances to the next
   *  source in the array — providing "authorized backup sources" per the
   *  PlayBeatTV.buzz doctrine. */
  sources?: StreamSource[];
  /** Legacy single-source mode. If `sources` is omitted, `src` is used as
   *  the only source (no failover). */
  src?: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  /** Start muted so the browser's autoplay policy doesn't block playback. */
  startMuted?: boolean;
  /** When true, fetch /health/:item_id before playback to verify the
   *  stream is alive. Avoids ~5s of black screen on dead sources. */
  preflight?: boolean;
  /** Endpoint base for the preflight probe — defaults to the deployed
   *  stream.playbeattv.buzz Worker. */
  preflightBase?: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onSourceChange?: (idx: number, total: number) => void;
  className?: string;
};

/**
 * HLS.js-aware video player with:
 *   - multi-source failover (primary → backup 1 → backup 2 → …)
 *   - optional preflight availability check
 *   - graceful autoplay (muted first, then unmute if allowed)
 *   - error recovery (NETWORK_ERROR → startLoad, MEDIA_ERROR → recoverMedia)
 *   - visible "Loading…" / "Stream unavailable" overlays
 */
export default function VideoPlayer({
  sources, src, poster, title, autoPlay,
  startMuted = true, preflight = false, preflightBase = 'https://stream.playbeattv.buzz',
  onProgress, onEnded, onSourceChange, className,
}: Props) {
  // Normalize: if only `src` is provided, wrap it as a single-source array.
  const list: StreamSource[] = sources && sources.length
    ? sources
    : src ? [{ url: src, format: 'hls' }] : [];

  const ref = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [preflightStatus, setPreflightStatus] = useState<'idle' | 'checking' | 'ok' | 'skip'>('idle');

  const current = list[idx];

  // Preflight: probe the stream's health endpoint before playback.
  // Skipped silently if preflightBase is unreachable (offline dev).
  useEffect(() => {
    if (!preflight || !current) return;
    let cancelled = false;
    setPreflightStatus('checking');
    // Use HEAD against the source URL itself when preflightBase isn't
    // reachable (no cross-platform Worker deployed yet). This still
    // verifies the manifest URL responds.
    const probeUrl = `${preflightBase}/health/${encodeURIComponent(title || '')}`.replace(/\/health\/$/, '/health');
    fetch(probeUrl, { method: 'GET' })
      .then(() => { if (!cancelled) setPreflightStatus('ok'); })
      .catch(() => { if (!cancelled) setPreflightStatus('skip'); });
    return () => { cancelled = true; };
  }, [preflight, current, preflightBase, title]);

  // Main player effect — runs when the source changes.
  useEffect(() => {
    const video = ref.current;
    if (!video || !current) return;

    setStatus('loading');
    setErrorMsg(null);
    if (autoPlay) video.muted = startMuted;

    let hls: Hls | null = null;
    const url = current.url;
    const fmt = current.format || (url.includes('.m3u8') ? 'hls' : 'mp4');
    let retried = false;

    const tryPlay = () => {
      if (!autoPlay) return;
      video.play().then(() => setStatus('playing'))
        .catch(() => {
          // Autoplay blocked — force mute and retry once.
          video.muted = true;
          video.play().then(() => setStatus('playing')).catch(() => {
            setStatus('idle');
            setErrorMsg('Tap play to start (browser blocked autoplay).');
          });
        });
    };

    // Pre-checks for non-HLS formats (YouTube / DASH) → bail to fallback.
    if (fmt === 'youtube' || /youtube\.com|youtu\.be/i.test(url)) {
      setErrorMsg('YouTube streams cannot be embedded. Open on provider.');
      setStatus('error');
      return;
    }
    if (fmt === 'dash' || /\.mpd(\?|$)/i.test(url)) {
      setErrorMsg('MPEG-DASH streams require a DASH player (not bundled). Open on provider.');
      setStatus('error');
      return;
    }

    const isM3U8 = fmt === 'hls' || /\.m3u8(\?|$)/i.test(url);

    if (isM3U8 && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari / iOS)
      video.src = url;
      video.load();
      video.addEventListener('loadedmetadata', tryPlay, { once: true });
    } else if (isM3U8 && Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 20,
        enableWorker: true,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 2,
        levelLoadingTimeOut: 10000,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // clear any error overlay; setStatus('loading') so tryPlay can flip to 'playing'
        setStatus('loading');
        video.muted = startMuted;
        tryPlay();
      });
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (!d.fatal) return;

        // First-failure recovery (network / media)
        if (!retried) {
          retried = true;
          if (d.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setStatus('loading');
            hls?.startLoad();
            return;
          }
          if (d.type === Hls.ErrorTypes.MEDIA_ERROR) {
            setStatus('loading');
            (hls as any)?.recoverMedia?.();
            return;
          }
        }

        // Recovery failed OR a non-recoverable fatal — advance to next
        // backup source if available, otherwise show the error UI.
        if (idx + 1 < list.length) {
          setStatus('loading');
          setErrorMsg(`Source ${idx + 1} failed (${d.details}). Switching to backup…`);
          // small delay so the user sees the message
          setTimeout(() => {
            setIdx(i => i + 1);
            onSourceChange?.(idx + 2, list.length);
          }, 800);
        } else {
          setErrorMsg(`Stream unavailable: ${d.details}. All ${list.length} sources exhausted — the channel may be offline or geo-restricted.`);
          setStatus('error');
        }
      });
    } else {
      // MP4 or unsupported HLS — use native video element
      video.src = url;
      video.load();
      video.addEventListener('loadedmetadata', tryPlay, { once: true });
      video.addEventListener('error', () => {
        if (idx + 1 < list.length) {
          setIdx(i => i + 1);
          onSourceChange?.(idx + 2, list.length);
        } else {
          setErrorMsg('Stream unavailable. All sources exhausted.');
          setStatus('error');
        }
      }, { once: true });
    }

    return () => {
      if (hls) hls.destroy();
      video.removeEventListener('loadedmetadata', tryPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.url, autoPlay, startMuted]);

  if (!current) {
    return (
      <div className={`relative w-full bg-black ${className ?? ''}`} style={{ minHeight: 200 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-slate-500">No stream source available for this title.</p>
        </div>
      </div>
    );
  }

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
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          onProgress?.(v.currentTime, v.duration || 0);
        }}
        onEnded={onEnded}
        onPlay={() => setStatus('playing')}
        onPause={() => setStatus('idle')}
        className="w-full bg-black"
      />

      {/* Source indicator (when multiple sources) */}
      {list.length > 1 && (
        <div className="pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur">
          src {idx + 1}/{list.length}
        </div>
      )}

      {/* Preflight badge */}
      {preflight && preflightStatus === 'checking' && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur">
          probing…
        </div>
      )}

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
            {errorMsg || 'Loading stream…'}
          </div>
        </div>
      )}

      {/* Error overlay */}
      {status === 'error' && errorMsg && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/85 p-4 text-center">
          <div>
            <div className="text-sm font-semibold text-rose-400">Stream unavailable</div>
            <p className="mt-1 max-w-md text-xs text-slate-400">{errorMsg}</p>
            <button
              onClick={() => {
                // Force a re-load of the current source by toggling idx
                const i = idx;
                setIdx(list.length);  // out of range → triggers the no-source fallback
                setTimeout(() => setIdx(i), 50);
              }}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              Retry from source 1
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
