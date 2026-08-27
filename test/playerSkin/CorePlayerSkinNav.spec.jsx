import React from 'react';
import { render, act } from '@testing-library/react';

import CorePlayerSkin from '@PlayerSkin/CorePlayerSkin';
import { Provider } from '@context/index';

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
  return render(
    <Wrapper>
      <CorePlayerSkin {...baseProps} {...extraProps} />
    </Wrapper>,
  );
}

describe('CorePlayerSkin — nav buttons (GAP 2/5, Req 21.1)', () => {
  test('does NOT render the nav cluster when showNavButtons is false', () => {
    const { container } = renderSkin({ showNavButtons: false });
    expect(container.querySelector('playerstack-nav-buttons')).toBeNull();
  });

  test('renders the nav cluster on desktop when showNavButtons is true', () => {
    const { container } = renderSkin({ showNavButtons: true, onPrevious: jest.fn(), onNext: jest.fn() });
    expect(container.querySelector('playerstack-nav-buttons')).not.toBeNull();
  });

  test('a prev-request event calls the public onPrevious handler', () => {
    const onPrevious = jest.fn();
    const onNext = jest.fn();
    const { container } = renderSkin({ showNavButtons: true, onPrevious, onNext });

    const nav = container.querySelector('playerstack-nav-buttons');
    act(() => {
      nav.dispatchEvent(new CustomEvent('playerstack-prev-request', { bubbles: true, composed: true }));
    });

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  test('a next-request event calls the public onNext handler', () => {
    const onPrevious = jest.fn();
    const onNext = jest.fn();
    const { container } = renderSkin({ showNavButtons: true, onPrevious, onNext });

    const nav = container.querySelector('playerstack-nav-buttons');
    act(() => {
      nav.dispatchEvent(new CustomEvent('playerstack-next-request', { bubbles: true, composed: true }));
    });

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).not.toHaveBeenCalled();
  });

  test('renders the nav cluster on mobile center controls when showNavButtons is true', () => {
    const onPrevious = jest.fn();
    const { container } = renderSkin({ skinMode: 'mobile', showNavButtons: true, onPrevious, onNext: jest.fn() });
    expect(container.querySelector('playerstack-nav-buttons')).not.toBeNull();
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
