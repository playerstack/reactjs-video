import React from 'react';
import PropTypes from 'prop-types';

import PlayerEngine from '@root/engine';
import { useDeepCompareMemoize } from '@hooks/useDeepCompareMemoize';
import { CompositionContext } from '@compound/context/CompositionContext';
import { resolveComposition } from '@compound/hooks/useResolveComposition';
import { deriveEngineProps } from '@compound/hooks/deriveEngineProps';

/**
 * `Player` is the ROOT of the composed public API (the yellow box). It is the real player,
 * not a compatibility facade over a legacy monolith. Its whole job is:
 *   1) scan `children` -> a declarative manifest (which composable parts are present + their
 *      content config), or the default composition when there are no children (DX);
 *   2) derive the internal engine's prop contract from the ephemeral playback props + the
 *      collected content config, and render the engine with those props;
 *   3) provide the manifest through Context so the skin orchestrator can gate presence.
 *
 * It holds NO business logic (A8b): only a (delegated) children scan, a (delegated) pure
 * derivation, the Context Provider, and the memo wiring. It runs NO side-effects during render
 * (no logging, no state mutation, no DOM calls) — R3, Req 12.11.
 */
const Player = React.forwardRef(({ children, ...ephemeralProps }, ref) => {
  // 1) children -> manifest, memoized by `children` identity (R1/R2, Req 12.10). `children` is a
  //    fresh reference whenever the parent re-renders with inline JSX, which is exactly the
  //    intended recompute trigger: `resolveComposition` re-runs only when the child set's
  //    identity changes, not on unrelated re-renders that pass the same `children` reference.
  const manifest = React.useMemo(() => resolveComposition(children), [children]);

  // 2) `ephemeralProps` comes from object rest-spread, so it is a BRAND-NEW object on every
  //    render even when the consumer passes byte-identical props. Feeding it straight into a
  //    `useMemo` dependency array would defeat the memo — the identity check would fail every
  //    render and `deriveEngineProps` would recompute unconditionally, violating Req 12.10.
  //    Per R1 we first collapse it to a referentially-stable value with a SINGLE deep comparison
  //    (`useDeepCompareMemoize`, the repo's canonical tool for exactly this). The stable
  //    reference then makes the derivation memo meaningful: `engineProps` recomputes only when
  //    the ephemeral content actually changes, or when `manifest` changes.
  //
  //    This can never produce stale callbacks: `react-fast-compare` treats two different
  //    function references as unequal, so any changed lifecycle callback (`onPlay`, `onReady`,
  //    …) makes `ephemeralProps` compare unequal and yields a fresh reference, re-deriving the
  //    engine props with the latest callbacks. It only returns the previous reference when every
  //    key — callbacks included — is deeply equal, in which case re-deriving would be a no-op.
  const stableEphemeralProps = useDeepCompareMemoize(ephemeralProps);
  const engineProps = React.useMemo(
    () => deriveEngineProps(stableEphemeralProps, manifest),
    [stableEphemeralProps, manifest],
  );

  // 3) Provide the manifest by Context. The value keeps a stable identity while `manifest` is
  //    unchanged and gets a NEW identity when `manifest` changes (Req 4.2/4.3), so descendants
  //    reading it via `useComposition` (the orchestrator) don't re-render on unrelated Player
  //    renders.
  const contextValue = React.useMemo(() => ({ manifest }), [manifest]);

  return (
    <CompositionContext.Provider value={contextValue}>
      <PlayerEngine ref={ref} {...engineProps} />
    </CompositionContext.Provider>
  );
});

Player.displayName = 'Player';

// `children` are the composable parts. Every other prop is the ephemeral playback contract
// (url, playing, ads, live flags, config, container attributes, lifecycle callbacks, …) that is
// forwarded to the internal engine and validated there by the engine's own static `propTypes`.
// We deliberately do NOT re-declare that ~40-key surface here: duplicating it would drift out of
// sync with the engine and emit a second, redundant PropTypes warning for the same prop. Keeping
// this minimal (just `children`) satisfies Req 1.x propTypes without overengineering.
Player.propTypes = {
  children: PropTypes.node,
};

export default Player;
