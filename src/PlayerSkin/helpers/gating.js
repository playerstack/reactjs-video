/**
 * Centralized gating predicates for the reactjs skin (F1/F2).
 *
 * Each function is a pure, deterministic predicate extracted verbatim from the monolith
 * `CorePlayerSkin.jsx`. No React, no DOM, no refs. Every boolean coercion and operator is
 * preserved exactly as it appeared inline in the monolith so behavior parity holds.
 */

/**
 * Whether an ad is configured/present (drives ALL ad-mode UI gating; see the note below).
 *
 * `adPresent` vs `isAdActive` distinction (preserved verbatim from the monolith):
 * The `useAds` hook's `isAdActive` return (true only AFTER the first play) is intentionally
 * NOT used to gate the skin's ad UI: the ad overlay (banner/skip), the yellow timeline, the
 * suppressed chapters/heatmap, the disabled seek/cast and the top-bar gating must all engage as
 * soon as an ad is PRESENT — even while paused, before the pre-roll starts. So the UI gates on
 * `adPresent`; keying them on `isAdActive` left the timeline red + gadgets buried/clickable
 * only after playback began (or a pointer move flipped the flag).
 */
export const isAdPresent = (ads) => ads !== null && ads !== undefined;

export const computeSpinnerActive = ({ waiting, seeking, spriteVTTFile, loading, paused, ended }) =>
  (!!waiting || (!!seeking && !spriteVTTFile) || !!loading) && !paused && !ended;

export const computeShouldStayVisible = ({ paused, ended, loading, waiting, seeking, prevented, kernelMsg }) =>
  !!paused || !!ended || !!loading || !!waiting || !!seeking || !!prevented || kernelMsg != null;

// The time slider shows for VOD, and for a live stream ONLY when it is a seekable live-DVR
// stream. `dvrSupported` degrades a `liveDVR` stream to a plain live stream (no timeline) on
// platforms that cannot time-shift (iOS < 17.1, native HLS) — there the timeline would be dead
// (no seekable window), so it is hidden and the player looks like a normal live. Defaults to
// true so non-live callers and existing behavior are unaffected.
export const computeShowTimeSlider = (live, liveDVR, dvrSupported = true) => !live || (liveDVR && dvrSupported);

export const computeShowCast = (castSupported, adPresent, videoReady) => castSupported && !adPresent && videoReady;

// Poster shows before playback (currentTime <= 0), after end, OR while the player is paused
// because autoplay-with-sound was blocked and it never played yet (`autoplayBlocked`). The last
// case covers live, where the media currentTime is the live edge (never <= 0) so the pre-play
// state can't be inferred from currentTime alone.
export const isPosterVisible = (currentTime, ended, autoplayBlocked = false) =>
  currentTime <= 0 || ended || autoplayBlocked;

export const computeHideSettings = ({ adPresent, live, qualityOptionsLength, hasCaptions }) =>
  (adPresent && qualityOptionsLength === 0 && !hasCaptions) || (live && qualityOptionsLength === 0 && !hasCaptions);

export const showNavCluster = (showNavButtons, onPrevious, onNext) => !!(showNavButtons || onPrevious || onNext);

export const showChapterReadout = ({ adPresent, paused, chapters }) =>
  !(adPresent && !paused) && !!(chapters && chapters.length > 0);
