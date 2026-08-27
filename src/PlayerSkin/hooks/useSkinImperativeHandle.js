import React from 'react';

/**
 * Preserve the imperative surface the previous skins exposed to the wrapper hook
 * (`showControls`/`hideControls`/`triggerAd`). Auto-hide is now driven by Core's
 * Style_Layer/state, so these are safe no-ops that keep the existing optional-chained
 * calls in `usePlayerSkinWrapper.handleKeyDown` working without changing behavior.
 *
 * Thin skin wrapper (A8b): a single `useImperativeHandle` call — no timers, no computation,
 * no state machine. The live-ad trigger is delegated through `triggerAdRef` (parity with the
 * original imperative handle) so the wrapper's optional-chained `triggerAd` calls drive a real
 * live ad break instead of a no-op.
 *
 * @param {React.Ref<unknown>} ref - The forwarded ref exposing the imperative handle.
 * @param {object} params
 * @param {React.MutableRefObject<((config: unknown) => void) | null>} params.triggerAdRef - Ref
 *   holding the live-ad trigger setter (wired by `useLiveAdTrigger`).
 * @returns {void}
 *
 * Deps note: the monolith used empty deps `[]` because `triggerAdRef` was a `useRef` declared in
 * the same component, which the react-hooks lint rule recognizes as stable and omits. Here the ref
 * arrives as a parameter, so the rule can no longer prove stability. `triggerAdRef` is included in
 * the deps to resolve the warning at the root (no suppression comment); a ref object's identity is
 * stable across renders, so the handle is recreated at most once and behavior is unchanged.
 */
const useSkinImperativeHandle = (ref, { triggerAdRef }) => {
  React.useImperativeHandle(
    ref,
    () => ({
      showControls: () => {},
      hideControls: () => {},
      // Expose the live-ad trigger (parity with the original imperative handle) so the wrapper's
      // optional-chained `triggerAd` calls drive a real live ad break instead of a no-op.
      triggerAd: (config) => triggerAdRef.current?.(config),
    }),
    [triggerAdRef],
  );
};

export default useSkinImperativeHandle;
