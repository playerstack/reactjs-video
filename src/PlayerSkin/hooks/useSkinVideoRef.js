import React from 'react';

/**
 * Resolve the REAL `<video>` element (a sibling of the `playerstack-media-controller`, rendered by
 * `MediaPlayerSkin` under the player wrapper) into a stable ref, exposing a `videoReady` flag once
 * it is found. Cast, DVR, and the live-ad adapter all read the real media element, which is a
 * BROWSER/DOM concern (Core never touches the media element), so this DOM resolution stays on the
 * reactjs side.
 *
 * Thin skin I/O wrapper: it only queries the DOM for the `<video>` sibling — the SAME DOM I/O the
 * monolith did — with no core logic, no computation, no timers, and no state machine. The `<video>`
 * (re)mounts when the source (`url`) changes and once `loading` settles, so those drive the
 * re-resolve — the effect does NOT run every render (which would loop with setState). Returns
 * `undefined` cleanup / no-ops when the controller is absent, as before.
 */
const useSkinVideoRef = ({ controllerRef, url, loading, skinMode }) => {
  const videoRef = React.useRef(null);
  const [videoReady, setVideoReady] = React.useState(false);
  React.useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return undefined;
    const wrapper = controller.parentElement ?? controller;
    const video = wrapper.querySelector('video');
    videoRef.current = video ?? null;
    setVideoReady(video != null);
    return undefined;
  }, [controllerRef, url, loading, skinMode]);

  return { videoRef, videoReady };
};

export default useSkinVideoRef;
