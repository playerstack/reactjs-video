/**
 * Web live-ad adapter for core's `LiveAdController`.
 *
 * Performs the concrete STREAM DOM I/O for a Twitch-style live ad break: muting/replaying the
 * live `<video>`, suppressing its native pause while the ad overlays it, and opening the CTA URL.
 * This is the ONLY place that touches the stream element. The ad `<video>` itself is owned + torn
 * down by the core `playerstack-live-ad` element (which wraps this adapter and adds its own
 * `releaseAd`), and the phase machine (idle→playing→exiting), skip timing and exit timer live in
 * the core `LiveAdController` — so this adapter only covers the sibling stream element + URL.
 *
 * @param {React.RefObject<HTMLVideoElement>} videoRef - Ref to the live stream video element.
 * @returns {import('@playerstack/core').LiveAdAdapter}
 */
export function createWebLiveAdAdapter(videoRef) {
  return {
    muteStream: () => {
      const el = videoRef?.current;
      const wasMuted = el ? el.muted : false;
      if (el) el.muted = true;
      return wasMuted;
    },
    restoreStream: (wasMuted) => {
      const el = videoRef?.current;
      if (!el) return;
      if (!wasMuted) el.muted = false;
      // Force play — the browser may have paused the occluded/muted stream; return to live edge.
      const promise = el.play();
      if (promise && promise.catch) promise.catch(() => {});
    },
    suppressStreamPause: () => {
      const el = videoRef?.current;
      if (!el) return () => {};
      // The occluded/muted stream can be paused by the browser (power saving) or an HLS stall.
      // Intercept 'pause' in the CAPTURE phase (before PlayerCore's bubble listener), stop it, and
      // re-play so the stream keeps running at the live edge.
      const suppressPause = (e) => {
        e.stopImmediatePropagation();
        const p = el.play();
        if (p && p.catch) p.catch(() => {});
      };
      el.addEventListener('pause', suppressPause, true);
      return () => el.removeEventListener('pause', suppressPause, true);
    },
    // The ad `<video>` is owned by the core `playerstack-live-ad` element, which releases it
    // itself; nothing to do on the stream side here.
    releaseAd: () => {},
    openUrl: (url) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  };
}
