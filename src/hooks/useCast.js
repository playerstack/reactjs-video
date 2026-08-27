import React from 'react';

import { CastController } from '@playerstack/core';

import { createWebCastAdapter } from '@utils/castAdapter';

/**
 * Thin React wrapper over core's `CastController` (framework-agnostic cast/remote-playback state
 * machine) + the web cast adapter.
 *
 * Per the framework-agnostic-core standard, the cast state, the `disabled` gating and the
 * "Remote Playback → Presentation API" prompt orchestration live in `CastController` +
 * `createWebCastAdapter`. This hook only bridges them to React: it builds the controller for the
 * current `videoRef`, mirrors its `stateChange`/`availabilityChange` into React state, and
 * forwards `disabled` changes. No cast logic is reimplemented here.
 *
 * @param {object} params
 * @param {React.RefObject<HTMLVideoElement>} params.videoRef - Ref to the video element.
 * @param {boolean} params.disabled - Disable cast (e.g. during ads).
 * @returns {{ isSupported: boolean, castAvailable: boolean, castState: string, promptCast: () => void }}
 */
const useCast = ({ videoRef, disabled = false }) => {
  const controllerRef = React.useRef(null);
  const [castState, setCastState] = React.useState('disconnected');
  const [castAvailable, setCastAvailable] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(false);

  React.useEffect(() => {
    const adapter = createWebCastAdapter(videoRef);
    const controller = new CastController(adapter, { disabled });
    controllerRef.current = controller;

    setIsSupported(controller.isSupported);
    setCastState(controller.castState);
    setCastAvailable(controller.castAvailable);

    const syncDerived = () => setCastAvailable(controller.castAvailable);
    controller.on('stateChange', (state) => {
      setCastState(state);
      syncDerived();
    });
    controller.on('availabilityChange', syncDerived);

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
    // Rebuilt only when the video element ref object identity changes (stable in practice);
    // `disabled` is forwarded via the effect below without a rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `disabled` handled separately below
  }, [videoRef]);

  // Forward disabled changes to the controller (which re-gates castAvailable + the adapter).
  React.useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    controller.setDisabled(disabled);
    setCastAvailable(controller.castAvailable);
  }, [disabled]);

  const promptCast = React.useCallback(() => controllerRef.current?.prompt(), []);

  return { isSupported, castAvailable, castState, promptCast };
};

export default useCast;
