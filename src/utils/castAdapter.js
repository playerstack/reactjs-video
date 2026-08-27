/**
 * Web cast adapter for core's `CastController`.
 *
 * Wraps the Remote Playback API (`video.remote`) with a Presentation API fallback. This is the
 * ONLY place that touches those browser APIs; the cast STATE (supported/state/available), the
 * `disabled` gating and the "prompt then fall back" orchestration live in the core
 * `CastController`.
 *
 * @param {React.RefObject<HTMLVideoElement>} videoRef - Ref to the video element.
 * @returns {import('@playerstack/core').CastAdapter}
 */
export function createWebCastAdapter(videoRef) {
  const hasRemotePlayback = typeof document !== 'undefined' && 'remote' in document.createElement('video');
  const hasPresentationAPI = typeof window !== 'undefined' && 'PresentationRequest' in window;

  let presentationConnection = null;

  // Callbacks the controller subscribes to.
  let stateListener = null;
  const emitState = (state) => {
    if (stateListener) stateListener(state);
  };

  const promptPresentation = () =>
    new Promise((resolve, reject) => {
      if (!hasPresentationAPI) {
        reject(new Error('Presentation API unavailable'));
        return;
      }
      const url = window.location.href;
      if (!url || url.length === 0) {
        reject(new Error('No presentable URL'));
        return;
      }
      try {
        const request = new window.PresentationRequest([url]);
        request
          .start()
          .then((connection) => {
            presentationConnection = connection;
            emitState('connected');
            connection.addEventListener('close', () => {
              presentationConnection = null;
              emitState('disconnected');
            });
            connection.addEventListener('terminate', () => {
              presentationConnection = null;
              emitState('disconnected');
            });
            resolve({ usedFallback: true });
          })
          .catch((err) => {
            emitState('disconnected');
            reject(err);
          });
      } catch (err) {
        // PresentationRequest constructor can throw for invalid URLs.
        emitState('disconnected');
        reject(err);
      }
    });

  return {
    isSupported: () => hasRemotePlayback || hasPresentationAPI,
    getState: () => {
      const remote = videoRef?.current?.remote;
      return remote?.state || 'disconnected';
    },
    prompt: () => {
      const el = videoRef?.current;
      // Try Remote Playback first; on failure fall back to the Presentation API.
      if (el && el.remote) {
        return el.remote
          .prompt()
          .then(() => {
            emitState('connected');
            return { usedFallback: false };
          })
          .catch(() => promptPresentation());
      }
      return promptPresentation();
    },
    setDisabled: (disabled) => {
      const el = videoRef?.current;
      if (el) el.disableRemotePlayback = disabled;
    },
    watchAvailability: (callback) => {
      const el = videoRef?.current;
      if (el && el.remote) {
        let watchId = null;
        el.remote
          .watchAvailability((isAvailable) => callback(isAvailable))
          .then((id) => {
            watchId = id;
          })
          .catch(() => {
            // watchAvailability unsupported — assume available, prompt() shows the picker.
            callback(true);
          });
        return () => {
          if (watchId !== null && el.remote) {
            el.remote.cancelWatchAvailability(watchId).catch(() => {});
            watchId = null;
          }
        };
      }
      // No Remote Playback: if the Presentation API exists, a device is assumed available.
      callback(hasPresentationAPI);
      return () => {};
    },
    onStateChange: (callback) => {
      stateListener = callback;
      const el = videoRef?.current;
      const remote = el?.remote;
      if (!remote) {
        return () => {
          stateListener = null;
        };
      }
      const onConnecting = () => callback('connecting');
      const onConnect = () => callback('connected');
      const onDisconnect = () => callback('disconnected');
      remote.addEventListener('connecting', onConnecting);
      remote.addEventListener('connect', onConnect);
      remote.addEventListener('disconnect', onDisconnect);
      return () => {
        stateListener = null;
        remote.removeEventListener('connecting', onConnecting);
        remote.removeEventListener('connect', onConnect);
        remote.removeEventListener('disconnect', onDisconnect);
      };
    },
    destroy: () => {
      if (presentationConnection) {
        try {
          presentationConnection.terminate();
        } catch {
          // Already terminated.
        }
        presentationConnection = null;
      }
    },
  };
}
