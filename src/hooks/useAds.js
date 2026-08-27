import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AdsController, computeAdPlaybackState } from '@playerstack/web-core';

/**
 * Thin React wrapper over core's `AdsController` + `computeAdPlaybackState` (framework-agnostic
 * ads state machine + pure per-frame math).
 *
 * Per the framework-agnostic-core standard, the ad logic lives in core:
 *   - `AdsController` owns the stateful parts: pre-roll activation (first play), completion
 *     detection (`onAdComplete`, once), and skip/click delegation.
 *   - `computeAdPlaybackState` is the pure per-frame derivation (`hasSkipTimer`/`canSkip`/
 *     `skipCountdown`/`adProgress`) used for the synchronous render values.
 *
 * This hook only bridges them to React: it drives the controller from the `paused`/`ended` prop
 * transitions, mirrors activation into React state, derives the render values from the pure
 * function, and blocks the media session through the injected `platform` (a browser adapter).
 * No ad state-machine math is reimplemented here.
 */
export function useAds({ ads, currentTime, duration, paused, ended, onPauseClick, platform }) {
  const adsConfigured = ads !== null && ads !== undefined;

  const controllerRef = useRef(null);
  if (controllerRef.current === null) {
    controllerRef.current = new AdsController();
  }

  const [isAdActive, setIsAdActive] = useState(() => adsConfigured && !paused && !ended);

  // Configure the controller whenever the ad config changes, and pre-activate if playback is
  // already running (parity: ads appearing mid-play activate immediately).
  useEffect(() => {
    const controller = controllerRef.current;
    controller.configure(adsConfigured ? ads : null);
    if (adsConfigured && !paused && !ended) {
      controller.notifyPlay();
    }
    setIsAdActive(controller.isAdActive);
    // Intentionally keyed on the config identity only; play transitions are handled below.
  }, [ads, adsConfigured]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drive pre-roll activation from the paused -> playing transition (first play triggers the ad).
  const prevPausedRef = useRef(paused);
  useEffect(() => {
    const controller = controllerRef.current;
    if (adsConfigured && prevPausedRef.current && !paused) {
      controller.notifyPlay();
      setIsAdActive(controller.isAdActive);
    }
    prevPausedRef.current = paused;
  }, [adsConfigured, paused]);

  // Feed the controller each frame so it detects completion (`onAdComplete`, once) and emits its
  // internal progress/skippable events. The synchronous render values come from the pure helper.
  useEffect(() => {
    if (isAdActive) {
      controllerRef.current.update(currentTime, duration, !!ended);
    }
  }, [isAdActive, currentTime, duration, ended]);

  // Destroy the controller on unmount.
  useEffect(() => {
    const controller = controllerRef.current;
    return () => controller.destroy();
  }, []);

  // Synchronous per-frame render values (pure core math).
  const { hasSkipTimer, canSkip, skipCountdown, adProgress } = useMemo(
    () => computeAdPlaybackState({ ads, currentTime, duration, isActive: isAdActive }),
    [ads, currentTime, duration, isAdActive],
  );

  // Block the media session (seek controls) while the ad is active, via the platform adapter.
  const blockCleanupRef = useRef(null);
  useEffect(() => {
    if (isAdActive && platform?.blockMediaSession) {
      blockCleanupRef.current = platform.blockMediaSession();
    }
    return () => {
      if (blockCleanupRef.current) {
        blockCleanupRef.current();
        blockCleanupRef.current = null;
      }
    };
  }, [isAdActive, platform]);

  const onSkipClick = useCallback(() => {
    if (isAdActive) controllerRef.current.onSkip();
  }, [isAdActive]);

  const onAdClick = useCallback(() => {
    if (!isAdActive) return;
    if (onPauseClick) onPauseClick();
    controllerRef.current.onAdClick();
    if (ads?.url && platform?.openUrl) platform.openUrl(ads.url);
  }, [isAdActive, ads, onPauseClick, platform]);

  return { isAdActive, hasSkipTimer, canSkip, skipCountdown, adProgress, onSkipClick, onAdClick };
}
