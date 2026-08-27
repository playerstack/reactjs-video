import React from 'react';

/**
 * Captions quick-toggle (parity with the original desktop `CaptionsButton` + mobile top-bar
 * captions button): toggles the active track OFF, or turns it back ON using the LAST active
 * track (remembered) or the first available. Shared by the desktop control-bar CC button and
 * the mobile top-bar button. `onCaptionChange` (wired in usePlayerSkinWrapper) sets
 * `activeCaption`, which drives `useCaptions` to fetch/parse the cues.
 *
 * Thin skin wrapper (A8b): holds the "last active track" ref, remembers it in an effect, and
 * exposes `handleCaptionToggle` that delegates to the public `onCaptionChange` callback. No
 * business timer, state machine, or non-trivial agnostic computation lives here.
 *
 * @param {object} params
 * @param {string|null} [params.activeCaption] - The currently active caption track language.
 * @param {Array<{ language?: string }>} [params.captions] - Available caption track descriptors.
 * @param {(language: string|null) => void} [params.onCaptionChange] - Public caption change callback.
 * @returns {{ handleCaptionToggle: (event?: Event) => void }}
 */
const useCaptionToggle = ({ activeCaption, captions, onCaptionChange }) => {
  const lastActiveCaptionRef = React.useRef(null);
  React.useEffect(() => {
    if (activeCaption) {
      lastActiveCaptionRef.current = activeCaption;
    }
  }, [activeCaption]);
  const handleCaptionToggle = React.useCallback(
    (event) => {
      event?.stopPropagation?.();
      if (activeCaption) {
        onCaptionChange?.(null);
      } else if (captions && captions.length > 0) {
        const lang = lastActiveCaptionRef.current || captions[0]?.language || null;
        if (lang) {
          onCaptionChange?.(lang);
        }
      }
    },
    [activeCaption, captions, onCaptionChange],
  );

  return { handleCaptionToggle };
};

export default useCaptionToggle;
