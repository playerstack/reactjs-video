import React from 'react';

/**
 * Skin-local thin hook for the live DVR drag-position pinning (parity with the original
 * `CorePlayerSkin` DVR wiring). The DVR math itself (seekable window, live-edge, offset) lives in
 * core's `LiveDVRController` (consumed via `useLiveDVR`); this hook only mirrors the monolith's
 * React refs/state that pin the visual slider position during a DVR drag WITHOUT seeking on every
 * move, and commit the seek on drag.
 *
 * It derives `hasDVR`/`sliderPosition`/`sliderDuration` from the passed `dvrState`, tracks the
 * pinned `liveDragPosition` (with its `liveSeekingRef`/`liveDragPositionRef` mirrors), clears the
 * pin once the video catches up (the exact `< 2` tolerance), and exposes `pinAndSeek(time)` which
 * pins the position then routes through `seekToDVRPosition`. No new math is introduced.
 */
export function useDvrDragPosition({ dvrState, liveDVR: _liveDVR, seekToDVRPosition }) {
  const hasDVR = dvrState?.hasDVR ?? false;
  const sliderDuration = dvrState?.sliderDuration ?? 0;
  const sliderPosition = dvrState?.sliderPosition ?? 0;

  // Track the visual slider position during a DVR drag WITHOUT seeking on every move (parity with
  // the original: pin the position while dragging, commit on release). Mirrors `liveDragPosition`.
  const [liveDragPosition, setLiveDragPosition] = React.useState(null);
  const liveSeekingRef = React.useRef(false);
  const liveDragPositionRef = React.useRef(null);

  // Clear the pinned visual position once the video catches up to it (original effect).
  React.useEffect(() => {
    if (liveDragPosition !== null && !liveSeekingRef.current) {
      if (Math.abs(sliderPosition - liveDragPosition) < 2) {
        setLiveDragPosition(null);
        liveDragPositionRef.current = null;
      }
    }
  }, [sliderPosition, liveDragPosition]);

  // In DVR mode the effective slider position is the pinned drag position (if any) else the live
  // window position.
  const effectiveDVRPosition = liveDragPosition !== null ? liveDragPosition : sliderPosition;

  // Pin the visual position immediately so the slider does not snap back before the video catches
  // up (parity with the original drag-position pinning), then commit the seek.
  const pinAndSeek = React.useCallback(
    (time) => {
      setLiveDragPosition(time);
      liveDragPositionRef.current = time;
      seekToDVRPosition?.(time);
    },
    [seekToDVRPosition],
  );

  return { hasDVR, sliderPosition, sliderDuration, effectiveDVRPosition, pinAndSeek };
}
