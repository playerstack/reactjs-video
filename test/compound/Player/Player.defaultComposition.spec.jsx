import React from 'react';
import { render } from '@testing-library/react';

// Agnostic composition catalog (Core, no React): the default set + the full slot catalog. The
// "nothing outside the default set" assertion is DERIVED from `COMPOSABLE_SLOTS` (not a hardcoded
// list) so it stays correct if the default set ever changes (Req 7.3).
import { DEFAULT_COMPOSITION, COMPOSABLE_SLOTS } from '@playerstack/web-core/adapters/framework';

// The composed public root: the DEFAULT export of the package entry, resolved through `@` — the
// same specifier the sibling entry spec (`index.spec.jsx`) uses. Task 10.2 renders a BARE
// `<Player url=… />` with NO children and asserts it resolves to `DEFAULT_COMPOSITION` and renders
// EXACTLY that set of `playerstack-*` elements — nothing outside it — in canonical order
// (Req 7.1/7.2/7.3, Design Property 3).
import Player from '@';

// The composition manifests the (mocked) engine reads via the REAL `useComposition()` from the
// REAL Context the real `<Player>` provides — recorded in render order. Named with the `mock`
// prefix so it may be referenced from the hoisted `jest.mock` factory.
const mockManifestRecords = [];

/**
 * Swap ONLY the heavy async `<video>` playback engine (`@root/engine` = createMediaPlayer(...),
 * whose lazy VideoElement mount sits behind a Suspense boundary that is unreliable to drive
 * synchronously in jsdom) for a lightweight probe. Everything that DETERMINES the composition
 * stays REAL and is genuinely exercised here: the real `<Player>` runs the real `resolveComposition`
 * (children == null → DEFAULT_COMPOSITION) and `deriveEngineProps`, and provides the real manifest
 * through the real `CompositionContext`.
 *
 * The probe renders the REAL skin orchestrator (`CorePlayerSkin`) wrapped in the skin UI `Provider`
 * — mirroring `test/playerSkin/CorePlayerSkinComposition.spec.jsx` — so the ACTUAL `playerstack-*`
 * DOM is produced and gated PURELY by that real manifest (which `CorePlayerSkin` reads via
 * `useComposition`). This is the hybrid of the two reference specs: the real composed `<Player>`
 * (from `index.spec.jsx`) feeding the real skin/layout DOM (from `CorePlayerSkinComposition.spec.jsx`).
 */
jest.mock('@root/engine', () => {
  const ReactLib = require('react');
  const { useComposition } = require('@compound/context/useComposition');
  const { Provider } = require('@context/index');
  const CorePlayerSkin = require('@PlayerSkin/CorePlayerSkin').default;

  // Minimal internal playback state `CorePlayerSkin` needs to render deterministically in DESKTOP
  // mode (mirrors `CorePlayerSkinComposition.spec.jsx`). In production the real `MediaPlayerSkin`
  // owns this state; here it is fixed scaffolding — NOT what this spec asserts. The spec asserts the
  // COMPOSITION (which parts render), which is driven solely by the manifest from the real
  // `<Player>`. `live: false` keeps the Timeline's time-slider shown; empty captions/qualities and
  // no cast support keep the runtime-gated affordances (Cast/CaptionsToggle/Captions) hidden so only
  // the composition-driven default controls are asserted.
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

  return {
    __esModule: true,
    default: ReactLib.forwardRef(function MockPlayerEngine() {
      // Record the manifest the REAL `<Player>` resolved and provided, proving the
      // default-composition branch (children == null → DEFAULT_COMPOSITION) genuinely ran through
      // the composed root — not a manually-constructed manifest.
      mockManifestRecords.push(useComposition().manifest);
      // Render the REAL skin so the actual `playerstack-*` DOM is emitted and gated by that manifest.
      return ReactLib.createElement(Provider, { language: 'en' }, ReactLib.createElement(CorePlayerSkin, baseProps));
    }),
  };
});

// Keep the skin in DESKTOP mode regardless of the test env UA (isMobile mocked false), the same
// convention as the CorePlayerSkinComposition/Nav/Parity/Mode specs. Only `isMobile` is overridden;
// the rest of core — and the separate `/adapters/framework` subpath imported above — keep their real
// implementations.
jest.mock('@playerstack/web-core', () => {
  const actual = jest.requireActual('@playerstack/web-core');
  return { ...actual, isMobile: false };
});

/** Document-order list of the given tag names found within a region container (or [] if absent). */
function tagOrderWithin(container, regionSelector, tags) {
  const region = container.querySelector(regionSelector);
  if (!region) {
    return [];
  }
  // `querySelectorAll` returns matches in DOM (document) order regardless of selector order.
  return Array.from(region.querySelectorAll(tags.join(','))).map((el) => el.tagName.toLowerCase());
}

// Desktop `playerstack-*` elements the layout emits for each DEFAULT_COMPOSITION part that maps to a
// Custom Element and renders under `baseProps` (no extra runtime condition). `Poster`/`BottomBar`/
// `CaptionsToggle`/`Cast` map to `null`/skin `<button>`s; `Captions` is runtime-gated (empty tracks)
// — none are asserted as elements here.
const DEFAULT_ELEMENT = {
  PlayOverlay: 'playerstack-play-state',
  PlayButton: 'playerstack-play-button',
  Volume: 'playerstack-volume',
  PlayTime: 'playerstack-play-time',
  Timeline: 'playerstack-time-slider',
  Settings: 'playerstack-settings',
  Fullscreen: 'playerstack-fullscreen-button',
};

// Validates Requirements 7.1, 7.2, 7.3 (Design: Correctness Property 3).
describe('<Player url=… /> with NO children renders the default composition (Req 7.1/7.2/7.3, Property 3)', () => {
  beforeEach(() => {
    // Each test renders fresh; reset the render log so a test reads only its own records.
    mockManifestRecords.length = 0;
  });

  // ── Req 7.1 — a bare `<Player>` resolves to the DEFAULT manifest ────────────────────────────────
  describe('resolves to the default manifest (Req 7.1)', () => {
    test('mode="default", parts = DEFAULT_COMPOSITION, empty config and order', () => {
      render(<Player url="movie.mp4" />);

      const manifest = mockManifestRecords[mockManifestRecords.length - 1];
      expect(manifest).toBeDefined();
      // `mode` is the informative default flag (children == null).
      expect(manifest.mode).toBe('default');
      // `parts` is a de-duplicated Set equal to exactly the DEFAULT_COMPOSITION names.
      expect(manifest.parts).toBeInstanceOf(Set);
      expect([...manifest.parts].sort()).toEqual([...DEFAULT_COMPOSITION].sort());
      // No content config and no author-declared order for a childless Player.
      expect(manifest.config).toEqual({});
      expect(manifest.order).toEqual([]);
    });
  });

  // ── Req 7.2 — renders EXACTLY the DEFAULT_COMPOSITION control set, in canonical order ────────────
  describe('renders exactly the DEFAULT_COMPOSITION control set (Req 7.2, Property 3)', () => {
    test('mounts the composed root controller and the control bar', () => {
      const { container } = render(<Player url="movie.mp4" />);
      // `Player` → the root controller host; `BottomBar` → the `.playerstack-controls` bar.
      expect(container.querySelector('playerstack-media-controller')).not.toBeNull();
      expect(container.querySelector('.playerstack-controls')).not.toBeNull();
    });

    test('renders the default control-set elements (play-button, volume, play-time, time-slider, settings, fullscreen-button, play-state)', () => {
      const { container } = render(<Player url="movie.mp4" />);
      Object.entries(DEFAULT_ELEMENT).forEach(([part, tag]) => {
        // Every default part that maps to a Custom Element renders under bare base props.
        expect(container.querySelector(tag)).not.toBeNull();
        // Sanity: each asserted part is genuinely part of the default set.
        expect(DEFAULT_COMPOSITION).toContain(part);
      });
    });

    test('renders the control-bar clusters in canonical order, independent of catalog list order', () => {
      const { container } = render(<Player url="movie.mp4" />);
      // control-bar-left: play-button (60) → volume (70) → play-time (80).
      expect(
        tagOrderWithin(container, '.playerstack-controls-left', [
          DEFAULT_ELEMENT.PlayButton,
          DEFAULT_ELEMENT.Volume,
          DEFAULT_ELEMENT.PlayTime,
        ]),
      ).toEqual(['playerstack-play-button', 'playerstack-volume', 'playerstack-play-time']);
      // control-bar-right: settings (120) → fullscreen-button (140).
      expect(
        tagOrderWithin(container, '.playerstack-controls-right', [
          DEFAULT_ELEMENT.Settings,
          DEFAULT_ELEMENT.Fullscreen,
        ]),
      ).toEqual(['playerstack-settings', 'playerstack-fullscreen-button']);
    });
  });

  // ── Req 7.3 — renders NOTHING outside the default set ───────────────────────────────────────────
  describe('renders nothing outside DEFAULT_COMPOSITION (Req 7.3, Property 3)', () => {
    test('no composable part whose element is NOT in the default set appears (derived from the catalog)', () => {
      const { container } = render(<Player url="movie.mp4" />);

      // Every catalog slot that maps to a real `playerstack-*` element but is NOT part of
      // DEFAULT_COMPOSITION. Derived from `COMPOSABLE_SLOTS` so the assertion tracks the catalog if
      // the default set ever changes (Req 7.3).
      const nonDefaultElementTags = COMPOSABLE_SLOTS.filter(
        (slot) => slot.element && !DEFAULT_COMPOSITION.includes(slot.name),
      ).map((slot) => slot.element);

      // Sanity: the catalog currently exposes at least one opt-in element part, so the loop below is
      // meaningful (not vacuously true). Today that is `Title`.
      expect(nonDefaultElementTags).toContain('playerstack-title');

      nonDefaultElementTags.forEach((tag) => {
        expect(container.querySelector(tag)).toBeNull();
      });
    });

    test('opt-in parts PrevButton, NextButton and Title are absent by element name', () => {
      const { container } = render(<Player url="movie.mp4" />);
      // `PrevButton`/`NextButton` are opt-in (`inDefault: false`) → nav-buttons must not render.
      expect(container.querySelector('playerstack-nav-buttons')).toBeNull();
      // `Title` is opt-in (`inDefault: false`); its `playerstack-title` element is not rendered here.
      expect(container.querySelector('playerstack-title')).toBeNull();
    });
  });
});
