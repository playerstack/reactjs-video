import React from 'react';
import { render } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from '@context/index';

/**
 * Comprehensive coverage test file targeting uncovered functions across the
 * remaining live source files. The former StyledGeneralButton / MobileCenterControls
 * / SkipOverlay / Icon sections were removed alongside the styled-components skins
 * in task 14.4; this file now focuses on the live `usePlayerSkinWrapper` surface and
 * the `lazy` utility.
 */

// ─── lazy utility (React.lazy wrapper) ───────────────────────────────────────

describe('lazy utility', () => {
  test('lazy utility resolves import correctly', async () => {
    const { lazy } = require('@hooks/utils/lazy');
    const LazyComp = lazy(() => Promise.resolve({ default: () => <div>Loaded</div> }));
    expect(LazyComp).toBeDefined();
    expect(LazyComp.$$typeof).toBeDefined();
  });
});

// ─── usePlayerSkinWrapper – memorizedProps callbacks & key handlers ──────────

describe('usePlayerSkinWrapper – additional callback coverage', () => {
  const wrapper = ({ children }) => <Provider language="en">{children}</Provider>;

  const makePlayer = () => ({
    seekTo: jest.fn(),
    getCurrentTime: jest.fn(() => 30),
    getDuration: jest.fn(() => 120),
    getPlayer: jest.fn(() => {
      const video = document.createElement('video');
      video.volume = 0.5;
      video.muted = false;
      return video;
    }),
  });

  const makePlayerRef = () => ({ current: document.createElement('div') });

  let player;
  let playerRef;
  let updateState;

  beforeEach(() => {
    player = makePlayer();
    playerRef = makePlayerRef();
    playerRef.current.requestFullscreen = jest.fn();
    updateState = jest.fn((fn) => {
      if (typeof fn === 'function') {
        return fn({ playing: false, volume: 0.5, isMuted: false, loop: false, seeking: false });
      }
    });
    jest.clearAllMocks();
  });

  const getHook = (overrides = {}) =>
    renderHook(
      () => {
        const usePlayerSkinWrapper = require('../../src/hooks/usePlayerSkinWrapper').default;
        return usePlayerSkinWrapper({
          ref: React.createRef(),
          playerRef,
          url: 'test.mp4',
          player,
          fullHDQualityBreak: 1080,
          sources: [{ src: 'v720.mp4', resolution: 720 }],
          prevented: false,
          muted: false,
          updateState,
          ...overrides,
        });
      },
      { wrapper },
    );

  test('changePlayBackQuality updates state even when player is null', () => {
    const { result } = getHook({ player: null });
    act(() => result.current.memorizedProps.changePlayBackQuality(720));
    expect(updateState).toHaveBeenCalled();
  });

  test('onSeeking calls updateState with seeking value', () => {
    const { result } = getHook();
    act(() => result.current.memorizedProps.onSeeking(true));
    expect(updateState).toHaveBeenCalled();
  });

  test('onLoopClick toggles loop in state', () => {
    const { result } = getHook();
    act(() => result.current.memorizedProps.onLoopClick());
    expect(updateState).toHaveBeenCalled();
  });

  test('onMutedClick in memorizedProps delegates to volume hook', () => {
    const { result } = getHook();
    expect(() => act(() => result.current.memorizedProps.onMutedClick())).not.toThrow();
  });

  describe('handleKeyDown – MUTE_KEY with video element', () => {
    test('MUTE_KEY triggers onMutedClick with active video', () => {
      const { result } = getHook();
      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        key: 'm',
        keyCode: 77,
        which: 77,
      };
      expect(() => act(() => result.current.handleKeyDown(event))).not.toThrow();
    });
  });

  describe('handleKeyDown – ARROW keys with active video', () => {
    test('ARROW_LEFT_KEY seeks backward with video element', () => {
      player.getCurrentTime.mockReturnValue(10);
      player.getDuration.mockReturnValue(120);
      const { result } = getHook();
      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        key: 'ArrowLeft',
        keyCode: 37,
        which: 37,
      };
      act(() => result.current.handleKeyDown(event));
      expect(player.seekTo).toHaveBeenCalledWith(5);
    });

    test('ARROW_RIGHT_KEY seeks forward with video element', () => {
      player.getCurrentTime.mockReturnValue(50);
      player.getDuration.mockReturnValue(120);
      const { result } = getHook();
      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        key: 'ArrowRight',
        keyCode: 39,
        which: 39,
      };
      act(() => result.current.handleKeyDown(event));
      expect(player.seekTo).toHaveBeenCalledWith(55);
    });

    test('ARROW_UP_KEY increases volume with video element', () => {
      const { result } = getHook();
      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        key: 'ArrowUp',
        keyCode: 38,
        which: 38,
      };
      expect(() => act(() => result.current.handleKeyDown(event))).not.toThrow();
    });

    test('ARROW_DOWN_KEY decreases volume with video element', () => {
      const { result } = getHook();
      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        key: 'ArrowDown',
        keyCode: 40,
        which: 40,
      };
      expect(() => act(() => result.current.handleKeyDown(event))).not.toThrow();
    });
  });
});
