import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { DEFAULT_COMPOSITION } from '@playerstack/web-core/adapters/framework';

import CorePlayerSkin from '@PlayerSkin/CorePlayerSkin';
import { Provider } from '@context/index';
import { CompositionContext } from '@compound/context/CompositionContext';

/**
 * Task 11.1 — Cast feature reachability through the composed API (Property 10 / VS9).
 *
 * Cast has TWO runtime preconditions the skin combines with composition presence (see
 * `ControlsExtra`: `has('Cast') && showCast`, where `showCast = castSupported && !adPresent &&
 * videoReady`): a browser that supports Remote Playback/Presentation, and a resolved `<video>`.
 * jsdom has neither, so this spec forces both preconditions via focused mocks and then proves the
 * `Cast` composable surfaces its affordance and wires the click to the cast prompt:
 *
 *   • `@hooks/useCast` → report cast SUPPORTED with a stub `promptCast` (its full behavior —
 *     Remote Playback → Presentation fallback, state transitions — is owned by `useCast.spec`).
 *   • `@PlayerSkin/hooks/useSkinVideoRef` → report `videoReady: true` (its DOM `<video>` resolution
 *     is owned by `useSkinVideoRef.spec`).
 *
 * With those satisfied, the reachability + gating that BELONG to the composed API are asserted:
 * `Cast` ∈ composition ⇒ the cast button renders and clicking it prompts cast (Req 9.4); omitting
 * `Cast` ⇒ no button even while cast is supported (Req 9.5, composition gates it). The
 * `handleCastClick → promptCast` wiring is also covered by `useSkinRequestHandlers.spec`;
 * `computeShowCast` by `gating.spec`.
 */

jest.mock('@playerstack/web-core', () => {
  const actual = jest.requireActual('@playerstack/web-core');
  return {
    ...actual,
    isMobile: false,
  };
});

// `mock`-prefixed so the jest.mock factory may reference it. `clearMocks: true` resets its call
// log between tests while keeping the mock in place.
const mockPromptCast = jest.fn();

// Force cast SUPPORTED (jsdom has no Remote Playback/Presentation API). Deeper cast behavior is
// owned by useCast.spec — here we only need `isSupported`/`promptCast` for the skin gating.
jest.mock('@hooks/useCast', () => ({
  __esModule: true,
  default: () => ({ isSupported: true, castAvailable: true, castState: 'connected', promptCast: mockPromptCast }),
}));

// Force a "ready" video (no real <video> exists in this harness). The real DOM resolution is owned
// by useSkinVideoRef.spec; a null ref is safe because the DVR/live-ad adapters read it lazily and
// are never exercised here (live/liveDVR are false).
jest.mock('@PlayerSkin/hooks/useSkinVideoRef', () => ({
  __esModule: true,
  default: () => ({ videoRef: { current: null }, videoReady: true }),
}));

const Wrapper = ({ children }) => <Provider language="en">{children}</Provider>;

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

describe('cast', () => {
  test('Cast ∈ composition + cast supported ⇒ the cast button renders and prompts cast on click (Req 9.4)', () => {
    // `Cast` is in DEFAULT_COMPOSITION; with cast supported + a ready video, showCast is true.
    const { container } = renderSkin();
    const castButton = container.querySelector('.playerstack-cast-button');
    expect(castButton).not.toBeNull();

    fireEvent.click(castButton);
    expect(mockPromptCast).toHaveBeenCalledTimes(1);
  });

  test('Cast ∉ composition ⇒ no cast button even while cast is supported (Req 9.5, composition gates it)', () => {
    const parts = DEFAULT_COMPOSITION.filter((name) => name !== 'Cast');
    const { container } = renderSkin({}, parts);
    expect(container.querySelector('.playerstack-cast-button')).toBeNull();
  });
});
