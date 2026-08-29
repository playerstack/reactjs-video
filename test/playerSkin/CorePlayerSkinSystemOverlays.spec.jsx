import React from 'react';
import { render, act } from '@testing-library/react';

import CorePlayerSkin from '@PlayerSkin/CorePlayerSkin';
import PlayerSkinWrapper from '@PlayerSkin/index';
import { Provider } from '@context/index';
import { CompositionContext } from '@compound/context/CompositionContext';

/**
 * Task 11.2 — System overlays, keyboard shortcuts and auto-hide are PRESERVED under the composed
 * API WITHOUT requiring composition (Req 9.6, 9.7, 9.8 · Design Property 10).
 *
 * The composition manifest controls the BAR + center overlay + poster + captions (presence
 * gating, task 8.2/8.3). This suite proves the OTHER half of the contract: the system overlays
 * and the engine-level behaviors keep working regardless of which composables the author lists.
 *
 *   • Req 9.6 — `PreventedTip`, `Spinner`, `TopState`, `AdOverlay`, `LiveAdOverlay`, `ContextMenu`,
 *     `DoubleTap`, `SpritePreview`, `LiveIndicator` are NOT composables (none appear in
 *     `COMPOSABLE_SLOTS`/`manifest.parts`). They stay driven by the EPHEMERAL props on `<Player>`
 *     (`prevented`, buffering, `ads`, `live`, `spriteVTTFile`, …), so we render with an EMPTY
 *     composition (`parts: new Set()`) and assert they still render/activate.
 *   • Req 9.7 — keyboard shortcuts run through the engine hook (`usePlayerSkinWrapper.handleKeyDown`),
 *     not through composition, so they work with an empty manifest too.
 *   • Req 9.8 — auto-hide is wired by the orchestrator via Core's `UIController` regardless of
 *     composition; it hides after the idle delay when playing and stays locked when paused.
 *
 * Render approach mirrors `CorePlayerSkinComposition.spec.jsx` / `CorePlayerSkinParity.spec.jsx`:
 * render `CorePlayerSkin` directly wrapped in the skin UI `Provider` (`@context/index`) AND a
 * `CompositionContext.Provider` supplying the manifest. Passing `parts: new Set()` here is exactly
 * what a `<Player>` children-scan would yield for a composition that lists none of the composables
 * that these system overlays would (not) map to — the overlays are gated purely by ephemeral state.
 */

// Keep the skin in DESKTOP mode by default (isMobile=false) so the desktop branch is exercised
// deterministically regardless of the test env's UA — same convention as the sibling specs. The
// mobile-only overlays (DoubleTap, LiveIndicator's mobile home) are driven via `skinMode="mobile"`.
jest.mock('@playerstack/web-core', () => {
  const actual = jest.requireActual('@playerstack/web-core');
  return {
    ...actual,
    isMobile: false,
  };
});

const Wrapper = ({ children }) => <Provider language="en">{children}</Provider>;

// Minimal props required by CorePlayerSkin's bridge + render paths (mirrors CorePlayerSkinNav /
// CorePlayerSkinComposition). Idle/paused baseline so nothing is "buffering" and no ad/live is on.
const baseProps = {
  live: false,
  liveDVR: false,
  loading: false,
  paused: true,
  ended: false,
  seeking: false,
  waiting: false,
  duration: 100,
  bufferedRanges: [],
  currentTime: 0,
  muted: false,
  volume: 1,
  pip: false,
  fullscreen: false,
  qualities: [],
  captions: [],
  activeCaption: undefined,
  chapters: [],
  heatmapData: [],
  playbackRate: 1,
  playbackQuality: 0,
  loop: false,
  language: 'en',
  ads: null,
  kernelMsg: null,
  skinMode: 'desktop',
};

// A representative ad config (same shape the parity/nav specs use).
const AD = {
  title: 'Ad',
  url: 'https://example.com',
  buttonText: 'Learn more',
  skipAfter: 5,
  onSkip: () => {},
  onAdClick: () => {},
};

/**
 * Render `CorePlayerSkin` with an EMPTY composition by default (`parts: new Set(parts)` with
 * `parts = []`). The empty manifest proves the system overlays below do NOT depend on any
 * composable — they render/activate from the ephemeral playback props alone (Req 9.6). Pass
 * `parts` only where a control-bar container is needed to reach a nested overlay.
 */
function renderSkin(extraProps = {}, parts = []) {
  const manifest = { mode: 'custom', parts: new Set(parts), config: {}, order: [] };
  return render(
    <Wrapper>
      <CompositionContext.Provider value={{ manifest }}>
        <CorePlayerSkin {...baseProps} {...extraProps} />
      </CompositionContext.Provider>
    </Wrapper>,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Req 9.6 — system overlays are driven by ephemeral props, NOT by composition
// ─────────────────────────────────────────────────────────────────────────────
describe('System overlays render without any composable (empty composition) — Req 9.6', () => {
  test('the always-present stage overlays render even with an EMPTY composition', () => {
    const { container } = renderSkin(); // parts = [] → no composables at all

    // Sanity: with an empty manifest NO composition-gated element renders — so the overlays
    // asserted below cannot be coming from a composable, only from the ephemeral-prop path.
    expect(container.querySelector('.playerstack-controls')).toBeNull(); // BottomBar gated off
    expect(container.querySelector('playerstack-play-button')).toBeNull();
    expect(container.querySelector('playerstack-time-slider')).toBeNull();
    expect(container.querySelector('playerstack-settings')).toBeNull();

    // The system overlays are still present (they live outside the gated clusters).
    expect(container.querySelector('playerstack-prevented-tip')).not.toBeNull();
    expect(container.querySelector('playerstack-spinner')).not.toBeNull();
    expect(container.querySelector('playerstack-top-state')).not.toBeNull();
    expect(container.querySelector('playerstack-context-menu')).not.toBeNull();
  });

  test('`prevented` ephemeral prop ACTIVATES the prevented-tip (data-active), no composable needed', () => {
    // Baseline: not prevented → the tip element exists but is inactive.
    const { container: idle } = renderSkin({ prevented: false });
    const idleTip = idle.querySelector('playerstack-prevented-tip');
    expect(idleTip).not.toBeNull();
    expect(idleTip.getAttribute('data-active')).toBe('false');

    // Stuck condition (hasResource && prevented && currentTime===0 && paused) → tip activates.
    const { container: blocked } = renderSkin({
      prevented: true,
      hasResource: true,
      paused: true,
      currentTime: 0,
    });
    const blockedTip = blocked.querySelector('playerstack-prevented-tip');
    expect(blockedTip.getAttribute('data-active')).toBe('true');
    expect(blockedTip.getAttribute('data-mode')).toBe('stuck');
  });

  test('buffering ephemeral state ACTIVATES the spinner (data-active), no composable needed', () => {
    // Baseline: paused & idle → spinner inactive.
    const { container: idle } = renderSkin({ waiting: false, paused: true });
    expect(idle.querySelector('playerstack-spinner').getAttribute('data-active')).toBe('false');

    // Waiting while playing → computeSpinnerActive true → bridge sets isBuffering → spinner active.
    const { container: buffering } = renderSkin({ waiting: true, paused: false });
    expect(buffering.querySelector('playerstack-spinner').getAttribute('data-active')).toBe('true');
  });

  test('`ads` ephemeral prop drives the ad-overlay presence, no composable needed', () => {
    const { container: withAd } = renderSkin({ ads: AD });
    expect(withAd.querySelector('playerstack-ad-overlay')).not.toBeNull();

    const { container: withoutAd } = renderSkin({ ads: null });
    expect(withoutAd.querySelector('playerstack-ad-overlay')).toBeNull();
  });

  test('`live` ephemeral prop drives the live-ad overlay presence, no composable needed', () => {
    // The live-stream ad-break overlay sits over the live stream; it renders on the unified live
    // flag (live || liveDVR). The `liveAd` config only supplies its trigger.
    const { container: liveOn } = renderSkin({ live: true });
    expect(liveOn.querySelector('playerstack-live-ad')).not.toBeNull();

    const { container: liveOff } = renderSkin({ live: false });
    expect(liveOff.querySelector('playerstack-live-ad')).toBeNull();
  });

  test('`spriteVTTFile` ephemeral prop drives the sprite-preview presence, no composable needed', () => {
    const { container: withSprite } = renderSkin({ spriteVTTFile: 'sprite.vtt' });
    expect(withSprite.querySelector('playerstack-sprite-preview')).not.toBeNull();

    const { container: withoutSprite } = renderSkin({ spriteVTTFile: undefined });
    expect(withoutSprite.querySelector('playerstack-sprite-preview')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 9.6 — mobile-only system overlays (double-tap, live-indicator) without composition
// ─────────────────────────────────────────────────────────────────────────────
describe('Mobile system overlays render without any composable (empty composition) — Req 9.6', () => {
  test('the double-tap zones render on mobile from ephemeral state (no ad), no composable needed', () => {
    // No ad present → double-tap skip zones are enabled.
    const { container: withoutAd } = renderSkin({ skinMode: 'mobile', ads: null });
    expect(withoutAd.querySelector('playerstack-double-tap')).not.toBeNull();

    // Ad present → double-tap is disabled so the banner/skip stay clickable (ephemeral-driven).
    const { container: withAd } = renderSkin({ skinMode: 'mobile', ads: AD });
    expect(withAd.querySelector('playerstack-double-tap')).toBeNull();
  });

  test('the live-indicator renders on mobile from the `live` prop, no composable needed', () => {
    // On mobile the LIVE badge lives in the always-rendered MobileBottomBar (not a gated cluster),
    // so an empty composition still shows it when `live` is set.
    const { container: liveOn } = renderSkin({ skinMode: 'mobile', live: true });
    expect(liveOn.querySelector('playerstack-live-indicator')).not.toBeNull();

    const { container: liveOff } = renderSkin({ skinMode: 'mobile', live: false });
    expect(liveOff.querySelector('playerstack-live-indicator')).toBeNull();
  });

  test('prevented-tip / spinner / context-menu are also present on mobile with an empty composition', () => {
    const { container } = renderSkin({ skinMode: 'mobile' });
    expect(container.querySelector('playerstack-prevented-tip')).not.toBeNull();
    expect(container.querySelector('playerstack-spinner')).not.toBeNull();
    expect(container.querySelector('playerstack-context-menu')).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 9.7 — keyboard shortcuts remain active without composition
// ─────────────────────────────────────────────────────────────────────────────
//
// Full keyboard simulation (every shortcut) is covered in CorePlayerSkinParity.spec.jsx under a
// DEFAULT_COMPOSITION manifest. Here we add the FOCUSED reachability assertion for Req 9.7's
// "without composition": render the wrapper with an EMPTY manifest and prove the engine-level
// handler still runs its shortcuts. The keyboard handler lives in `usePlayerSkinWrapper`
// (engine), so it is independent of which composables are present.
describe('Keyboard shortcuts remain active with an EMPTY composition — Req 9.7', () => {
  const makeMediaEl = (volume = 0.8, muted = false) => {
    const el = document.createElement('video');
    Object.defineProperty(el, 'volume', { value: volume, writable: true });
    Object.defineProperty(el, 'muted', { value: muted, writable: true });
    return el;
  };

  const makePlayer = (mediaEl) => ({
    seekTo: jest.fn(),
    getCurrentTime: jest.fn(() => 30),
    getDuration: jest.fn(() => 120),
    getPlayer: jest.fn(() => mediaEl),
  });

  const wrapperBaseProps = {
    url: 'test.mp4',
    sources: [],
    hasAudio: true,
    live: false,
    language: 'en',
    hasResource: true,
    loading: false,
    prevented: false,
    paused: true,
    ended: false,
    seeking: false,
    waiting: false,
    duration: 120,
    currentTime: 30,
    muted: false,
    volume: 0.8,
    playbackRate: 1,
    pictureInPictureEnabled: true,
    pip: false,
    fullscreen: false,
    loop: false,
    poster: '',
    kernelMsg: null,
    skinMode: 'desktop',
  };

  const makeKeyEvent = (key, keyCode) => ({
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    key,
    keyCode,
    which: keyCode,
  });

  function renderWrapper() {
    const mediaEl = makeMediaEl();
    const player = makePlayer(mediaEl);
    const playerRef = { current: document.createElement('div') };
    playerRef.current.requestFullscreen = jest.fn(() => Promise.resolve());
    const updateState = jest.fn();
    const handleRef = React.createRef();
    // EMPTY composition manifest: PlayerSkinWrapper → CorePlayerSkin reads `useComposition()`, so a
    // CompositionContext ancestor is required, but NO composable parts are present — proving the
    // keyboard path does not depend on composition. PlayerSkinWrapper provides the UI `Provider`
    // internally, so we only supply the CompositionContext here.
    const manifest = { mode: 'custom', parts: new Set(), config: {}, order: [] };
    render(
      <CompositionContext.Provider value={{ manifest }}>
        <PlayerSkinWrapper
          {...wrapperBaseProps}
          ref={handleRef}
          player={player}
          playerRef={playerRef}
          updateState={updateState}
        />
      </CompositionContext.Provider>,
    );
    return { handleRef, playerRef, updateState };
  }

  test('Space toggles play/pause via the engine handler (no composition)', () => {
    const { handleRef, updateState } = renderWrapper();
    act(() => handleRef.current.handleKeyDown(makeKeyEvent(' ', 32)));
    expect(updateState).toHaveBeenCalled();
    const updater = updateState.mock.calls[0][0];
    expect(updater({ playing: false })).toMatchObject({ playing: true });
    expect(updater({ playing: true })).toMatchObject({ playing: false });
  });

  test('F requests fullscreen on the player container via the engine handler (no composition)', () => {
    const { handleRef, playerRef } = renderWrapper();
    act(() => handleRef.current.handleKeyDown(makeKeyEvent('f', 70)));
    expect(playerRef.current.requestFullscreen).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 9.8 — auto-hide remains active without composition
// ─────────────────────────────────────────────────────────────────────────────
//
// Auto-hide is wired by the orchestrator via Core's `UIController` (a setTimeout-based idle
// timer) regardless of composition. We drive it with an EMPTY manifest and use fake timers to
// observe the `data-hiding` attribute the hook reflects onto the media-controller host.
describe('Auto-hide remains active via the engine UIController, with an EMPTY composition — Req 9.8', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const controllerOf = (container) => container.querySelector('playerstack-media-controller');

  test('while playing (nothing forces visibility), controls auto-hide after the idle delay', () => {
    // Playing with no visible-forcing state → computeShouldStayVisible is false → the UIController
    // starts its idle countdown. Empty composition ⇒ auto-hide is NOT driven by any composable.
    const { container } = renderSkin({
      paused: false,
      waiting: false,
      seeking: false,
      loading: false,
      ended: false,
      prevented: false,
    });
    const controller = controllerOf(container);

    // Visible immediately after mount (the hook removes/omits `data-hiding` while visible).
    expect(controller.getAttribute('data-hiding')).toBeNull();

    // Advance past the 3s idle delay → the Core UIController hides the chrome and the hook
    // reflects it onto the host.
    act(() => {
      jest.advanceTimersByTime(3100);
    });
    expect(controller.getAttribute('data-hiding')).toBe('true');
  });

  test('while paused (a forced-visible state), controls stay locked-visible past the idle delay', () => {
    // Paused → computeShouldStayVisible true → the controller is locked; the timer never hides it.
    const { container } = renderSkin({ paused: true });
    const controller = controllerOf(container);

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(controller.getAttribute('data-hiding')).toBeNull();
  });
});
