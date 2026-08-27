import React from 'react';

import {
  createPlayerCallbackProxy,
  indexBy,
  measureNetworkSpeed,
  selectAutoQuality,
  validateFullHDBreak,
} from '@playerstack/core';

import { useDeepCompareMemoize } from '@hooks/useDeepCompareMemoize';

/**
 * Video player-proxy hook — a THIN wrapper (framework-agnostic-core standard, A4/A8b).
 *
 * All agnostic logic lives in core and is only CONSUMED here:
 *   - the player-event → state proxy (buffering/duration/ended/error/pause/play/rate/progress/
 *     ready/seek + PIP + quality) comes from `createPlayerCallbackProxy` (video flags:
 *     PIP + quality handlers, autoplay-error skip, and preserve play intent on fatal errors);
 *   - auto-quality selection uses core's `measureNetworkSpeed` + `selectAutoQuality`;
 *   - the `fullHDQualityBreak` validation uses core's `validateFullHDBreak`.
 *
 * This hook only does the React binding: refs to keep the proxy stable, effects for the async
 * auto-quality measurement + the "restore auto" behavior, and the `videoUrl` derivation the
 * `<video>` renders from. No state machine, error lists, or quality math live here.
 */
const usePlayerProxy = ({
  onBuffer,
  onBufferEnd,
  onDisablePIP,
  onDuration,
  onEnablePIP,
  onEnded,
  onError,
  onPause,
  onPlay,
  onPlayBackQualityChange,
  onPlayBackRateChange,
  onProgress,
  onReady,
  onSeek,
  onStart,
  onLoaded,
  onMount,
  updateState,
  playerState,
  extraProps: { url, sources, fullHDQualityBreak, prevented },
}) => {
  const [autoVideoUrl, setAutoVideoUrl] = React.useState(null);

  // Stabilize the consumer's (often inline) `sources` array so the effects below only re-run on
  // real content changes.
  const stableSources = useDeepCompareMemoize(sources);

  // Index by resolution once per real source change — reused by the videoUrl memo.
  const sourcesByResolution = React.useMemo(
    () => (stableSources.length > 0 ? indexBy(stableSources, 'resolution') : null),
    [stableSources],
  );

  // Keep latest callbacks / reactive values in refs so the proxy identity stays stable.
  const updateStateRef = React.useRef(updateState);
  updateStateRef.current = updateState;

  const callbacksRef = React.useRef(null);
  callbacksRef.current = {
    onBuffer,
    onBufferEnd,
    onDisablePIP,
    onDuration,
    onEnablePIP,
    onEnded,
    onError,
    onPause,
    onPlay,
    onPlayBackQualityChange,
    onPlayBackRateChange,
    onProgress,
    onReady,
    onSeek,
    onStart,
    onLoaded,
    onMount,
  };

  const preventedRef = React.useRef(prevented);
  preventedRef.current = prevented;
  const seekingRef = React.useRef(playerState.seeking);
  seekingRef.current = playerState.seeking;

  const autoResolutionRef = React.useRef(null);

  // Warn once (per source set) when `fullHDQualityBreak` doesn't match any available resolution —
  // the validation itself is core's pure `validateFullHDBreak`; the effect only surfaces it.
  React.useEffect(() => {
    const message = validateFullHDBreak(fullHDQualityBreak, stableSources);
    if (message) console.error(message);
  }, [stableSources, fullHDQualityBreak]);

  // Auto-select the best quality once per source set: core measures the speed + picks the source.
  React.useEffect(() => {
    if (stableSources.length === 0) {
      setAutoVideoUrl(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const speed = await measureNetworkSpeed();
      if (cancelled) return;
      const chosen = selectAutoQuality(stableSources, speed);
      if (!chosen) return;
      setAutoVideoUrl(chosen.src);
      autoResolutionRef.current = chosen.resolution;
      updateStateRef.current((prev) => ({ ...prev, playbackQuality: chosen.resolution }));
    })();
    return () => {
      cancelled = true;
    };
  }, [stableSources]);

  const { playbackQuality } = playerState;

  // When the user switches back to "auto" (playbackQuality === 0), restore the auto resolution.
  React.useEffect(() => {
    if (playbackQuality === 0 && autoResolutionRef.current !== null) {
      updateStateRef.current((prev) => ({ ...prev, playbackQuality: autoResolutionRef.current }));
    }
  }, [playbackQuality]);

  const videoUrl = React.useMemo(() => {
    if (!sourcesByResolution) return url;
    if (playbackQuality === null || playbackQuality === undefined || playbackQuality === 0) {
      return autoVideoUrl ?? stableSources[0].src;
    }
    return sourcesByResolution[playbackQuality]?.src ?? stableSources[0].src;
  }, [url, stableSources, sourcesByResolution, playbackQuality, autoVideoUrl]);

  // Build the proxy once from core, with the video-skin flags. All values read via getters/refs.
  const proxy = React.useMemo(
    () =>
      createPlayerCallbackProxy({
        getCallbacks: () => callbacksRef.current,
        applyStateUpdate: (updater) => updateStateRef.current(updater),
        getSeeking: () => seekingRef.current,
        getPrevented: () => preventedRef.current,
        clearPlayingOnEnded: true,
        includeBufferedRangesOnProgress: true,
        includePipHandlers: true,
        includeQualityHandler: true,
        skipAutoplayErrors: true,
        // Video preserves the user's play intent on a fatal (structured) error.
        clearPlayingOnFatalError: false,
      }),
    [],
  );

  return {
    ...proxy,
    videoUrl: videoUrl ?? autoVideoUrl,
  };
};

export default usePlayerProxy;
