import React from 'react';
import { render, act } from '@testing-library/react';

import { COMPOSABLE_SLOTS, resolveSlotOrder } from '@playerstack/web-core/adapters/framework';

// Public entry (src/index.js) via the `@` alias — the SAME specifier the sibling entry specs use.
// `default`/`Player` is the composed root; the parts are named exports. Importing straight from the
// public surface is deliberate: this suite drives the REAL children API end-to-end.
import Player, {
  BottomBar,
  PlayButton,
  Volume,
  PlayTime,
  Timeline,
  Settings,
  Fullscreen,
  Captions,
  Source,
  Title,
} from '@';

/**
 * Task 10.1 — Integration tests for the composed `<Player>` children API, exercised END-TO-END
 * through the REAL public surface.
 *
 * Unlike `test/playerSkin/CorePlayerSkinComposition.spec.jsx` (which drives a hand-built manifest
 * straight into the orchestrator), THIS suite renders the actual `<Player>` from the package entry
 * and asserts on the emitted `playerstack-*` DOM. Everything on the composition path stays REAL and
 * is what these tests validate:
 *   - `resolveComposition` (the `React.Children` scan) — NOT stubbed,
 *   - `collectConfig` (content-prop extraction) — NOT stubbed,
 *   - `deriveEngineProps` (manifest → engine props) — NOT stubbed,
 *   - the `CompositionContext.Provider` + the whole engine render chain
 *     (`@root/engine` → `MediaPlayerSkin` → `PlayerSkin` → `CorePlayerSkin` → Desktop layout →
 *     `playerstack-*`), including the presence gating and canonical ordering.
 *
 * The ONLY things swapped out are the pieces irrelevant to composition:
 *   - `@core/VideoElement` (the heavy, async HLS/DASH/FLV `<video>` core) → a tiny synchronous
 *     probe `<div data-testid="video-element" data-url={url}>` (same technique the fixed
 *     `MediaPlayerSkinIntegration` suite uses). This also lets us OBSERVE the engine's resolved
 *     `url` for the `<Source>` migration assertion.
 *   - `@playerstack/web-core` is spread from the real module with only `isMobile` forced to `false`
 *     (deterministic DESKTOP branch, same convention as the Nav/Parity/Mode/Composition specs) and
 *     the network-speed probe stubbed so the auto-quality effect never does real I/O. The agnostic
 *     composition catalog lives at `@playerstack/web-core/adapters/framework` (a SEPARATE module),
 *     so it stays 100% real here.
 *
 * Properties covered (design.md): Property 1 & 3 (presence gating), Property 2 (content migration),
 * Property 4 (no-duplicate), Property 5 (canonical DOM order). Requirements: 1.6, 1.7, 1.8, 5.5, 6.2.
 */

// Swap ONLY the heavy async <video> engine for a synchronous probe. `useImperativeHandle` uses an
// EMPTY deps array on purpose: the composed `<Player>` renders the engine (the `MediaPlayer` class)
// which attaches its own callback ref (`references.player`) to this element; a handle recreated
// every render would change identity each render and drive `MediaPlayer.forceUpdate()` in a loop.
// A stable handle is set exactly once. The probe reflects its resolved `url` prop as `data-url` so
// the `<Source>` content-migration test can read the engine's derived source URL from the DOM.
jest.mock('@core/VideoElement', () => {
  const ReactMock = require('react');
  const MockVideoElement = ReactMock.forwardRef(function MockVideoElement(props, ref) {
    ReactMock.useImperativeHandle(
      ref,
      () => ({
        getPlayer: () => null,
        getOrchestrator: () => null,
        getEngine: () => null,
        seekTo: () => {},
        getDuration: () => null,
        getCurrentTime: () => null,
        getSecondsLoaded: () => null,
        getInternalPlayer: () => null,
        play: () => {},
        pause: () => {},
        stop: () => {},
      }),
      [],
    );
    return ReactMock.createElement('div', { 'data-testid': 'video-element', 'data-url': props.url });
  });
  MockVideoElement.displayName = 'VideoElement';
  return { __esModule: true, default: MockVideoElement };
});

// Force the deterministic DESKTOP branch (isMobile=false) and stub the network-speed probe so the
// auto-quality effect resolves immediately without real I/O. Everything else stays REAL (spread).
jest.mock('@playerstack/web-core', () => {
  const actual = jest.requireActual('@playerstack/web-core');
  return {
    ...actual,
    isMobile: false,
    measureNetworkSpeed: jest.fn().mockResolvedValue(5),
    getRecommendedVideoQuality: jest.fn().mockReturnValue(720),
  };
});

// Canonical `playerstack-*` tag for a catalog part name, read straight from the agnostic catalog
// (single source of truth) so these tests track the catalog instead of a hand-maintained map.
const elementFor = (name) => COMPOSABLE_SLOTS.find((slot) => slot.name === name).element;

/** Document-order list of the given tag names found within a region container (or [] if absent). */
function tagOrderWithin(container, regionSelector, tags) {
  const region = container.querySelector(regionSelector);
  if (!region) {
    return [];
  }
  // `querySelectorAll` returns matches in DOM (document) order regardless of the selector order.
  return Array.from(region.querySelectorAll(tags.join(','))).map((el) => el.tagName.toLowerCase());
}

describe('<Player> composed children API (end-to-end)', () => {
  // The real engine chain may emit dev-only propType/act noise; silence it CLEANLY (spied + fully
  // restored, no eslint-disable). The DOM assertions below remain the real signal.
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Property 1 / Property 3 — the composed set of elements is EXACTLY what renders (Req 1.6/1.7)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Property 1/3 — presence: only the composed parts render their playerstack-* element', () => {
    test('a BottomBar with PlayButton + Volume yields those two and NOTHING else that is gated', () => {
      const { container } = render(
        <Player url="movie.mp4" skinMode="desktop">
          <BottomBar>
            <PlayButton />
            <Volume />
          </BottomBar>
        </Player>,
      );

      // Composed parts → their elements are present.
      expect(container.querySelector('.playerstack-controls')).not.toBeNull(); // BottomBar container
      expect(container.querySelector(elementFor('PlayButton'))).not.toBeNull();
      expect(container.querySelector(elementFor('Volume'))).not.toBeNull();

      // Omitted, composition-gated parts → their elements are absent (Req 1.7). These four are gated
      // PURELY on composition presence (no extra runtime condition under these props), so their
      // absence is unambiguously due to being left out of the children.
      expect(container.querySelector(elementFor('PlayTime'))).toBeNull();
      expect(container.querySelector(elementFor('Timeline'))).toBeNull();
      expect(container.querySelector(elementFor('Settings'))).toBeNull();
      expect(container.querySelector(elementFor('Fullscreen'))).toBeNull();
    });

    test('omitting <Volume/> removes ONLY its element; the rest of the composed set stays', () => {
      const { container: withVolume } = render(
        <Player url="movie.mp4" skinMode="desktop">
          <BottomBar>
            <PlayButton />
            <Volume />
            <PlayTime />
          </BottomBar>
        </Player>,
      );
      expect(withVolume.querySelector(elementFor('Volume'))).not.toBeNull();
      expect(withVolume.querySelector(elementFor('PlayButton'))).not.toBeNull();
      expect(withVolume.querySelector(elementFor('PlayTime'))).not.toBeNull();

      const { container: withoutVolume } = render(
        <Player url="movie.mp4" skinMode="desktop">
          <BottomBar>
            <PlayButton />
            <PlayTime />
          </BottomBar>
        </Player>,
      );
      // Volume gone, its siblings untouched (Req 1.7).
      expect(withoutVolume.querySelector(elementFor('Volume'))).toBeNull();
      expect(withoutVolume.querySelector(elementFor('PlayButton'))).not.toBeNull();
      expect(withoutVolume.querySelector(elementFor('PlayTime'))).not.toBeNull();
    });

    test('the whole control bar is gated on the BottomBar container part', () => {
      // Without a <BottomBar>, the bar and every control inside it are dropped.
      const { container } = render(
        <Player url="movie.mp4" skinMode="desktop">
          <Timeline />
        </Player>,
      );
      expect(container.querySelector('.playerstack-controls')).toBeNull();
      expect(container.querySelector(elementFor('PlayButton'))).toBeNull();
      expect(container.querySelector(elementFor('Settings'))).toBeNull();
      // The standalone timeline lives OUTSIDE the bar, so it is unaffected and still renders.
      expect(container.querySelector(elementFor('Timeline'))).not.toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Property 4 — a repeated part collapses to a single element (Req 5.5)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Property 4 — no-duplicate: repeating a composable yields a single element', () => {
    test('two <Volume/> children render exactly one playerstack-volume', () => {
      const { container } = render(
        <Player url="movie.mp4" skinMode="desktop">
          <BottomBar>
            <Volume />
            <Volume />
          </BottomBar>
        </Player>,
      );
      expect(container.querySelectorAll(elementFor('Volume'))).toHaveLength(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Property 5 — canonical DOM order, INDEPENDENT of the children order (Req 1.8)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Property 5 — canonical DOM order regardless of the order children are declared', () => {
    test('scrambled bar children still emit the canonical per-region order', () => {
      // Declared order is deliberately scrambled across BOTH clusters:
      //   PlayTime, Fullscreen, Volume, Settings, PlayButton
      const { container } = render(
        <Player url="movie.mp4" skinMode="desktop">
          <BottomBar>
            <PlayTime />
            <Fullscreen />
            <Volume />
            <Settings />
            <PlayButton />
          </BottomBar>
        </Player>,
      );

      // Left cluster: canonical order PlayButton(60) → Volume(70) → PlayTime(80).
      const leftTags = ['PlayButton', 'Volume', 'PlayTime'].map(elementFor);
      expect(tagOrderWithin(container, '.playerstack-controls-left', leftTags)).toEqual(
        resolveSlotOrder(['PlayTime', 'Volume', 'PlayButton']).map(elementFor),
      );

      // Right cluster: canonical order Settings(120) → Fullscreen(140).
      const rightTags = ['Settings', 'Fullscreen'].map(elementFor);
      expect(tagOrderWithin(container, '.playerstack-controls-right', rightTags)).toEqual(
        resolveSlotOrder(['Fullscreen', 'Settings']).map(elementFor),
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Property 2 — content props migrate to their owning composable (Req 6.2)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Property 2 — content migration produces the expected observable state', () => {
    test('<Title> text reaches playerstack-title (opt-in title)', () => {
      const { container } = render(
        <Player url="movie.mp4" skinMode="desktop">
          <BottomBar>
            <PlayButton />
            <Title>The Forest</Title>
          </BottomBar>
        </Player>,
      );
      const titleEl = container.querySelector('playerstack-title');
      expect(titleEl).not.toBeNull();
      // `collectConfig` puts the children text at `config.title`; the layout renders it as the
      // element's reflected `title` attribute.
      expect(titleEl.getAttribute('title')).toBe('The Forest');
    });

    test('no <Title> → no playerstack-title (title is opt-in)', () => {
      const { container } = render(
        <Player url="movie.mp4" skinMode="desktop">
          <BottomBar>
            <PlayButton />
          </BottomBar>
        </Player>,
      );
      expect(container.querySelector('playerstack-title')).toBeNull();
    });

    test('<Captions tracks> reaches the engine → the captions overlay element renders', () => {
      const tracks = [{ src: 'en.vtt', label: 'English', language: 'en', kind: 'subtitles' }];
      const { container } = render(
        <Player url="movie.mp4" skinMode="desktop">
          <Captions tracks={tracks} />
        </Player>,
      );
      // The captions overlay mounts only when tracks exist; its presence proves the migrated tracks
      // reached the engine/skin (there is no ephemeral `captions` prop on <Player> anymore).
      expect(container.querySelector('playerstack-captions')).not.toBeNull();
    });

    test('no <Captions> → the captions overlay element does not mount', () => {
      const { container } = render(
        <Player url="movie.mp4" skinMode="desktop">
          <BottomBar>
            <PlayButton />
          </BottomBar>
        </Player>,
      );
      expect(container.querySelector('playerstack-captions')).toBeNull();
    });

    test('<Source sources> reaches the engine → the resolved <video> url comes from the source', async () => {
      const { container } = render(
        <Player url="movie.mp4" skinMode="desktop">
          <Source sources={[{ src: 'v720.mp4', resolution: 720 }]} />
        </Player>,
      );
      // Flush the auto-quality effect (measureNetworkSpeed is stubbed to resolve immediately) so the
      // pending state update settles inside `act` rather than leaking past the test.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const video = container.querySelector('[data-testid="video-element"]');
      expect(video).not.toBeNull();
      // The engine derived its playback url from the migrated <Source> (not the raw <Player url>),
      // proving the sources content reached the engine and took precedence (Req 6.2/6.6).
      expect(video.getAttribute('data-url')).toBe('v720.mp4');
    });

    test('no <Source> → the engine plays the ephemeral <Player url> unchanged', () => {
      const { container } = render(
        <Player url="movie.mp4" skinMode="desktop">
          <BottomBar>
            <PlayButton />
          </BottomBar>
        </Player>,
      );
      expect(container.querySelector('[data-testid="video-element"]').getAttribute('data-url')).toBe('movie.mp4');
    });
  });
});
