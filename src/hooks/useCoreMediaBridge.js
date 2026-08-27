import React from 'react';

/**
 * Interim state bridge between the reactjs player's React-managed playback state
 * and Core's reactive `MediaStore` (tasks 14.3/14.7).
 *
 * WHY a bridge instead of `attachController`: the reactjs data flow does NOT expose
 * a `PlayerAdapter` + `PlayerOrchestrator` pair to the skin — playback state lives
 * as React state in `MediaPlayerSkin` (driven by `usePlayerProxy` on the `<video>`),
 * and the existing handlers mutate it via `updateState` + `player.seekTo`. So rather
 * than re-architecting the whole data flow (high parity risk), this hook drives the
 * `playerstack-media-controller`'s store DIRECTLY from the current React state. The
 * Core UI_Elements subscribe to that store and reflect it as `data-*`, exactly as
 * they would under a full MediaController — only the state SOURCE differs. Request
 * events emitted by the Core elements are wired to the existing playback handlers by
 * the skin (via the React_Adapter `on*` callbacks), so play/pause/seek/volume/etc.
 * keep working with the same behavior (Functional_Parity).
 *
 * The mapping honors the `MediaStoreState` (= Core `PlayerState`) field names:
 * `seek`/`played` carry the current position (Core elements read `seek`), `loaded`
 * the buffered position, and the rest map 1:1 from the reactjs playback state.
 *
 * @param {object} params
 * @param {React.RefObject<HTMLElement & { store?: import('@playerstack/web-core/ui').MediaStore }>} params.controllerRef
 *   Ref to the mounted `playerstack-media-controller` host element (it owns the store).
 * @param {object} params.state - The flattened reactjs playback state to mirror.
 */
export function useCoreMediaBridge({ controllerRef, state, bridgeKey }) {
  const {
    currentTime,
    duration,
    loaded,
    bufferedRanges,
    playing,
    paused,
    muted,
    volume,
    playbackRate,
    playbackQuality,
    loop,
    pip,
    fullscreen,
    ended,
    seeking,
    loading,
    buffering,
    kernelMsg,
    activeCaption,
  } = state;

  // Derive `playing` from whichever source the skin provided: some code paths pass
  // `playing` directly, others pass `paused`. Prefer explicit `playing` when present.
  const isPlaying = typeof playing === 'boolean' ? playing : paused === false;

  React.useLayoutEffect(() => {
    const controller = controllerRef.current;
    const store = controller?.store;
    if (!store || typeof store.set !== 'function') {
      return;
    }

    store.set({
      seek: currentTime ?? 0,
      played: currentTime ?? 0,
      loaded: loaded ?? 0,
      bufferedRanges: bufferedRanges ?? [],
      duration: duration ?? 0,
      playing: isPlaying,
      isMuted: muted ?? false,
      volume: volume ?? 0,
      playbackRate: playbackRate ?? 1,
      playbackQuality: playbackQuality ?? null,
      loop: loop ?? false,
      isPIP: pip ?? false,
      isFullScreen: fullscreen ?? false,
      isEnded: ended ?? false,
      seeking: seeking ?? false,
      isLoading: loading ?? false,
      isBuffering: buffering ?? false,
      kernelError: kernelMsg ?? null,
      activeCaption: activeCaption ?? null,
    });
  }, [
    controllerRef,
    currentTime,
    duration,
    loaded,
    bufferedRanges,
    isPlaying,
    muted,
    volume,
    playbackRate,
    playbackQuality,
    loop,
    pip,
    fullscreen,
    ended,
    seeking,
    loading,
    buffering,
    kernelMsg,
    activeCaption,
    bridgeKey,
  ]);
}
