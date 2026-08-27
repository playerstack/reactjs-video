import { useEffect, useMemo, useRef, useState } from 'react';

import { LiveDVRController } from '@playerstack/web-core';

/**
 * Thin React wrapper over core's `LiveDVRController` (framework-agnostic DVR state machine).
 *
 * Per the framework-agnostic-core standard, the DVR logic (seekable-window computation, live-edge
 * detection, `end - 1` safe-edge seek guard, `sliderPositionToTime`/`formatLiveOffset`) lives in
 * `LiveDVRController`. This hook only bridges that controller to React: it instantiates the
 * controller for the current `DVRAdapter`, mirrors its `dvrStateChange` events into React state,
 * and exposes the controller's seek actions. No DVR math is reimplemented here.
 */
export function useLiveDVR({ adapter, liveDVR, playing: _playing }) {
  const [dvrState, setDvrState] = useState(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!liveDVR || !adapter) {
      // Tear down any previous controller and clear state when DVR is off / no adapter.
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
      }
      setDvrState(null);
      return undefined;
    }

    const controller = new LiveDVRController(adapter);
    controllerRef.current = controller;
    // Seed React state with the controller's initial computation, then track changes.
    setDvrState(controller.state);
    controller.on('dvrStateChange', setDvrState);

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [liveDVR, adapter]);

  const isAtLiveEdge = dvrState?.isAtLiveEdge ?? true;

  // `liveOffset` mirrors the controller's formatted offset. Derived from `dvrState` (which drives
  // this render) via the controller's getter, so it stays in sync without an extra memo.
  const liveOffset = dvrState ? (controllerRef.current?.liveOffset ?? '') : '';

  const actions = useMemo(
    () => ({
      seekToLive: () => controllerRef.current?.seekToLive(),
      seekToDVRPosition: (sliderPos) => controllerRef.current?.seekToDVRPosition(sliderPos),
    }),
    [],
  );

  return {
    dvrState,
    isAtLiveEdge,
    liveOffset,
    seekToLive: actions.seekToLive,
    seekToDVRPosition: actions.seekToDVRPosition,
  };
}
