import React from 'react';

import { FullscreenController } from '@playerstack/core';

import { createWebFullscreenAdapter } from '@utils/fullscreenAdapter';

/**
 * Thin React wrapper over core's `FullscreenController` (framework-agnostic fullscreen state
 * machine) + the web Fullscreen adapter.
 *
 * Per the framework-agnostic-core standard, the request/exit/toggle decision and the
 * `isFullscreen` state live in `FullscreenController`; the browser Fullscreen API (vendor
 * prefixes, iOS fallback) lives in `createWebFullscreenAdapter`. This hook only bridges them to
 * React: it builds the controller for this mount and mirrors its `fullscreenChange` into
 * `updateState`. No fullscreen logic is reimplemented here.
 */
const useFullscreen = ({ updateState, videoRef, playerRef }) => {
  const controllerRef = React.useRef(null);

  const updateStateRef = React.useRef(updateState);
  updateStateRef.current = updateState;

  React.useEffect(() => {
    const adapter = createWebFullscreenAdapter(playerRef, videoRef);
    const controller = new FullscreenController(adapter);
    controllerRef.current = controller;
    controller.on('fullscreenChange', (isFullscreen) => {
      updateStateRef.current({ fullscreen: isFullscreen });
    });
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [playerRef, videoRef]);

  const requestFullscreen = React.useCallback(() => controllerRef.current?.request(), []);
  const exitFullscreen = React.useCallback(() => controllerRef.current?.exit(), []);
  const requestToggleFullscreen = React.useCallback(() => controllerRef.current?.toggle(), []);

  return { requestFullscreen, exitFullscreen, requestToggleFullscreen };
};

export default useFullscreen;
