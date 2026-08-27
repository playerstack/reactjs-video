import React from 'react';

/**
 * Reflect ad-active on the controller host so the Style_Layer's `playerstack-media-controller
 * [data-ad-active]` rules resolve — this is the SINGLE hook that drives the ad-mode slider
 * styling (yellow played fill, hidden handle, default cursor). It pairs with the `adMode`
 * property passed to the time-slider/settings elements, which own the JS-side gating
 * (chapters suppressed, speed dropped). Kept in an effect so no DOM is mutated during render.
 *
 * Thin skin I/O wrapper: it only sets/removes a `data-*` attribute on the controller host — the
 * SAME DOM I/O the monolith did — with no core logic, no computation, no timers, and no state
 * machine. Effect-only, returns nothing.
 */
const useAdActiveAttribute = ({ controllerRef, adPresent }) => {
  React.useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    // Ad-mode styling follows ad PRESENCE, not `isAdActive`: the ad overlay (banner/skip) shows as
    // soon as an ad is configured — even while paused, before the pre-roll starts — so the timeline
    // must turn yellow (+ hide the handle, disable seek) in that same paused state. Keying this on
    // `isAdActive` (true only after first play) left the timeline red until playback began.
    if (adPresent) {
      controller.setAttribute('data-ad-active', 'true');
    } else {
      controller.removeAttribute('data-ad-active');
    }
    // `controllerRef` is a stable ref object (identity never changes), so listing it in the deps
    // keeps the effect keyed on `adPresent` in practice while satisfying exhaustive-deps.
  }, [controllerRef, adPresent]);
};

export default useAdActiveAttribute;
