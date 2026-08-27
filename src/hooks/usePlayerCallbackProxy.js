import { useMemo, useRef } from 'react';

import { createPlayerCallbackProxy } from '@playerstack/web-core';

/**
 * Thin React wrapper over core's `createPlayerCallbackProxy` (framework-agnostic player-event →
 * state-update proxy).
 *
 * Per the framework-agnostic-core standard, the event→state mapping and error classification live
 * in core. This hook only supplies React stability: it keeps the consumer callbacks, `updateState`,
 * and the reactive `seeking`/`prevented` values in refs, and passes GETTERS to the core factory so
 * the proxy object keeps a stable identity across renders while always reading the latest values.
 * No proxy/error logic is reimplemented here.
 */
export function usePlayerCallbackProxy(params) {
  const {
    onBuffer,
    onBufferEnd,
    onDuration,
    onEnded,
    onError,
    onPause,
    onPlay,
    onPlayBackRateChange,
    onProgress,
    onReady,
    onSeek,
    onStart,
    onLoaded,
    onMount,
    updateState,
    playerState,
    extraProps,
    recoverableErrorTypes,
    recoverableErrorDetails,
  } = params;

  // Keep the latest callbacks/state/values in refs so the getters read fresh values without
  // rebuilding the proxy (stable identity for React.memo on the player component).
  const callbacksRef = useRef(null);
  callbacksRef.current = {
    onBuffer,
    onBufferEnd,
    onDuration,
    onEnded,
    onError,
    onPause,
    onPlay,
    onPlayBackRateChange,
    onProgress,
    onReady,
    onSeek,
    onStart,
    onLoaded,
    onMount,
  };

  const updateStateRef = useRef(updateState);
  updateStateRef.current = updateState;

  const seekingRef = useRef(playerState.seeking);
  seekingRef.current = playerState.seeking;

  const preventedRef = useRef(extraProps.prevented);
  preventedRef.current = extraProps.prevented;

  const recoverableTypesRef = useRef(recoverableErrorTypes);
  recoverableTypesRef.current = recoverableErrorTypes;

  const recoverableDetailsRef = useRef(recoverableErrorDetails);
  recoverableDetailsRef.current = recoverableErrorDetails;

  // Build the proxy ONCE — all inputs are read through refs so identity stays stable.
  const proxy = useMemo(
    () =>
      createPlayerCallbackProxy({
        getCallbacks: () => callbacksRef.current,
        applyStateUpdate: (update) => updateStateRef.current(update),
        getSeeking: () => seekingRef.current,
        getPrevented: () => preventedRef.current,
        recoverableErrorTypes: recoverableTypesRef.current,
        recoverableErrorDetails: recoverableDetailsRef.current,
      }),
    [],
  );

  // Derive videoUrl from extraProps (skin-specific convenience, kept for API parity).
  const videoUrl =
    extraProps.url ?? (extraProps.sources && extraProps.sources.length > 0 ? extraProps.sources[0].src : null);

  return { ...proxy, videoUrl };
}
