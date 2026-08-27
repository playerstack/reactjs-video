import React from 'react';

import { isMobile, IS_LIVE_DVR_SUPPORTED } from '@playerstack/web-core';

import { useCoreMediaBridge } from '@hooks/useCoreMediaBridge';
import { useCoreAutoHide } from '@hooks/useCoreAutoHide';
import useCast from '@hooks/useCast';
import { useLiveDVR } from '@hooks/useLiveDVR';
import { useAds } from '@hooks/useAds';
import useCaptions from '@hooks/useCaptions';
import { createWebDVRAdapter } from '@utils/dvrAdapter';
import { createWebLiveAdAdapter } from '@utils/liveAdAdapter';
import { webAdsPlatform } from '@utils/adsPlatform';

import { corePlayerSkinPropTypes } from '@PlayerSkin/CorePlayerSkin/CorePlayerSkin.propTypes';
import DesktopLayout from '@PlayerSkin/layouts/DesktopLayout';
import MobileLayout from '@PlayerSkin/layouts/MobileLayout';

import useSkinVideoRef from '@PlayerSkin/hooks/useSkinVideoRef';
import useScrubState from '@PlayerSkin/hooks/useScrubState';
import { useDvrDragPosition } from '@PlayerSkin/hooks/useDvrDragPosition';
import useLiveAdTrigger from '@PlayerSkin/hooks/useLiveAdTrigger';
import useCaptionToggle from '@PlayerSkin/hooks/useCaptionToggle';
import useMobileSettings from '@PlayerSkin/hooks/useMobileSettings';
import useAdActiveAttribute from '@PlayerSkin/hooks/useAdActiveAttribute';
import useSkinImperativeHandle from '@PlayerSkin/hooks/useSkinImperativeHandle';
import useSkinRequestHandlers from '@PlayerSkin/hooks/useSkinRequestHandlers';

import {
  isAdPresent,
  computeSpinnerActive,
  computeShouldStayVisible,
  computeShowTimeSlider,
  computeShowCast,
  isPosterVisible,
} from '@PlayerSkin/helpers/gating';
import { selectMobileSkin } from '@PlayerSkin/helpers/skinSelection';
import { computeBridgeState } from '@PlayerSkin/helpers/bridgeState';
import { mapQualityOptions } from '@PlayerSkin/helpers/qualityOptions';

/**
 * `CorePlayerSkin` is the thin composition root of the reactjs skin. It renders the player UI by
 * COMPOSING Core's `playerstack-*` UI_Elements (through the React_Adapter) inside a single
 * `playerstack-media-controller`, but it holds no inline business logic itself: it calls the
 * existing core-backed hooks (`useAds`, `useCaptions`, `useCast`, `useLiveDVR`,
 * `useCoreMediaBridge`, `useCoreAutoHide`) and the skin-local thin hooks (`useSkinVideoRef`,
 * `useCaptionToggle`, `useDvrDragPosition`, `useLiveAdTrigger`, `useScrubState`,
 * `useMobileSettings`, `useSkinImperativeHandle`, `useAdActiveAttribute`,
 * `useSkinRequestHandlers`), derives values through the pure helpers, assembles a single `skin`
 * bundle, and hands it to `<DesktopLayout>` or `<MobileLayout>`.
 *
 * The orchestrator's ONLY JSX branch is Mobile-vs-Desktop; there are no request→callback
 * definitions here (they live in `useSkinRequestHandlers`), no state machines, and no gating
 * expressions beyond those produced by the hooks/helpers.
 *
 * Data flow (interim bridge, preserving Functional_Parity): the `playerstack-media-controller`
 * owns the shared reactive store; `useCoreMediaBridge` mirrors the React playback state INTO that
 * store every render so the Core elements reflect the same playing/time/volume/etc. as before.
 * Each interactive element surfaces its request events as React `on*` callbacks wired to the
 * EXISTING playback handlers; rich props (captions/chapters/heatmap/ads/i18n/quality) are fed
 * through the adapter's property setters. Styling arrives from Core's Style_Auto_Injection.
 */
const CorePlayerSkin = React.forwardRef((props, ref) => {
  const {
    live = false,
    liveDVR = false,
    loading,
    paused,
    ended,
    seeking,
    waiting,
    duration,
    bufferedRanges = [],
    currentTime,
    muted,
    volume,
    pip,
    fullscreen,
    qualities = [],
    captions,
    activeCaption,
    spriteVTTFile,
    chapters,
    heatmapData,
    bufferMode,
    playbackRate,
    playbackQuality,
    loop,
    language,
    ads = null,
    kernelMsg = null,
    skinMode,
    onPlayClick,
    onPauseClick,
    changePlaybackRate,
    changePlayBackQuality,
    changeVolume,
    onMutedClick,
    changeCurrentTime,
    requestPictureInPicture,
    exitPictureInPicture,
    requestFullscreen,
    exitFullscreen,
    onLoopClick,
    onCaptionChange,
    onPreventedClick,
    onPrevious,
    onNext,
    showNavButtons = false,
  } = props;

  // Unified live flag (parity with the monolith's `live: live || liveDVR`): a live-DVR stream IS a
  // live stream for the purpose of the LIVE badge, the live-stream ad break, and the "hide the VOD
  // timeline unless DVR" rule. The DVR-only bits (negative offset readout, at-edge/jump-to-live)
  // still gate on the raw `liveDVR`. Without this, a `liveDVR` preset (which passes `live={false}`)
  // never rendered the live badge or the live-ad overlay.
  const isLive = live || liveDVR;

  // 1. Shared controller ref + the live-ad trigger setter holder (wired by `useLiveAdTrigger`).
  const controllerRef = React.useRef(null);
  const triggerAdRef = React.useRef(null);

  // 2. Resolve the REAL `<video>` sibling into a stable ref (Cast/DVR/live-ad read it).
  const { videoRef, videoReady } = useSkinVideoRef({ controllerRef, url: props.url, loading, skinMode });

  // 3. Ad lifecycle (pre-roll activation, skip timer, `onAdComplete`, media-session blocking). Its
  // `onAdClick` is the ad-banner click handler (pauses + consumer callback + opens click-through).
  const { onAdClick: handleAdBannerClick } = useAds({
    ads,
    currentTime,
    duration,
    paused,
    ended,
    onPauseClick,
    platform: webAdsPlatform,
  });

  // 4. Whether an ad is configured/present (drives ALL ad-mode UI gating; NOT `isAdActive`).
  const adPresent = isAdPresent(ads);

  // 5. Captions: fetch + parse the ACTIVE track's VTT into cues.
  const { cues: captionCues, captionStyle, updateCaptionStyle } = useCaptions({ captions, activeCaption });

  // 6. Cast (Google Cast / AirPlay) support keyed on the real video + ad presence.
  const { isSupported: castSupported, castState, promptCast } = useCast({ videoRef, disabled: adPresent });
  const showCast = computeShowCast(castSupported, adPresent, videoReady);

  // 7. Captions quick-toggle (remembers the last active track; restores or turns off).
  const captionToggle = useCaptionToggle({ activeCaption, captions, onCaptionChange });

  // 8. Live DVR (time-shift): adapter memo gated on `videoReady`, core hook, then the skin-local
  // drag-position pinning that mirrors the monolith's refs/state 1:1.
  // `videoRef` is a stable ref object (identity never changes), so listing it in the deps keeps the
  // memo keyed on `videoReady` in practice while satisfying exhaustive-deps at the root.
  const dvrAdapter = React.useMemo(() => (videoReady ? createWebDVRAdapter(videoRef) : null), [videoReady, videoRef]);
  const {
    dvrState,
    seekToLive: seekToLiveEdge,
    seekToDVRPosition,
  } = useLiveDVR({
    adapter: dvrAdapter,
    liveDVR,
    playing: !paused,
  });
  const dvr = useDvrDragPosition({ dvrState, liveDVR, seekToDVRPosition });

  // 9. Live-stream ad break: adapter memo gated on `videoReady`, plus the trigger state wiring
  // (also sets `triggerAdRef.current = setLiveAdTrigger` for the imperative handle).
  const liveAd = props.liveAd ?? null;
  // `videoRef` is a stable ref object; listing it keeps the memo keyed on `videoReady` (root-cause
  // fix for exhaustive-deps, no suppression comment) with unchanged behavior.
  const liveAdAdapter = React.useMemo(
    () => (videoReady ? createWebLiveAdAdapter(videoRef) : null),
    [videoReady, videoRef],
  );
  const { liveAdTrigger } = useLiveAdTrigger({ liveAd, triggerAdRef });

  // 10. Sprite/thumbnail preview scrub state (ref + shared web SpriteAdapter + scrub mirror).
  const scrub = useScrubState();

  // 11. Mobile settings panel opener (ref + delegation to the element's `open_`).
  const { mobileSettingsRef, openMobileSettings } = useMobileSettings();

  // 12. Imperative surface exposed to the wrapper hook (no-op show/hide + live-ad trigger).
  useSkinImperativeHandle(ref, { triggerAdRef });

  // 13. Mobile-vs-desktop skin selection.
  const useMobileSkin = selectMobileSkin(skinMode, isMobile);

  // 14. Bridge state: in DVR mode the slider maps the seekable WINDOW; otherwise absolute time.
  const dvrActive = liveDVR && dvr.hasDVR;
  const bridge = computeBridgeState({
    dvrActive,
    effectiveDVRPosition: dvr.effectiveDVRPosition,
    currentTime,
    sliderDuration: dvr.sliderDuration,
    duration,
    bufferedRanges,
  });

  // 15. Loading-spinner predicate (parity with the original MobileCenterControls `isLoading`).
  const spinnerActive = computeSpinnerActive({ waiting, seeking, spriteVTTFile, loading, paused, ended });

  // 16. Mirror the current React playback state into the Core store (interim bridge).
  useCoreMediaBridge({
    controllerRef,
    bridgeKey: useMobileSkin ? 'mobile' : 'desktop',
    state: {
      currentTime: bridge.currentTime,
      duration: bridge.duration,
      loaded: bridge.loaded,
      bufferedRanges: bridge.bufferedRanges,
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
      buffering: spinnerActive,
      kernelMsg,
      activeCaption,
    },
  });

  // 17. Auto-hide: keep the controls visible while the user must see them, else fade after idle.
  const shouldStayVisible = computeShouldStayVisible({
    paused,
    ended,
    loading,
    waiting,
    seeking,
    prevented: props.prevented,
    kernelMsg,
  });
  useCoreAutoHide({ controllerRef, shouldStayVisible, tapToToggle: useMobileSkin });

  // 18. Reflect ad-active on the controller host so the Style_Layer's ad-mode rules resolve.
  // Gated on `!isLive`: the yellow disabled ad-mode timeline must NOT engage over ANY live stream
  // (pure live OR live-DVR) — parity with the original `isAdActive && false === live` guard where
  // `live` was the unified flag. A live ad break is the separate `playerstack-live-ad` system.
  useAdActiveAttribute({ controllerRef, adPresent: adPresent && !isLive });

  // 19. Request→callback wiring (all memoized handlers; DVR-aware seek routes through `pinAndSeek`).
  const handlers = useSkinRequestHandlers({
    onPlayClick,
    onPauseClick,
    changeCurrentTime,
    liveDVR,
    hasDVR: dvr.hasDVR,
    pinAndSeek: dvr.pinAndSeek,
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
  });

  // 20. Quality options fed to `playerstack-settings` (defaults preserved from `qualities`).
  const qualityOptions = React.useMemo(() => mapQualityOptions(qualities), [qualities]);

  // 21. Whether the time-slider shows (hidden in pure live without DVR): `!isLive || liveDVR`.
  // On platforms that can't time-shift (iOS < 17.1 → native HLS, no seekable window),
  // `IS_LIVE_DVR_SUPPORTED` is false so a `liveDVR` stream degrades to a plain live stream: the
  // timeline is hidden (it would be dead anyway) and only the LIVE badge shows.
  const showTimeSlider = computeShowTimeSlider(isLive, liveDVR, IS_LIVE_DVR_SUPPORTED);

  // 22. Assemble the `skin` bundle and select the layout.
  const skin = {
    state: {
      // `live` is the UNIFIED flag (live || liveDVR) so the LIVE badge + live-ad overlay render on
      // a DVR stream too; `liveDVR` stays the raw flag for the DVR-only offset/at-edge behavior.
      live: isLive,
      liveDVR,
      // `dvrActive` = a USABLE, synced DVR window exists (liveDVR && the media reported a real
      // seekable position). The negative-offset read-out gates on THIS, not the raw `liveDVR`, so
      // it never shows a bogus offset from the pre-ready `currentTime=0`/`duration=edge` transient
      // on first load (the `-10:01` flash) — only once the window is genuinely active.
      dvrActive,
      loading,
      paused,
      ended,
      seeking,
      waiting,
      duration,
      bufferedRanges,
      currentTime,
      muted,
      volume,
      pip,
      fullscreen,
      qualities,
      captions,
      activeCaption,
      spriteVTTFile,
      chapters,
      heatmapData,
      bufferMode,
      playbackRate,
      playbackQuality,
      loop,
      language,
      ads,
      kernelMsg,
      poster: props.poster,
      hasResource: props.hasResource,
      prevented: props.prevented,
      showNavButtons,
      onPrevious,
      onNext,
      onPreventedClick,
    },
    derived: {
      adPresent,
      showCast,
      showTimeSlider,
      useMobileSkin,
      qualityOptions,
      castState,
      dvrState,
      effectiveDVRPosition: dvr.effectiveDVRPosition,
      liveAdTrigger,
      captionCues,
      captionStyle,
      scrubbing: scrub.scrubbing,
      scrubTime: scrub.scrubTime,
      isPosterVisible: isPosterVisible(currentTime, ended, props.autoplayBlocked),
    },
    refs: {
      spritePreviewRef: scrub.spritePreviewRef,
      mobileSettingsRef,
      videoRef,
    },
    adapters: {
      spriteAdapter: scrub.spriteAdapter,
      liveAdAdapter,
    },
    handlers,
    captionToggle: captionToggle.handleCaptionToggle,
    openMobileSettings,
    handleScrubbingRequest: scrub.handleScrubbingRequest,
    handleCastClick: handlers.handleCastClick,
    handleAdBannerClick,
  };

  if (skin.derived.useMobileSkin) {
    return <MobileLayout key="mobile" skin={skin} controllerRef={controllerRef} />;
  }
  return <DesktopLayout key="desktop" skin={skin} controllerRef={controllerRef} />;
});

CorePlayerSkin.displayName = 'CorePlayerSkin';

CorePlayerSkin.propTypes = corePlayerSkinPropTypes;

export default CorePlayerSkin;
