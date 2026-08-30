import React from 'react';
import { render } from '@testing-library/react';

import { DEFAULT_COMPOSITION } from '@playerstack/web-core/adapters/framework';

// Public compound API surface — imported from the package entry (`src/index.js`) through the `@`
// alias, exactly as a consumer would (`import Player, { Poster, ... } from '@playerstack/reactjs-video'`).
import Player, {
  Source,
  Poster,
  Captions,
  Timeline,
  Chapters,
  Heatmap,
  PrevButton,
  NextButton,
  BottomBar,
  PlayButton,
  Volume,
  PlayTime,
  Title,
  Settings,
  Cast,
  Fullscreen,
  PlayOverlay,
} from '@';

/**
 * Task 11.1 — Feature ACTIVATION reachability through the composed public API (Property 10 / VS9).
 *
 * This is the "level (a)" of the two-level reachability strategy: it drives the REAL `<Player>`
 * root — the real `resolveComposition` (children scan), `collectConfig`, `deriveEngineProps`,
 * memoization and the `CompositionContext.Provider` all run unchanged — and only swaps the leaf
 * PLAYBACK ENGINE for a synchronous probe that RECORDS the props it receives. In production this
 * engine is the single funnel every feature flows through (it renders `MediaPlayerSkin` →
 * `CorePlayerSkin` → the layouts), so asserting what reaches the engine proves each feature is
 * ACTIVATABLE through the new API:
 *
 *   • Req 9.3 — a feature-activation EPHEMERAL prop on `<Player>` (`ads`, `live`, `liveDVR`,
 *     `liveAd`, `prevented`, `pip`, …) propagates to the engine untouched.
 *   • Req 9.4 — including a content COMPOSABLE (`<Poster>`, `<Captions>`, `<Timeline>`,
 *     `<Chapters>`, `<Heatmap>`, `<Source>`, `<PrevButton>`, `<NextButton>`) activates its
 *     feature: the migrated content reaches the engine under the downstream name (and
 *     `<PrevButton>`/`<NextButton>` presence flips `showNavButtons`).
 *   • Req 9.5 — OMITTING a composable keeps its feature inactive: the corresponding engine input
 *     is absent (and `showNavButtons` is `false`).
 *   • Req 9.1/9.2 — no feature is unreachable: every public composable is exported and, when
 *     composed, reaches the engine (a single "kitchen-sink" composition activates them all).
 *
 * The observable DOM/`data-*`/handler behavior each of these inputs then produces is covered at
 * "level (b)" by `Player.features.behavior.spec.jsx` (rendered through the orchestrator), and the
 * deeper per-feature behavior is covered by the existing feature specs referenced there.
 *
 * NOTE on defaults: the mock engine does NOT apply the real `MediaPlayer.defaultProps` (those live
 * on the real engine class). So an INACTIVE feature's content key reads `undefined` here — which is
 * exactly what makes the Req 9.5 "absent input" assertions meaningful and unambiguous.
 */

// Props the mock engine received, most-recent last. `mock`-prefixed so the jest.mock factory may
// reference it (jest allows out-of-scope variables prefixed with `mock`).
const mockEngineProps = [];

jest.mock('@root/engine', () => {
  const ReactLib = require('react');
  return {
    __esModule: true,
    // A plain (non-memoized) forwardRef component: it re-renders on every `<Player>` render and
    // records the exact engine props `deriveEngineProps` produced. Returns null (no DOM needed —
    // this suite asserts INPUTS, not output; output is the behavior spec's job). It declares the
    // `(props, ref)` arity the real engine has (Player forwards its ref here) and consumes the ref
    // via a no-op imperative handle so React emits no "forgot the ref parameter" warning.
    default: ReactLib.forwardRef(function MockPlayerEngine(props, ref) {
      mockEngineProps.push(props);
      ReactLib.useImperativeHandle(ref, () => ({}));
      return null;
    }),
  };
});

/** Mount a `<Player>` tree and return the props the engine received on the last render. */
function captureEngineProps(ui) {
  render(ui);
  return mockEngineProps[mockEngineProps.length - 1];
}

// Representative content fixtures matching each composable's declared propTypes (so no PropTypes
// warning is emitted while composing them).
const SOURCES = [{ src: 'movie-720.mp4', resolution: 720 }];
const TRACKS = [{ src: 'en.vtt', label: 'English', language: 'en' }];
const CHAPTERS = [{ title: 'Intro', startTime: 0 }];
const HEATMAP = [{ startTime: 0, endTime: 10, value: 1 }];

beforeEach(() => {
  mockEngineProps.length = 0;
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 9.3 — feature activation by EPHEMERAL prop propagates to the engine
// ─────────────────────────────────────────────────────────────────────────────
describe('Req 9.3 — ephemeral feature-activation props propagate to the engine', () => {
  test('ads / live / liveDVR / liveAd / prevented / pip pass through <Player> unchanged', () => {
    const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Learn more', skipAfter: 5 };
    const liveAd = { at: 30 };

    const props = captureEngineProps(<Player url="movie.m3u8" ads={ads} live liveDVR liveAd={liveAd} prevented pip />);

    // Each feature flag/object the consumer set on <Player> reaches the engine verbatim, so the
    // engine can activate ads, live/live-DVR mode, the live-ad break, the prevented tip and PiP.
    expect(props.url).toBe('movie.m3u8');
    expect(props.ads).toBe(ads);
    expect(props.live).toBe(true);
    expect(props.liveDVR).toBe(true);
    expect(props.liveAd).toBe(liveAd);
    expect(props.prevented).toBe(true);
    expect(props.pip).toBe(true);
  });

  test('lifecycle callbacks (onEnablePIP/onDisablePIP) also propagate to the engine', () => {
    const onEnablePIP = jest.fn();
    const onDisablePIP = jest.fn();
    const props = captureEngineProps(<Player url="movie.mp4" onEnablePIP={onEnablePIP} onDisablePIP={onDisablePIP} />);
    expect(props.onEnablePIP).toBe(onEnablePIP);
    expect(props.onDisablePIP).toBe(onDisablePIP);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 9.4 — feature activation by COMPOSABLE PRESENCE reaches the engine
// ─────────────────────────────────────────────────────────────────────────────
describe('Req 9.4 — composable presence activates the feature (content reaches the engine)', () => {
  test('<Source sources fullHDQualityBreak> activates the quality source input', () => {
    const props = captureEngineProps(
      <Player url="movie.mp4">
        <Source sources={SOURCES} fullHDQualityBreak={1080} />
      </Player>,
    );
    expect(props.sources).toBe(SOURCES);
    expect(props.fullHDQualityBreak).toBe(1080);
  });

  test('<Poster src> activates the poster feature', () => {
    const props = captureEngineProps(
      <Player url="movie.mp4">
        <Poster src="poster.jpg" />
      </Player>,
    );
    expect(props.poster).toBe('poster.jpg');
  });

  test('<Captions tracks> activates the captions feature', () => {
    const props = captureEngineProps(
      <Player url="movie.mp4">
        <Captions tracks={TRACKS} />
      </Player>,
    );
    expect(props.captions).toBe(TRACKS);
  });

  // Timeline-bound parts are BottomBar-only (Req 16), so they are nested inside <BottomBar> here.
  test('<Timeline spriteVTTFile bufferMode> activates the sprite/scrub-preview + buffer mode', () => {
    const props = captureEngineProps(
      <Player url="movie.mp4">
        <BottomBar>
          <Timeline spriteVTTFile="sprite.vtt" bufferMode="current" />
        </BottomBar>
      </Player>,
    );
    expect(props.spriteVTTFile).toBe('sprite.vtt');
    expect(props.bufferMode).toBe('current');
  });

  test('<Chapters chapters> activates the chapters feature', () => {
    const props = captureEngineProps(
      <Player url="movie.mp4">
        <BottomBar>
          <Chapters chapters={CHAPTERS} />
        </BottomBar>
      </Player>,
    );
    expect(props.chapters).toBe(CHAPTERS);
  });

  test('<Heatmap heatmapData> activates the heatmap feature', () => {
    const props = captureEngineProps(
      <Player url="movie.mp4">
        <BottomBar>
          <Heatmap heatmapData={HEATMAP} />
        </BottomBar>
      </Player>,
    );
    expect(props.heatmapData).toBe(HEATMAP);
  });

  test('<PrevButton onClick> + <NextButton onClick> inside <BottomBar> activates nav (showNavButtons + handlers)', () => {
    const onPrevious = jest.fn();
    const onNext = jest.fn();
    // Nested inside <BottomBar> to exercise the resolver's one-level container descent (Req 5.4)
    // through the REAL <Player>, mirroring idiomatic usage.
    const props = captureEngineProps(
      <Player url="movie.mp4">
        <BottomBar>
          <PrevButton onClick={onPrevious} />
          <NextButton onClick={onNext} />
        </BottomBar>
      </Player>,
    );
    expect(props.showNavButtons).toBe(true);
    expect(props.onPrevious).toBe(onPrevious);
    expect(props.onNext).toBe(onNext);
  });

  test('content from a composable WINS over the same key passed ephemerally (Req 6.6)', () => {
    // `<Player poster>` (ephemeral) + `<Poster src>` (composable) collide on `poster`: the composable
    // value must win, proving the composable is the authoritative activation channel for its content.
    const props = captureEngineProps(
      <Player url="movie.mp4" poster="ephemeral.jpg">
        <Poster src="composable.jpg" />
      </Player>,
    );
    expect(props.poster).toBe('composable.jpg');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 9.5 — feature DEACTIVATION by composable absence
// ─────────────────────────────────────────────────────────────────────────────
describe('Req 9.5 — omitting a composable keeps its feature inactive (no engine input)', () => {
  test('a bare <Player url/> (default composition) activates no content feature', () => {
    const props = captureEngineProps(<Player url="movie.mp4" />);

    // None of the content-composable inputs are present, so those features stay inactive.
    expect(props.poster).toBeUndefined();
    expect(props.captions).toBeUndefined();
    expect(props.sources).toBeUndefined();
    expect(props.spriteVTTFile).toBeUndefined();
    expect(props.chapters).toBeUndefined();
    expect(props.heatmapData).toBeUndefined();
    // PrevButton/NextButton are opt-in (not in DEFAULT_COMPOSITION), so nav stays off.
    expect(props.showNavButtons).toBe(false);
    expect(DEFAULT_COMPOSITION).not.toContain('PrevButton');
    expect(DEFAULT_COMPOSITION).not.toContain('NextButton');
  });

  test('a custom composition WITHOUT a given composable leaves that feature inactive', () => {
    // Compose only a PlayButton: poster/captions/timeline/nav must all stay inactive.
    const props = captureEngineProps(
      <Player url="movie.mp4">
        <BottomBar>
          <PlayButton />
        </BottomBar>
      </Player>,
    );
    expect(props.poster).toBeUndefined();
    expect(props.captions).toBeUndefined();
    expect(props.spriteVTTFile).toBeUndefined();
    expect(props.chapters).toBeUndefined();
    expect(props.heatmapData).toBeUndefined();
    expect(props.showNavButtons).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 9.1 / 9.2 — no feature is unreachable through the composed API
// ─────────────────────────────────────────────────────────────────────────────
describe('Req 9.1/9.2 — every feature is reachable through the composed API (Property 10)', () => {
  test('every public composable is exported from the package entry', () => {
    // The composed API is the ONLY public surface; each composable must be reachable as a named
    // export so its feature can be activated.
    [
      Player,
      Source,
      Poster,
      Captions,
      Captions.Toggle,
      Timeline,
      Chapters,
      Heatmap,
      PrevButton,
      NextButton,
      BottomBar,
      PlayButton,
      Volume,
      PlayTime,
      Title,
      Settings,
      Cast,
      Fullscreen,
      PlayOverlay,
    ].forEach((exported) => {
      expect(exported).toBeDefined();
    });
  });

  test('a single kitchen-sink composition activates EVERY content feature at once', () => {
    const onPrevious = jest.fn();
    const onNext = jest.fn();

    const props = captureEngineProps(
      <Player url="movie.m3u8">
        <PlayOverlay />
        <Poster src="poster.jpg" />
        <Captions tracks={TRACKS} />
        <Source sources={SOURCES} fullHDQualityBreak={1080} />
        <BottomBar>
          <PrevButton onClick={onPrevious} />
          <NextButton onClick={onNext} />
          <PlayButton />
          <Volume />
          <PlayTime />
          <Title>The Forest</Title>
          <Timeline spriteVTTFile="sprite.vtt" bufferMode="fragmented" />
          <Chapters chapters={CHAPTERS} />
          <Heatmap heatmapData={HEATMAP} />
          <Captions.Toggle />
          <Settings />
          <Cast />
          <Fullscreen />
        </BottomBar>
      </Player>,
    );

    // Every content feature reached the engine — none is unreachable through the composed API.
    expect(props.poster).toBe('poster.jpg');
    expect(props.captions).toBe(TRACKS);
    expect(props.sources).toBe(SOURCES);
    expect(props.fullHDQualityBreak).toBe(1080);
    expect(props.spriteVTTFile).toBe('sprite.vtt');
    expect(props.bufferMode).toBe('fragmented');
    expect(props.chapters).toBe(CHAPTERS);
    expect(props.heatmapData).toBe(HEATMAP);
    expect(props.title).toBe('The Forest');
    expect(props.showNavButtons).toBe(true);
    expect(props.onPrevious).toBe(onPrevious);
    expect(props.onNext).toBe(onNext);
  });
});
