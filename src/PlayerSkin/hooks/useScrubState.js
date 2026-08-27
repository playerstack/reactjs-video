import React from 'react';

import { createWebSpriteAdapter } from '@utils/spriteAdapter';

/**
 * `useScrubState` holds the skin-local wiring for Core's sprite/thumbnail preview scrub flow
 * (parity with the monolith's `spritePreviewRef`/`spriteAdapter` + `scrubbing`/`scrubTime`
 * mirroring). THIN wrapper: refs + a memoized web SpriteAdapter + an event-mirror callback only —
 * no timers, no state machine, no computation.
 *
 * Sprite/thumbnail preview: Core's `playerstack-sprite-preview` (mobile full-area scrub preview)
 * and `playerstack-time-slider` (desktop hover timelens) elements own the markup + frame math;
 * the skin supplies ONE web SpriteAdapter shared by both. The mobile preview cover-scales, so it
 * measures the element host itself (resolved from the ref) for `getContainerSize`; the desktop
 * timelens renders native 1:1 and only uses the adapter's `fetchVtt`.
 *
 * Live scrub state for the MOBILE full-area sprite preview (parity with the original mobile
 * MobileSpritePreview): while the user drags the progress handle, Core's `playerstack-time-slider`
 * emits `playerstack-scrubbing-request` (`{ seeking, time }`) on press/move/release WITHOUT
 * committing a seek per move. The skin mirrors it here so the preview shows the DRAGGED frame
 * (replacing the video) and hides on release — instead of the small desktop timelens thumbnail.
 *
 * @returns {{
 *   spritePreviewRef: React.MutableRefObject<HTMLElement | null>,
 *   spriteAdapter: import('@playerstack/web-core').SpriteAdapter,
 *   scrubbing: boolean,
 *   scrubTime: number,
 *   handleScrubbingRequest: (event: CustomEvent) => void,
 * }}
 */
export default function useScrubState() {
  const spritePreviewRef = React.useRef(null);
  const spriteAdapter = React.useMemo(() => createWebSpriteAdapter(() => spritePreviewRef.current), []);

  const [scrubbing, setScrubbing] = React.useState(false);
  const [scrubTime, setScrubTime] = React.useState(0);
  const handleScrubbingRequest = React.useCallback((event) => {
    const detail = event?.detail;
    if (!detail) return;
    setScrubbing(!!detail.seeking);
    if (typeof detail.time === 'number') setScrubTime(detail.time);
  }, []);

  return { spritePreviewRef, spriteAdapter, scrubbing, scrubTime, handleScrubbingRequest };
}
