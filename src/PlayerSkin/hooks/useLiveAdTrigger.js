import React from 'react';

/**
 * Live-stream ad break (Twitch-style) trigger wiring. The entire overlay + phase machine live in
 * Core's `playerstack-live-ad` element (which owns the `LiveAdController` + the ad `<video>`). The
 * skin only forwards a trigger config: a break is triggered by the `liveAd` prop transitioning to a
 * non-null config, or imperatively via the `triggerAd` handle.
 *
 * Thin skin wrapper: holds the `liveAdTrigger` state + a `prevLiveAdRef`, runs the prop-transition
 * effect (the SAME effect the monolith did), and wires `triggerAdRef.current = setLiveAdTrigger` so
 * the imperative handle (defined before the state exists) can fire a break without depending on
 * declaration order. No timers, no computation, no state machine.
 */
const useLiveAdTrigger = ({ liveAd, triggerAdRef }) => {
  const [liveAdTrigger, setLiveAdTrigger] = React.useState(null);
  triggerAdRef.current = setLiveAdTrigger;

  // Trigger an ad break when the `liveAd` prop transitions to a non-null config (original effect).
  const prevLiveAdRef = React.useRef(null);
  React.useEffect(() => {
    if (liveAd && liveAd !== prevLiveAdRef.current) {
      setLiveAdTrigger(liveAd);
    }
    prevLiveAdRef.current = liveAd;
  }, [liveAd]);

  return { liveAdTrigger };
};

export default useLiveAdTrigger;
