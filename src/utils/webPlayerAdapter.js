/**
 * Web PlayerAdapter wrapping an HTMLMediaElement for use with usePlayerOrchestration.
 *
 * This is the adapter equivalent of the class-based PlayerProxy for new components
 * that want to adopt the hook-based pattern from @playerstack/web-core/hooks.
 * The existing PlayerProxy class component remains functional for current consumers.
 *
 * @param {React.RefObject<HTMLMediaElement>} videoRef - ref to the underlying <video> element
 * @returns {import('@playerstack/web-core/adapters').PlayerAdapter}
 */
export function createWebPlayerAdapter(videoRef) {
  return {
    play: () => {
      if (videoRef.current) videoRef.current.play().catch(() => {});
    },
    pause: () => {
      if (videoRef.current) videoRef.current.pause();
    },
    stop: () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    },
    load: (url, isReady) => {
      if (videoRef.current) videoRef.current.src = url;
    },
    seekTo: (seconds, keepPlaying) => {
      if (videoRef.current) videoRef.current.currentTime = seconds;
    },
    setVolume: (v) => {
      if (videoRef.current) videoRef.current.volume = v;
    },
    mute: () => {
      if (videoRef.current) videoRef.current.muted = true;
    },
    unmute: () => {
      if (videoRef.current) videoRef.current.muted = false;
    },
    setPlaybackRate: (rate) => {
      if (videoRef.current) videoRef.current.playbackRate = rate;
    },
    getDuration: () => videoRef.current?.duration || null,
    getCurrentTime: () => videoRef.current?.currentTime ?? null,
    getSecondsLoaded: () => {
      const el = videoRef.current;
      if (!el || !el.buffered || el.buffered.length === 0) return null;
      return el.buffered.end(el.buffered.length - 1);
    },
  };
}
