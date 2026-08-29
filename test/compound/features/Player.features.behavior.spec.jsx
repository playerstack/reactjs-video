import React from 'react';
import { render, act } from '@testing-library/react';

import { DEFAULT_COMPOSITION } from '@playerstack/web-core/adapters/framework';

import CorePlayerSkin from '@PlayerSkin/CorePlayerSkin';
import { Provider } from '@context/index';
import { CompositionContext } from '@compound/context/CompositionContext';

/**
 * Task 11.1 — Feature OBSERVABLE-BEHAVIOR reachability through the composed API (Property 10 / VS9).
 *
 * This is "level (b)" of the reachability strategy (the counterpart to
 * `Player.features.activation.spec.jsx`, which proved each feature's input REACHES the engine).
 * Here we render the skin ORCHESTRATOR (`CorePlayerSkin`) wrapped in the skin UI `Provider` +
 * a `CompositionContext.Provider` supplying the manifest — the exact rig the shipped
 * `CorePlayerSkinParity`/`CorePlayerSkinNav`/`CorePlayerSkinComposition` suites use — and assert
 * the OBSERVABLE output of each VS9 inventory feature: its `playerstack-*` element, its `data-*`
 * reflection, and (for the request-only features) that its request event still fires the public
 * handler. Driving the manifest here is equivalent to what a `<Player>`'s children scan produces;
 * the ephemeral playback props are what `<Player>` forwards to the engine (proven reachable in the
 * activation spec).
 *
 * Scope note (avoids duplicating existing coverage per the task): each feature gets a FOCUSED
 * reachability assertion (element present when active / absent when not, plus one handler spot-check
 * where the feature is request-only). The deeper per-feature behavior is already owned by dedicated
 * specs, referenced inline:
 *   • ads skip/click, fullscreen/pip/caption/loop/rate/quality callbacks, snapshots → CorePlayerSkinParity
 *   • nav gating + prev/next + caption selection                                    → CorePlayerSkinNav
 *   • presence gating, canonical order, layout selection                            → CorePlayerSkinComposition
 *   • cast affordance (needs cast support + a ready video)                          → Player.features.cast
 */

// Force DESKTOP so the desktop control-bar branch renders deterministically regardless of the test
// env's UA — same convention as the shipped skin specs. The mobile branch is driven via skinMode.
jest.mock('@playerstack/web-core', () => {
  const actual = jest.requireActual('@playerstack/web-core');
  return {
    ...actual,
    isMobile: false,
  };
});

const Wrapper = ({ children }) => <Provider language="en">{children}</Provider>;

// Minimal playback props the orchestrator's bridge/render paths need (mirrors the shipped specs).
// `paused: true`, `currentTime: 0`, no ads/live/captions by default so each feature below is
// toggled on explicitly and its ABSENCE is observable in the base state.
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

// Content fixtures.
const ADS = {
  title: 'Ad',
  url: 'https://example.com',
  buttonText: 'Learn more',
  skipAfter: 5,
  onSkip: () => {},
  onAdClick: () => {},
};
const TRACKS = [{ src: 'en.vtt', label: 'English', language: 'en' }];
const CHAPTERS = [{ title: 'Intro', startTime: 0 }];
const HEATMAP = [{ startTime: 0, endTime: 10, value: 1 }];

/**
 * Render the orchestrator with a composition manifest (its `parts` stands in for what a
 * `<Player>` children scan yields) and the given ephemeral playback props.
 */
function renderSkin(props = {}, parts = DEFAULT_COMPOSITION) {
  const manifest = { mode: 'custom', parts: new Set(parts), config: {}, order: [] };
  return render(
    <Wrapper>
      <CompositionContext.Provider value={{ manifest }}>
        <CorePlayerSkin {...baseProps} {...props} />
      </CompositionContext.Provider>
    </Wrapper>,
  );
}

/** Dispatch a request CustomEvent from a `playerstack-*` element, wrapped in act(). */
function dispatchRequest(el, eventName, detail) {
  act(() => {
    el.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true, composed: true }));
  });
}

const controllerOf = (container) => container.querySelector('playerstack-media-controller');

// ─────────────────────────────────────────────────────────────────────────────
// ads (Req 9.3 ephemeral activation)
// ─────────────────────────────────────────────────────────────────────────────
describe('ads', () => {
  test('ads prop activates the ad overlay + data-ad-active on the controller', () => {
    const { container } = renderSkin({ ads: ADS });
    expect(container.querySelector('playerstack-ad-overlay')).not.toBeNull();
    // Ad-mode styling hook is reflected on the controller host (drives the yellow timeline etc.).
    expect(controllerOf(container).getAttribute('data-ad-active')).toBe('true');
    // Skip/click request → ads.onSkip/ads.onAdClick behavior is covered by CorePlayerSkinParity.
  });

  test('no ads ⇒ no ad overlay and no data-ad-active (deactivation, Req 9.5-analogue)', () => {
    const { container } = renderSkin({ ads: null });
    expect(container.querySelector('playerstack-ad-overlay')).toBeNull();
    expect(controllerOf(container).getAttribute('data-ad-active')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// live / liveDVR + live-ad break (Req 9.3 ephemeral activation)
// ─────────────────────────────────────────────────────────────────────────────
describe('live / liveDVR / live-ad break', () => {
  test('live prop activates the LIVE indicator and the live-ad break overlay', () => {
    const { container } = renderSkin({ live: true });
    expect(container.querySelector('playerstack-live-indicator')).not.toBeNull();
    expect(container.querySelector('playerstack-live-ad')).not.toBeNull();
  });

  test('liveDVR prop activates the LIVE indicator (unified live flag)', () => {
    // liveDVR implies the unified live flag, so the LIVE badge shows even with live={false}.
    const { container } = renderSkin({ liveDVR: true });
    expect(container.querySelector('playerstack-live-indicator')).not.toBeNull();
  });

  test('no live flags ⇒ no LIVE indicator / no live-ad overlay', () => {
    const { container } = renderSkin();
    expect(container.querySelector('playerstack-live-indicator')).toBeNull();
    expect(container.querySelector('playerstack-live-ad')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// captions (Req 9.4 presence activation via tracks / 9.5 absence)
// ─────────────────────────────────────────────────────────────────────────────
describe('captions', () => {
  test('caption tracks activate the captions overlay + the CC quick-toggle', () => {
    const { container } = renderSkin({ captions: TRACKS, activeCaption: 'en' });
    expect(container.querySelector('playerstack-captions')).not.toBeNull();
    expect(container.querySelector('.playerstack-captions-button')).not.toBeNull();
    // caption-request → onCaptionChange forwarding is covered by CorePlayerSkinNav.
  });

  test('no caption tracks ⇒ no captions overlay and no CC toggle (Req 9.5)', () => {
    const { container } = renderSkin({ captions: [] });
    expect(container.querySelector('playerstack-captions')).toBeNull();
    expect(container.querySelector('.playerstack-captions-button')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sprite / scrub preview (Req 9.4 presence activation via Timeline spriteVTTFile)
// ─────────────────────────────────────────────────────────────────────────────
describe('sprite / scrub preview', () => {
  test('spriteVTTFile activates the sprite preview element', () => {
    const { container } = renderSkin({ spriteVTTFile: 'sprite.vtt' });
    expect(container.querySelector('playerstack-sprite-preview')).not.toBeNull();
  });

  test('no spriteVTTFile ⇒ no sprite preview (Req 9.5)', () => {
    const { container } = renderSkin();
    expect(container.querySelector('playerstack-sprite-preview')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// heatmap (Req 9.4 presence activation via Heatmap heatmapData)
// ─────────────────────────────────────────────────────────────────────────────
describe('heatmap', () => {
  test('heatmapData reaches the time-slider element (the surface that renders the heatmap)', () => {
    // Heatmap has no standalone skin element — it rides on `playerstack-time-slider`. The adapter
    // assigns the data as a JS property; the element exposes it via a public getter, so reading it
    // back proves the heatmap feature is wired through the composed path.
    const { container } = renderSkin({ heatmapData: HEATMAP });
    const timeSlider = container.querySelector('playerstack-time-slider');
    expect(timeSlider).not.toBeNull();
    expect(timeSlider.heatmapData).toHaveLength(HEATMAP.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// chapters (Req 9.4 presence activation via Chapters chapters)
// ─────────────────────────────────────────────────────────────────────────────
describe('chapters', () => {
  test('chapters activate the chapters read-out element and reach the time-slider', () => {
    const { container } = renderSkin({ chapters: CHAPTERS });
    expect(container.querySelector('playerstack-chapters')).not.toBeNull();
    expect(container.querySelector('playerstack-time-slider').chapters).toHaveLength(CHAPTERS.length);
  });

  test('no chapters ⇒ no chapters read-out (Req 9.5)', () => {
    const { container } = renderSkin({ chapters: [] });
    expect(container.querySelector('playerstack-chapters')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PiP + context menu (Req 9.3 — PiP affordance lives in the context menu)
// ─────────────────────────────────────────────────────────────────────────────
describe('PiP / context menu', () => {
  test('the context menu is present and its pip requests fire the PiP handlers', () => {
    const requestPictureInPicture = jest.fn();
    const exitPictureInPicture = jest.fn();
    const { container } = renderSkin({ requestPictureInPicture, exitPictureInPicture });

    const menu = container.querySelector('playerstack-context-menu');
    expect(menu).not.toBeNull();

    dispatchRequest(menu, 'playerstack-enter-pip-request');
    dispatchRequest(menu, 'playerstack-exit-pip-request');
    expect(requestPictureInPicture).toHaveBeenCalledTimes(1);
    expect(exitPictureInPicture).toHaveBeenCalledTimes(1);
    // loop-request behavior is covered by CorePlayerSkinParity.
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// fullscreen (Req 9.4 presence via Fullscreen composable, in DEFAULT_COMPOSITION)
// ─────────────────────────────────────────────────────────────────────────────
describe('fullscreen', () => {
  test('the fullscreen button is present and its requests fire the fullscreen handlers', () => {
    const requestFullscreen = jest.fn();
    const exitFullscreen = jest.fn();
    const { container } = renderSkin({ requestFullscreen, exitFullscreen });

    const fsButton = container.querySelector('playerstack-fullscreen-button');
    expect(fsButton).not.toBeNull();

    dispatchRequest(fsButton, 'playerstack-enter-fullscreen-request');
    dispatchRequest(fsButton, 'playerstack-exit-fullscreen-request');
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(exitFullscreen).toHaveBeenCalledTimes(1);
  });

  test('omitting the Fullscreen part removes the fullscreen button (Req 9.5)', () => {
    const parts = DEFAULT_COMPOSITION.filter((name) => name !== 'Fullscreen');
    const { container } = renderSkin({}, parts);
    expect(container.querySelector('playerstack-fullscreen-button')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// poster (Req 9.4 presence activation via Poster src)
// ─────────────────────────────────────────────────────────────────────────────
describe('poster', () => {
  test('poster activates the poster overlay (visible pre-playback)', () => {
    const { container } = renderSkin({ poster: 'poster.jpg' });
    expect(container.querySelector('.playerstack-poster')).not.toBeNull();
  });

  test('no poster ⇒ no poster overlay (Req 9.5)', () => {
    const { container } = renderSkin();
    expect(container.querySelector('.playerstack-poster')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// nav buttons (Req 9.4 presence via PrevButton/NextButton composables / 9.5 absence)
// ─────────────────────────────────────────────────────────────────────────────
describe('nav buttons', () => {
  test('PrevButton/NextButton ∈ composition + handlers activates the nav buttons', () => {
    const { container } = renderSkin({ showNavButtons: true, onPrevious: jest.fn(), onNext: jest.fn() }, [
      ...DEFAULT_COMPOSITION,
      'PrevButton',
      'NextButton',
    ]);
    expect(container.querySelector('.playerstack-prev-button')).not.toBeNull();
    expect(container.querySelector('.playerstack-next-button')).not.toBeNull();
    // prev/next click → onPrevious/onNext is covered by CorePlayerSkinNav.
  });

  test('PrevButton/NextButton ∉ composition ⇒ no nav buttons even with handlers (Req 9.5, composition gates it)', () => {
    const { container } = renderSkin({ showNavButtons: true, onPrevious: jest.fn(), onNext: jest.fn() });
    expect(container.querySelector('.playerstack-prev-button')).toBeNull();
    expect(container.querySelector('.playerstack-next-button')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mobile / desktop layout selection (Req 8.6–8.9, part of the VS9 inventory)
// ─────────────────────────────────────────────────────────────────────────────
describe('mobile / desktop selection', () => {
  test('skinMode="desktop" selects the desktop layout (data-skin-mode="desktop")', () => {
    const { container } = renderSkin({ skinMode: 'desktop' });
    expect(controllerOf(container).getAttribute('data-skin-mode')).toBe('desktop');
    expect(container.querySelector('.playerstack-controls')).not.toBeNull();
  });

  test('skinMode="mobile" selects the mobile layout (data-skin-mode="mobile")', () => {
    const { container } = renderSkin({ skinMode: 'mobile' });
    expect(controllerOf(container).getAttribute('data-skin-mode')).toBe('mobile');
    expect(container.querySelector('.playerstack-mobile-bottom-bar')).not.toBeNull();
  });
});
