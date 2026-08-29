import React from 'react';
import { render, act } from '@testing-library/react';

import { DEFAULT_COMPOSITION } from '@playerstack/web-core/adapters/framework';

import CorePlayerSkin from '@PlayerSkin/CorePlayerSkin';
import { Provider } from '@context/index';
import { CompositionContext } from '@compound/context/CompositionContext';

// Keep the skin in desktop mode by default so the desktop control-bar branch (which renders
// the prev/next nav cluster) is exercised deterministically regardless of the test env.
jest.mock('@playerstack/web-core', () => {
  const actual = jest.requireActual('@playerstack/web-core');
  return {
    ...actual,
    isMobile: false,
  };
});

const Wrapper = ({ children }) => <Provider language="en">{children}</Provider>;

// Task 8.1 made CorePlayerSkin read the composition manifest via `useComposition()`, which requires
// a `<Player>`/CompositionContext ancestor. This low-level spec renders the skin directly, so it
// provides a manifest whose `parts` cover the full default control set — the same set `<Player>`
// yields by default. `PrevButton`/`NextButton` are opt-in (not in DEFAULT_COMPOSITION), so they are
// added only when the test drives nav wiring, mirroring `<Player>`'s `deriveEngineProps`
// (showNavButtons ⇔ PrevButton or NextButton ∈ parts).
function makeManifest(extraProps) {
  const parts = new Set(DEFAULT_COMPOSITION);
  if (extraProps.showNavButtons || extraProps.onPrevious || extraProps.onNext) {
    parts.add('PrevButton');
    parts.add('NextButton');
  }
  return { mode: 'default', parts, config: {}, order: [] };
}

// Minimal props required by CorePlayerSkin's bridge + render paths.
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

function renderSkin(extraProps = {}) {
  const manifest = makeManifest(extraProps);
  return render(
    <Wrapper>
      <CompositionContext.Provider value={{ manifest }}>
        <CorePlayerSkin {...baseProps} {...extraProps} />
      </CompositionContext.Provider>
    </Wrapper>,
  );
}

describe('CorePlayerSkin — nav buttons (GAP 2/5, Req 21.1)', () => {
  test('does NOT render the nav cluster when showNavButtons is false', () => {
    const { container } = renderSkin({ showNavButtons: false });
    expect(container.querySelector('.playerstack-prev-button')).toBeNull();
    expect(container.querySelector('.playerstack-next-button')).toBeNull();
  });

  test('renders the nav buttons on desktop when showNavButtons is true', () => {
    const { container } = renderSkin({ showNavButtons: true, onPrevious: jest.fn(), onNext: jest.fn() });
    expect(container.querySelector('.playerstack-prev-button')).not.toBeNull();
    expect(container.querySelector('.playerstack-next-button')).not.toBeNull();
  });

  test('clicking the prev button calls the public onPrevious handler', () => {
    const onPrevious = jest.fn();
    const onNext = jest.fn();
    const { container } = renderSkin({ showNavButtons: true, onPrevious, onNext });

    const prevBtn = container.querySelector('.playerstack-prev-button');
    act(() => {
      prevBtn.click();
    });

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  test('clicking the next button calls the public onNext handler', () => {
    const onPrevious = jest.fn();
    const onNext = jest.fn();
    const { container } = renderSkin({ showNavButtons: true, onPrevious, onNext });

    const nextBtn = container.querySelector('.playerstack-next-button');
    act(() => {
      nextBtn.click();
    });

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).not.toHaveBeenCalled();
  });

  test('renders the nav buttons on mobile center controls when showNavButtons is true', () => {
    const onPrevious = jest.fn();
    const { container } = renderSkin({ skinMode: 'mobile', showNavButtons: true, onPrevious, onNext: jest.fn() });
    expect(container.querySelector('[part="nav-prev"]')).not.toBeNull();
    expect(container.querySelector('[part="nav-next"]')).not.toBeNull();
  });
});

describe('CorePlayerSkin — caption selection (GAP 1, Req 21.1)', () => {
  const captions = [{ src: 'en.vtt', label: 'English', language: 'en' }];

  test('a caption-request event forwards detail.value to onCaptionChange', () => {
    const onCaptionChange = jest.fn();
    const { container } = renderSkin({ captions, activeCaption: 'en', onCaptionChange });

    // The control-bar captions element carries the onCaptionRequest wiring.
    const captionEls = container.querySelectorAll('playerstack-captions');
    expect(captionEls.length).toBeGreaterThan(0);

    act(() => {
      captionEls.forEach((el) =>
        el.dispatchEvent(
          new CustomEvent('playerstack-caption-request', {
            detail: { value: 'es' },
            bubbles: true,
            composed: true,
          }),
        ),
      );
    });

    expect(onCaptionChange).toHaveBeenCalledWith('es');
  });
});
