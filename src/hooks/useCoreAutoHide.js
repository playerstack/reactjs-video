import React from 'react';

import { UIController } from '@playerstack/web-core';

/**
 * Thin React wrapper over core's `UIController` for the light-DOM skin's auto-hide.
 *
 * Per the framework-agnostic-core standard, the show/hide/lock timer STATE MACHINE lives in
 * `UIController`. This hook keeps only the DOM-specific glue that core deliberately does not own:
 *   - reflecting the controller's `controlsVisibilityChange` onto the `data-hiding` attribute of
 *     the `playerstack-media-controller` host (the Style_Layer fades the chrome off that attr);
 *   - the pointer listeners (move/down/up/leave) and the mobile tap-to-toggle interactive-target
 *     detection, which read/route DOM events into the controller's `show`/`hide`/`toggle`.
 * The idle countdown, lock semantics and delay are NOT reimplemented here — they are the
 * controller's job.
 *
 * @param {object} params
 * @param {React.RefObject<HTMLElement>} params.controllerRef - The `playerstack-media-controller` host.
 * @param {boolean} params.shouldStayVisible - When true the controls never hide (locks the controller).
 * @param {number} [params.delay=3000] - Idle milliseconds before hiding.
 * @param {boolean} [params.tapToToggle=false] - Mobile: a clean tap on a non-interactive area hides.
 */
export function useCoreAutoHide({ controllerRef, shouldStayVisible, delay = 3000, tapToToggle = false }) {
  const stayVisibleRef = React.useRef(shouldStayVisible);
  stayVisibleRef.current = shouldStayVisible;
  const tapToToggleRef = React.useRef(tapToToggle);
  tapToToggleRef.current = tapToToggle;

  // Hold the core UIController instance for this mount.
  const uiRef = React.useRef(null);

  React.useEffect(() => {
    const host = controllerRef.current;
    if (!host) {
      return undefined;
    }

    // Core owns the timer state machine; the skin only reflects visibility onto `data-hiding`.
    const ui = new UIController({ hideDelay: delay });
    uiRef.current = ui;
    const reflect = (visible) => {
      if (visible) {
        host.removeAttribute('data-hiding');
      } else {
        host.setAttribute('data-hiding', 'true');
      }
    };
    ui.on('controlsVisibilityChange', reflect);

    // Forced-visible states lock the controller (pause the timer, stay visible).
    if (stayVisibleRef.current) {
      ui.lock();
    } else {
      ui.show();
    }

    // The vertical volume slider reveals a column that FLOATS above the control bar (over the
    // video). While the pointer is on the volume control OR the slider is being dragged, the idle
    // auto-hide timer must NOT run — otherwise the chrome fades out mid-travel and the column snaps
    // shut before the pointer reaches it. `isVolumeEngaged` detects either the hovered volume
    // (`playerstack-volume:hover`) or an actively-sliding one (`[data-sliding]`); when engaged we
    // LOCK the controller (pause the timer, stay visible) instead of restarting a countdown.
    const isVolumeEngaged = () =>
      host.querySelector('playerstack-volume:hover, playerstack-volume[data-sliding]') !== null;

    // Any pointer activity reveals + restarts the countdown (unless locked or the volume is
    // engaged, in which case we lock so the slider stays reachable/open).
    const onActivity = () => {
      if (stayVisibleRef.current || isVolumeEngaged()) {
        ui.lock();
      } else {
        ui.show();
      }
    };

    // Leaving the player hides immediately (unless forced visible, in tap-to-toggle mode, or the
    // volume is still engaged — a pointer that left the host box but is over the floating volume
    // column must not hide the chrome).
    const onLeave = () => {
      if (!stayVisibleRef.current && !tapToToggle && !isVolumeEngaged()) ui.hide();
    };

    // Mobile tap-to-toggle: a clean tap on a NON-interactive area toggles the chrome.
    let downX = 0;
    let downY = 0;
    let downTime = 0;
    const INTERACTIVE =
      'button, a, input, [part$="-button"], [part="slider"], [part="time-slider"], [part="mobile-center-controls"], [part="mobile-top-bar"], [part="mobile-bottom-bar"], [part*="menu"], [part*="settings"], playerstack-time-slider, playerstack-live-indicator';
    const isInteractiveTarget = (target) => {
      if (!(target instanceof Element)) return false;
      return target.closest(INTERACTIVE) !== null;
    };
    const onPointerDown = (event) => {
      downX = event.clientX;
      downY = event.clientY;
      downTime = Date.now();
      // Desktop: reveal on any pointer activity. Mobile (tapToToggle): don't reveal on down —
      // the toggle decision happens on pointerup to avoid show+hide flash.
      if (!tapToToggle) {
        onActivity();
      }
    };
    const onPointerUp = (event) => {
      if (!tapToToggle) return;
      const moved = Math.abs(event.clientX - downX) + Math.abs(event.clientY - downY);
      const quick = Date.now() - downTime < 400;
      if (quick && moved < 15 && !isInteractiveTarget(event.target)) {
        // Clean tap on non-interactive area: toggle controls via the controller's toggle().
        ui.toggle();
      }
    };

    // Desktop: pointermove reveals controls (hover). Mobile (tapToToggle): skip pointermove
    // reveals — visibility is toggled exclusively by the tap logic in pointerup.
    const onPointerMove = () => {
      if (!tapToToggle) onActivity();
    };
    // When the pointer leaves the volume control (so it is no longer engaged), resume the normal
    // auto-hide countdown that was paused by the lock — otherwise the chrome would stay pinned
    // open forever after using the slider even if the pointer then rests elsewhere/idle.
    const onPointerOut = (event) => {
      if (tapToToggle || stayVisibleRef.current) {
        return;
      }
      const from = event.target;
      const leftVolume = from instanceof Element && from.closest('playerstack-volume') !== null;
      if (leftVolume && !isVolumeEngaged()) {
        ui.unlock(); // clear the volume-engaged lock and restart the idle timer (normal auto-hide)
      }
    };
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('pointerup', onPointerUp);
    host.addEventListener('pointerout', onPointerOut);
    host.addEventListener('pointerleave', onLeave);

    return () => {
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('pointerup', onPointerUp);
      host.removeEventListener('pointerout', onPointerOut);
      host.removeEventListener('pointerleave', onLeave);
      ui.destroy();
      uiRef.current = null;
      // Leave the chrome visible on unmount so a remount never starts hidden.
      host.removeAttribute('data-hiding');
    };
  }, [controllerRef, delay, tapToToggle]);

  // React to forced-visible changes: lock when must stay visible, resume (show + countdown) when
  // it clears — delegating to the controller's lock/unlock.
  React.useEffect(() => {
    const ui = uiRef.current;
    if (!ui) return;
    if (shouldStayVisible) {
      ui.lock();
    } else {
      ui.unlock();
    }
  }, [shouldStayVisible]);
}
