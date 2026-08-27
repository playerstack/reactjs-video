/**
 * Web fullscreen adapter for core's `FullscreenController`.
 *
 * Wraps the browser Fullscreen API (with vendor prefixes) on the player element, with the iOS
 * Safari `webkitEnterFullScreen` fallback on the `<video>`. This is the ONLY place that touches
 * the Fullscreen API; the request/exit/toggle decision + `isFullscreen` state live in the core
 * `FullscreenController`.
 *
 * @param {React.RefObject<HTMLElement>} playerRef - The player container to make fullscreen.
 * @param {React.RefObject<HTMLVideoElement>} videoRef - The video element (iOS fallback).
 * @returns {import('@playerstack/core').FullscreenAdapter}
 */
export function createWebFullscreenAdapter(playerRef, videoRef) {
  const currentFullscreenElement = () =>
    document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;

  return {
    request: () => {
      const playerElement = playerRef?.current;
      const videoElement = videoRef?.current;
      if (!playerElement) {
        console.error('createWebFullscreenAdapter: the player element is not ready');
        return;
      }
      if (playerElement.requestFullscreen) {
        const promise = playerElement.requestFullscreen();
        if (promise && promise.catch) promise.catch(() => {});
      } else if (playerElement.msRequestFullscreen) {
        playerElement.msRequestFullscreen();
      } else if (playerElement.webkitRequestFullscreen) {
        playerElement.webkitRequestFullscreen();
      } else if (videoElement && videoElement.webkitEnterFullScreen) {
        // iOS Safari fallback.
        videoElement.webkitEnterFullScreen();
      }
    },
    exit: () => {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    },
    isFullscreen: () => {
      const playerElement = playerRef?.current;
      return !!playerElement && currentFullscreenElement() === playerElement;
    },
    onChange: (callback) => {
      document.addEventListener('fullscreenchange', callback);
      document.addEventListener('webkitfullscreenchange', callback);
      document.addEventListener('MSFullscreenChange', callback);
      return () => {
        document.removeEventListener('fullscreenchange', callback);
        document.removeEventListener('webkitfullscreenchange', callback);
        document.removeEventListener('MSFullscreenChange', callback);
      };
    },
  };
}
