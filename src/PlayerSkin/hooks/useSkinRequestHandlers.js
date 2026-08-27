import React from 'react';

/**
 * `useSkinRequestHandlers` bundles every request→callback handler the skin wires from Core's
 * `playerstack-*` UI_Elements to the EXISTING public playback callbacks (Functional_Parity with
 * the monolith `CorePlayerSkin`). Each element surfaces its DOM request event as a React `on*`
 * callback (via `createReactElement`); those are wired here to the existing playback handlers so
 * play/pause/seek/volume/fullscreen/pip/rate/quality/loop/captions/nav/ad-skip keep working with
 * the same names, signatures and defaults.
 *
 * Thin skin wrapper (A8b): delegation only. The only branch preserved from the monolith is the
 * DVR-aware seek routing — and even that delegates the pinning/DVR-mapping to `pinAndSeek` (from
 * `useDvrDragPosition`, itself backed by core's `LiveDVRController`). No business logic, no timers,
 * no state machine, no non-trivial agnostic computation lives here.
 *
 * @param {object} params
 * @param {() => void} [params.onPlayClick] - Public play callback.
 * @param {() => void} [params.onPauseClick] - Public pause callback.
 * @param {(time: number) => void} [params.changeCurrentTime] - Public absolute-time seek callback.
 * @param {boolean} params.liveDVR - Whether live DVR (time-shift) mode is enabled.
 * @param {boolean} params.hasDVR - Whether a usable DVR seekable window exists.
 * @param {(time: number) => void} params.pinAndSeek - Pins the visual DVR position then commits the seek.
 * @param {(volume: number) => void} [params.changeVolume] - Public volume-change callback.
 * @param {() => void} [params.onMutedClick] - Public mute-toggle callback (mute + unmute both map to it).
 * @param {(rate: number) => void} [params.changePlaybackRate] - Public playback-rate callback.
 * @param {(quality: number) => void} [params.changePlayBackQuality] - Public quality-change callback.
 * @param {() => void} [params.requestFullscreen] - Public enter-fullscreen callback.
 * @param {() => void} [params.exitFullscreen] - Public exit-fullscreen callback.
 * @param {() => void} [params.requestPictureInPicture] - Public enter-PiP callback.
 * @param {() => void} [params.exitPictureInPicture] - Public exit-PiP callback.
 * @param {() => void} [params.onLoopClick] - Public loop-toggle callback.
 * @param {() => void} [params.onPrevious] - Public previous-track callback.
 * @param {() => void} [params.onNext] - Public next-track callback.
 * @param {(language: string|null) => void} [params.onCaptionChange] - Public caption-selection callback.
 * @param {(style: object) => void} params.updateCaptionStyle - Persists + re-feeds the caption style.
 * @param {{ onSkip?: () => void } | null} [params.ads] - Ads config (its `onSkip` drives ad skip).
 * @param {() => void} [params.seekToLiveEdge] - Jumps to the absolute live edge (DVR adapter).
 * @param {() => void} params.promptCast - Prompts the Google Cast / AirPlay picker.
 * @returns {object} All request→callback handlers with identical names/signatures/deps.
 */
const useSkinRequestHandlers = ({
  onPlayClick,
  onPauseClick,
  changeCurrentTime,
  liveDVR,
  hasDVR,
  pinAndSeek,
  changeVolume,
  onMutedClick,
  changePlaybackRate,
  changePlayBackQuality,
  requestFullscreen,
  exitFullscreen,
  requestPictureInPicture,
  exitPictureInPicture,
  onLoopClick,
  onPrevious,
  onNext,
  onCaptionChange,
  updateCaptionStyle,
  ads,
  seekToLiveEdge,
  promptCast,
}) => {
  const handlePlayRequest = React.useCallback(() => onPlayClick?.(), [onPlayClick]);
  const handlePauseRequest = React.useCallback(() => onPauseClick?.(), [onPauseClick]);
  const handleSeekRequest = React.useCallback(
    (event) => {
      const time = event?.detail?.time;
      if (typeof time !== 'number') {
        return;
      }
      // In DVR mode the slider `time` is a position within the seekable WINDOW (0..sliderDuration),
      // so route it through `pinAndSeek` (which pins the visual position, then commits via
      // `seekToDVRPosition`, mapping it back to an absolute media time capped just before the live
      // edge). Otherwise it is an absolute media time.
      if (liveDVR && hasDVR) {
        pinAndSeek(time);
        return;
      }
      changeCurrentTime?.(time);
    },
    [changeCurrentTime, liveDVR, hasDVR, pinAndSeek],
  );
  const handleVolumeRequest = React.useCallback(
    (event) => {
      const nextVolume = event?.detail?.volume;
      if (typeof nextVolume === 'number') {
        changeVolume?.(nextVolume);
      }
    },
    [changeVolume],
  );
  const handleMuteRequest = React.useCallback(() => onMutedClick?.(), [onMutedClick]);
  const handleUnmuteRequest = React.useCallback(() => onMutedClick?.(), [onMutedClick]);
  const handleRateRequest = React.useCallback(
    (event) => {
      const rate = event?.detail?.rate;
      if (typeof rate === 'number') {
        changePlaybackRate?.(rate);
      }
    },
    [changePlaybackRate],
  );
  const handleQualityRequest = React.useCallback(
    (event) => {
      const value = event?.detail?.value;
      const parsed = Number(value);
      changePlayBackQuality?.(Number.isNaN(parsed) ? 0 : parsed);
    },
    [changePlayBackQuality],
  );
  const handleEnterFullscreenRequest = React.useCallback(() => requestFullscreen?.(), [requestFullscreen]);
  const handleExitFullscreenRequest = React.useCallback(() => exitFullscreen?.(), [exitFullscreen]);
  const handleEnterPipRequest = React.useCallback(() => requestPictureInPicture?.(), [requestPictureInPicture]);
  const handleExitPipRequest = React.useCallback(() => exitPictureInPicture?.(), [exitPictureInPicture]);
  const handleLoopRequest = React.useCallback(() => onLoopClick?.(), [onLoopClick]);

  // Prev/next navigation (GAP 2/5, Req 21.1): the `playerstack-nav-buttons` element emits
  // `playerstack-prev-request`/`playerstack-next-request`, surfaced by the adapter as
  // `onPrevRequest`/`onNextRequest`. They are wired to the player's public `onPrevious`/`onNext`
  // callbacks, preserving their (no-arg) signatures.
  const handlePrevRequest = React.useCallback(() => onPrevious?.(), [onPrevious]);
  const handleNextRequest = React.useCallback(() => onNext?.(), [onNext]);

  // Caption selection (GAP 1, Req 21.1): the `playerstack-captions` element emits
  // `playerstack-caption-request` (detail `{ value }`) via its `selectCaption(value)` method,
  // surfaced by the adapter as `onCaptionRequest`. The selected track `value` is forwarded to
  // the existing public `onCaptionChange(language)` handler, preserving its signature.
  const handleCaptionRequest = React.useCallback(
    (event) => {
      const value = event?.detail?.value;
      if (value !== undefined) {
        onCaptionChange?.(value);
      }
    },
    [onCaptionChange],
  );

  // Caption STYLE change (parity with the original desktop `CaptionOptions` -> `onCaptionStyleChange`):
  // the `playerstack-settings` element emits `playerstack-caption-style-request` (detail `{ style }`)
  // from its "Options" style panel, surfaced by the adapter as `onCaptionStyleRequest`. Forward the
  // new style to `updateCaptionStyle` (from `useCaptions`), which persists it (cookie) and re-feeds
  // the overlay via `captionStyle`.
  const handleCaptionStyleRequest = React.useCallback(
    (event) => {
      const style = event?.detail?.style;
      if (style) {
        updateCaptionStyle(style);
      }
    },
    [updateCaptionStyle],
  );

  // Ad skip preserved from the `ads` config. The ad CLICK is driven by `useAds`'s `onAdClick`
  // (destructured in the orchestrator as `handleAdBannerClick`): it pauses, fires the consumer
  // `ads.onAdClick`, AND opens the click-through URL via the web ads platform (`window.open`) —
  // parity with the original `useAds.onAdClick`. The old local `() => ads?.onAdClick?.()` did none
  // of that, so the "Visit site"/banner click appeared inert.
  const handleAdSkip = React.useCallback(() => ads?.onSkip?.(), [ads]);

  // Live badge "jump to live edge": the `playerstack-live-indicator` emits a seek-request (target
  // `seekableEnd`), but in DVR mode `handleSeekRequest` treats the time as a WINDOW position — so
  // the live badge uses its OWN handler that drives the DVR adapter's `seekToLive` directly
  // (absolute edge), independent of the window mapping.
  const handleLiveEdgeRequest = React.useCallback(() => {
    seekToLiveEdge?.();
  }, [seekToLiveEdge]);

  const handleCastClick = React.useCallback(
    (event) => {
      event.stopPropagation();
      promptCast();
    },
    [promptCast],
  );

  return {
    handlePlayRequest,
    handlePauseRequest,
    handleSeekRequest,
    handleVolumeRequest,
    handleMuteRequest,
    handleUnmuteRequest,
    handleRateRequest,
    handleQualityRequest,
    handleEnterFullscreenRequest,
    handleExitFullscreenRequest,
    handleEnterPipRequest,
    handleExitPipRequest,
    handleLoopRequest,
    handlePrevRequest,
    handleNextRequest,
    handleCaptionRequest,
    handleCaptionStyleRequest,
    handleAdSkip,
    handleLiveEdgeRequest,
    handleCastClick,
  };
};

export default useSkinRequestHandlers;
