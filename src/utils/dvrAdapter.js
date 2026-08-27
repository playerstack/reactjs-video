/**
 * Web DVR adapter for HTMLMediaElement.
 * Provides seekable range, current time, seeking, and time update subscription
 * via the video element's native APIs.
 *
 * @param {React.RefObject<HTMLMediaElement>} videoRef
 * @returns {import('@playerstack/web-core/adapters').DVRAdapter}
 */
export function createWebDVRAdapter(videoRef) {
  return {
    getSeekableRange: () => {
      const el = videoRef.current;
      if (!el || !el.seekable || el.seekable.length === 0) return null;
      // On first load the `seekable` window can appear (e.g. 0..601) a few hundred ms BEFORE the
      // element reports a real playback position: `readyState < HAVE_CURRENT_DATA (2)` with
      // `currentTime` still at the placeholder `0`. Computing DVR state then yields a bogus
      // "10 minutes behind" offset that flashes the timer for a moment before the position syncs
      // to the live edge. Treat pre-ready as "no usable DVR yet" so no offset is computed until
      // the element has a real current position (kills the transient `-10:01` glitch at the root).
      if (el.readyState < 2) return null;
      return {
        start: el.seekable.start(0),
        end: el.seekable.end(el.seekable.length - 1),
      };
    },
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    seekTo: (time) => {
      const el = videoRef.current;
      if (!el) return;
      // Scrubbing the DVR timeline after the stream reached its end must resume
      // playback: the element stays paused once `ended` fires, and setting
      // currentTime alone won't restart it. Seeking back into the window means
      // "keep watching from here", so replay when we were at the end.
      const wasEnded = el.ended;
      el.currentTime = time;
      if (wasEnded) {
        const promise = el.play();
        // Ignore transient AbortError/NotAllowedError — same policy as MediaEngine.
        if (promise && promise.catch) promise.catch(() => {});
      }
    },
    onTimeUpdate: (callback) => {
      let el = videoRef.current;
      let cleanedUp = false;

      const attach = () => {
        el = videoRef.current;
        if (el && !cleanedUp) {
          el.addEventListener('timeupdate', callback);
          el.addEventListener('progress', callback);
        }
      };

      if (el) {
        attach();
      } else {
        // Element not yet available (ref populated asynchronously by React effect).
        // Defer attachment to next microtask — by then React will have committed.
        Promise.resolve().then(() => {
          if (!cleanedUp) attach();
        });
      }

      return () => {
        cleanedUp = true;
        if (el) {
          el.removeEventListener('timeupdate', callback);
          el.removeEventListener('progress', callback);
        }
      };
    },
  };
}
