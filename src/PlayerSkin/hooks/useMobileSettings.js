import React from 'react';

/**
 * Mobile settings panel opener. The full-surface settings panel is a Core UI element
 * (`playerstack-mobile-settings`) that owns its own open/close behaviour via the imperative
 * `open_` method on the element instance. The skin only holds a ref to that element so the
 * mobile top-bar gear button can open it.
 *
 * Thin skin wrapper: ref + delegation only. `openMobileSettings` optional-chains into the
 * current ref target and calls its `open_` method. No state, no timers, no computation.
 */
const useMobileSettings = () => {
  // Imperative handle to the mobile settings panel element so the top-bar gear can open it.
  const mobileSettingsRef = React.useRef(null);
  const openMobileSettings = React.useCallback(() => {
    mobileSettingsRef.current?.open_?.();
  }, []);

  return { mobileSettingsRef, openMobileSettings };
};

export default useMobileSettings;
