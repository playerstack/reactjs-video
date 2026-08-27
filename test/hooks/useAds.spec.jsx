import React from 'react';
import { render, act } from '@testing-library/react';
import { useAds } from '@hooks/useAds';
import { webAdsPlatform } from '@utils/adsPlatform';

// Helper to render hook
function TestComponent({ ads, currentTime, duration, paused = false, ended, onPauseClick, onResult }) {
  const result = useAds({ ads, currentTime, duration, paused, ended, onPauseClick, platform: webAdsPlatform });
  onResult(result);
  return null;
}

function renderHook(props) {
  const results = { current: null };
  const onResult = (r) => {
    results.current = r;
  };
  const rendered = render(<TestComponent {...props} onResult={onResult} />);
  return { results, rendered };
}

describe('useAds', () => {
  let originalOpen;

  beforeAll(() => {
    // Mock mediaSession globally for all tests (persists through cleanup)
    Object.defineProperty(navigator, 'mediaSession', {
      value: { setActionHandler: jest.fn() },
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    originalOpen = window.open;
    window.open = jest.fn();
    navigator.mediaSession.setActionHandler.mockClear();
  });

  afterEach(() => {
    window.open = originalOpen;
  });

  describe('isAdActive', () => {
    test('returns false when ads is null', () => {
      const { results } = renderHook({ ads: null, currentTime: 0, duration: 15, ended: false });
      expect(results.current.isAdActive).toBe(false);
    });

    test('returns false when ads is undefined', () => {
      const { results } = renderHook({ ads: undefined, currentTime: 0, duration: 15, ended: false });
      expect(results.current.isAdActive).toBe(false);
    });

    test('returns true when ads object is provided', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 5 };
      const { results } = renderHook({ ads, currentTime: 0, duration: 15, ended: false });
      expect(results.current.isAdActive).toBe(true);
    });
  });

  describe('hasSkipTimer', () => {
    test('returns true when skipAfter is a positive number', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 5 };
      const { results } = renderHook({ ads, currentTime: 0, duration: 15, ended: false });
      expect(results.current.hasSkipTimer).toBe(true);
    });

    test('returns false when skipAfter is null', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: null };
      const { results } = renderHook({ ads, currentTime: 0, duration: 15, ended: false });
      expect(results.current.hasSkipTimer).toBe(false);
    });

    test('returns false when skipAfter is 0', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 0 };
      const { results } = renderHook({ ads, currentTime: 0, duration: 15, ended: false });
      expect(results.current.hasSkipTimer).toBe(false);
    });

    test('returns false when skipAfter is undefined', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit' };
      const { results } = renderHook({ ads, currentTime: 0, duration: 15, ended: false });
      expect(results.current.hasSkipTimer).toBe(false);
    });

    test('returns false when ads is null', () => {
      const { results } = renderHook({ ads: null, currentTime: 0, duration: 15, ended: false });
      expect(results.current.hasSkipTimer).toBe(false);
    });
  });

  describe('canSkip', () => {
    test('returns false when currentTime < skipAfter', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 5 };
      const { results } = renderHook({ ads, currentTime: 3, duration: 15, ended: false });
      expect(results.current.canSkip).toBe(false);
    });

    test('returns true when currentTime >= skipAfter', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 5 };
      const { results } = renderHook({ ads, currentTime: 5, duration: 15, ended: false });
      expect(results.current.canSkip).toBe(true);
    });

    test('returns true when currentTime > skipAfter', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 5 };
      const { results } = renderHook({ ads, currentTime: 8, duration: 15, ended: false });
      expect(results.current.canSkip).toBe(true);
    });

    test('returns false when no skip timer', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit' };
      const { results } = renderHook({ ads, currentTime: 10, duration: 15, ended: false });
      expect(results.current.canSkip).toBe(false);
    });

    test('returns false when ads is null', () => {
      const { results } = renderHook({ ads: null, currentTime: 10, duration: 15, ended: false });
      expect(results.current.canSkip).toBe(false);
    });
  });

  describe('skipCountdown', () => {
    test('returns remaining seconds before skip is available', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 5 };
      const { results } = renderHook({ ads, currentTime: 2, duration: 15, ended: false });
      expect(results.current.skipCountdown).toBe(3);
    });

    test('returns 0 when currentTime >= skipAfter', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 5 };
      const { results } = renderHook({ ads, currentTime: 5, duration: 15, ended: false });
      expect(results.current.skipCountdown).toBe(0);
    });

    test('returns 0 when no skip timer', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit' };
      const { results } = renderHook({ ads, currentTime: 2, duration: 15, ended: false });
      expect(results.current.skipCountdown).toBe(0);
    });

    test('uses Math.ceil for fractional seconds', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 5 };
      const { results } = renderHook({ ads, currentTime: 2.3, duration: 15, ended: false });
      expect(results.current.skipCountdown).toBe(3);
    });

    test('returns 1 when almost at skipAfter', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 5 };
      const { results } = renderHook({ ads, currentTime: 4.1, duration: 15, ended: false });
      expect(results.current.skipCountdown).toBe(1);
    });
  });

  describe('adProgress', () => {
    test('returns 0 when ads is null', () => {
      const { results } = renderHook({ ads: null, currentTime: 5, duration: 15, ended: false });
      expect(results.current.adProgress).toBe(0);
    });

    test('returns progress based on skipAfter when hasSkipTimer', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 10 };
      const { results } = renderHook({ ads, currentTime: 5, duration: 15, ended: false });
      expect(results.current.adProgress).toBe(0.5);
    });

    test('caps at 1 when currentTime exceeds skipAfter', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 5 };
      const { results } = renderHook({ ads, currentTime: 8, duration: 15, ended: false });
      expect(results.current.adProgress).toBe(1);
    });

    test('returns normal progress when no skip timer', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit' };
      const { results } = renderHook({ ads, currentTime: 5, duration: 10, ended: false });
      expect(results.current.adProgress).toBe(0.5);
    });

    test('returns 0 when duration is 0 and no skip timer', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit' };
      const { results } = renderHook({ ads, currentTime: 0, duration: 0, ended: false });
      expect(results.current.adProgress).toBe(0);
    });
  });

  describe('onSkipClick', () => {
    test('calls ads.onSkip when ad is active', () => {
      const onSkip = jest.fn();
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 5, onSkip };
      const { results } = renderHook({ ads, currentTime: 6, duration: 15, ended: false });
      act(() => results.current.onSkipClick());
      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    test('does nothing when ads is null', () => {
      const { results } = renderHook({ ads: null, currentTime: 6, duration: 15, ended: false });
      act(() => results.current.onSkipClick());
      // No error thrown
    });

    test('does nothing when onSkip not provided', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 5 };
      const { results } = renderHook({ ads, currentTime: 6, duration: 15, ended: false });
      act(() => results.current.onSkipClick());
      // No error thrown
    });
  });

  describe('onAdClick', () => {
    test('pauses video, calls onAdClick callback, and opens URL', () => {
      const onAdClick = jest.fn();
      const onPauseClick = jest.fn();
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', onAdClick };
      const { results } = renderHook({ ads, currentTime: 3, duration: 15, ended: false, onPauseClick });
      act(() => results.current.onAdClick());
      expect(onPauseClick).toHaveBeenCalledTimes(1);
      expect(onAdClick).toHaveBeenCalledTimes(1);
      expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    });

    test('does nothing when ads is null', () => {
      const onPauseClick = jest.fn();
      const { results } = renderHook({ ads: null, currentTime: 3, duration: 15, ended: false, onPauseClick });
      act(() => results.current.onAdClick());
      expect(onPauseClick).not.toHaveBeenCalled();
      expect(window.open).not.toHaveBeenCalled();
    });

    test('opens URL even without onAdClick callback', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit' };
      const { results } = renderHook({ ads, currentTime: 3, duration: 15, ended: false });
      act(() => results.current.onAdClick());
      expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    });

    test('does not open URL if url not provided', () => {
      const ads = { title: 'Ad', url: '', buttonText: 'Visit' };
      const { results } = renderHook({ ads, currentTime: 3, duration: 15, ended: false });
      act(() => results.current.onAdClick());
      expect(window.open).not.toHaveBeenCalled();
    });
  });

  describe('ad ended detection', () => {
    test('calls onAdComplete when ad ends', () => {
      const onAdComplete = jest.fn();
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', onAdComplete };
      const { rendered } = renderHook({ ads, currentTime: 15, duration: 15, ended: false });

      // Re-render with ended=true
      const results2 = { current: null };
      rendered.rerender(<TestComponent ads={ads} currentTime={15} duration={15} ended={true} onResult={(r) => { results2.current = r; }} />);
      expect(onAdComplete).toHaveBeenCalledTimes(1);
    });

    test('does not call onAdComplete twice', () => {
      const onAdComplete = jest.fn();
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', onAdComplete };
      // Start playing (ad active)
      const { rendered } = renderHook({ ads, currentTime: 10, duration: 15, paused: false, ended: false });

      // Ad ends
      const results2 = { current: null };
      rendered.rerender(<TestComponent ads={ads} currentTime={15} duration={15} paused={false} ended={true} onResult={(r) => { results2.current = r; }} />);
      expect(onAdComplete).toHaveBeenCalledTimes(1);

      // Re-render again with ended=true — should not call again
      rendered.rerender(<TestComponent ads={ads} currentTime={15} duration={15} paused={false} ended={true} onResult={(r) => { results2.current = r; }} />);
      expect(onAdComplete).toHaveBeenCalledTimes(1);
    });

    test('does not call onAdComplete when ads is null', () => {
      const { rendered } = renderHook({ ads: null, currentTime: 15, duration: 15, ended: true });
      expect(rendered.container).toBeTruthy();
    });

    test('resets completion flag when ads deactivates', () => {
      const onAdComplete = jest.fn();
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', onAdComplete };
      // Start playing (ad active)
      const { rendered } = renderHook({ ads, currentTime: 10, duration: 15, paused: false, ended: false });

      // Ad ends
      const results2 = { current: null };
      rendered.rerender(<TestComponent ads={ads} currentTime={15} duration={15} paused={false} ended={true} onResult={(r) => { results2.current = r; }} />);
      expect(onAdComplete).toHaveBeenCalledTimes(1);

      // Deactivate ads
      rendered.rerender(<TestComponent ads={null} currentTime={0} duration={15} paused={false} ended={false} onResult={(r) => { results2.current = r; }} />);

      // Reactivate ads while playing
      rendered.rerender(<TestComponent ads={ads} currentTime={0} duration={15} paused={false} ended={false} onResult={(r) => { results2.current = r; }} />);

      // Ad ends again
      rendered.rerender(<TestComponent ads={ads} currentTime={15} duration={15} paused={false} ended={true} onResult={(r) => { results2.current = r; }} />);
      expect(onAdComplete).toHaveBeenCalledTimes(2);
    });
  });

  describe('media session blocking', () => {
    test('registers no-op handlers when ad is active', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 5 };
      renderHook({ ads, currentTime: 0, duration: 15, ended: false });
      expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith('seekbackward', expect.any(Function));
      expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith('seekforward', expect.any(Function));
      expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith('seekto', expect.any(Function));
    });

    test('does not register handlers when ads is null', () => {
      renderHook({ ads: null, currentTime: 0, duration: 15, ended: false });
      expect(navigator.mediaSession.setActionHandler).not.toHaveBeenCalled();
    });

    test('cleans up handlers on unmount', () => {
      const ads = { title: 'Ad', url: 'https://example.com', buttonText: 'Visit', skipAfter: 5 };
      const { rendered } = renderHook({ ads, currentTime: 0, duration: 15, ended: false });
      navigator.mediaSession.setActionHandler.mockClear();
      rendered.unmount();
      expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith('seekbackward', null);
      expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith('seekforward', null);
      expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith('seekto', null);
    });
  });
});
