/**
 * Web VolumeAdapter implementation wrapping an HTMLMediaElement ref.
 * Used with the core useVolume hook from @playerstack/core/hooks.
 */
export function createWebVolumeAdapter(videoRef) {
  return {
    getVolume: () => videoRef.current?.volume ?? 0,
    setVolume: (v) => {
      if (videoRef.current) videoRef.current.volume = v;
    },
    getMuted: () => videoRef.current?.muted ?? false,
    setMuted: (muted) => {
      if (videoRef.current) videoRef.current.muted = muted;
    },
    onVolumeChange: (cb) => {
      const handler = (e) => {
        const el = e.target;
        cb(el.volume, el.muted);
      };
      const el = videoRef.current;
      if (el) el.addEventListener('volumechange', handler);
      return () => {
        if (el) el.removeEventListener('volumechange', handler);
      };
    },
  };
}
