import { useCallback, useEffect, useRef } from 'react';

import { VolumeController } from '@playerstack/core';

/**
 * Thin React wrapper over core's `VolumeController` (framework-agnostic volume state machine).
 *
 * Per the framework-agnostic-core standard, the volume logic (mute-memory, the ignore-own-changes
 * guard, and mapping external `onVolumeChange` events to `{ volume, muted }`) lives in
 * `VolumeController`. This hook only bridges that controller to React: it instantiates the
 * controller for the current `VolumeAdapter`, forwards its `volumeChange` events to the consumer's
 * `updateState`, and exposes the controller's actions. No volume math is reimplemented here.
 */
export function useVolume({ adapter, muted, updateState }) {
  const controllerRef = useRef(null);

  // Keep the latest updateState in a ref so the controller subscription reads the current one
  // without re-subscribing every render.
  const updateStateRef = useRef(updateState);
  updateStateRef.current = updateState;

  // (Re)build the controller when the adapter changes; forward its events to React state.
  useEffect(() => {
    const controller = new VolumeController(adapter);
    controllerRef.current = controller;
    controller.on('volumeChange', ({ volume, muted: isMuted }) => {
      updateStateRef.current({ volume, muted: isMuted });
    });
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [adapter]);

  // Sync the muted prop to the adapter when it changes externally (parity with the original).
  // `syncMuted` engages the controller's ignore-guard so the echoed onVolumeChange does not feed
  // back into React state.
  useEffect(() => {
    controllerRef.current?.syncMuted(muted);
  }, [muted]);

  const onMutedClick = useCallback(() => {
    controllerRef.current?.onMutedClick();
  }, []);

  const changeVolume = useCallback((v) => {
    controllerRef.current?.changeVolume(v);
  }, []);

  const updateVolumeWithCallback = useCallback(
    (cb) => {
      const lastVolume = adapter.getVolume();
      changeVolume(cb(lastVolume));
    },
    [adapter, changeVolume],
  );

  return { onMutedClick, changeVolume, updateVolumeWithCallback };
}
