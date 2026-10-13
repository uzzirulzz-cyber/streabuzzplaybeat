import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

type Props = {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  className?: string;
};

/**
 * HLS.js-aware video player.
 * - Safari/iOS: native HLS support, no hls.js needed.
 * - Other browsers: hls.js attaches to <video>.
 * - Falls back gracefully if the manifest fails.
 */
export default function VideoPlayer({ src, poster, title, autoPlay, onProgress, onEnded, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;

    let hls: Hls | null = null;
    const isM3U8 = /\.m3u8(\?|$)/i.test(src) || src.includes('.m3u8');

    if (isM3U8 && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari / iOS)
      video.src = src;
    } else if (isM3U8 && Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 20, enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) console.warn('HLS fatal:', d.details);
      });
    } else {
      // MP4 or unsupported
      video.src = src;
    }

    if (autoPlay) {
      video.play().catch(() => {/* autoplay blocked; user must press play */});
    }

    return () => { if (hls) hls.destroy(); };
  }, [src, autoPlay]);

  return (
    <video
      ref={ref}
      poster={poster}
      title={title}
      controls
      playsInline
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        onProgress?.(v.currentTime, v.duration || 0);
      }}
      onEnded={onEnded}
      className={`w-full bg-black ${className ?? ''}`}
    />
  );
}
