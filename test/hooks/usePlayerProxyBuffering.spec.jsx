import React from 'react';
import { renderHook, act } from '@testing-library/react';
import usePlayerProxy from '@MediaPlayer/hooks/usePlayerProxy';
import { Provider } from '@context/index';

// Mock network speed measurement to resolve immediately
jest.mock('@playerstack/core', () => ({ ...jest.requireActual('@playerstack/core'),
  measureNetworkSpeed: jest.fn().mockResolvedValue(5),
  getRecommendedVideoQuality: jest.fn().mockReturnValue(720),
}));

const Wrapper = ({ children }) => (
  <Provider language="en">{children}</Provider>
);

describe('usePlayerProxy — buffering state', () => {
  const createProps = (overrides = {}) => ({
    onBuffer: jest.fn(),
    onBufferEnd: jest.fn(),
    onDisablePIP: jest.fn(),
    onDuration: jest.fn(),
    onEnablePIP: jest.fn(),
    onEnded: jest.fn(),
    onError: jest.fn(),
    onPause: jest.fn(),
    onPlay: jest.fn(),
    onPlayBackQualityChange: jest.fn(),
    onPlayBackRateChange: jest.fn(),
    onProgress: jest.fn(),
    onReady: jest.fn(),
    onSeek: jest.fn(),
    onStart: jest.fn(),
    onLoaded: jest.fn(),
    onMount: jest.fn(),
    updateState: jest.fn(),
    playerState: { seeking: false, playbackQuality: null },
    extraProps: {
      url: 'https://example.com/video.mp4',
      sources: [],
      fullHDQualityBreak: undefined,
      prevented: false,
    },
    ...overrides,
  });

  test('onBuffer sets isBuffering to true', () => {
    const updateState = jest.fn();
    const props = createProps({ updateState });

    const { result } = renderHook(() => usePlayerProxy(props), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.onBuffer();
    });

    // updateState should have been called with a function that sets isBuffering: true
    const lastCall = updateState.mock.calls[updateState.mock.calls.length - 1];
    const updater = lastCall[0];
    const newState = updater({ isBuffering: false, playing: true });
    expect(newState.isBuffering).toBe(true);
  });

  test('onBufferEnd sets isBuffering to false', () => {
    const updateState = jest.fn();
    const props = createProps({ updateState });

    const { result } = renderHook(() => usePlayerProxy(props), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.onBufferEnd();
    });

    const lastCall = updateState.mock.calls[updateState.mock.calls.length - 1];
    const updater = lastCall[0];
    const newState = updater({ isBuffering: true, playing: true });
    expect(newState.isBuffering).toBe(false);
  });

  test('onBuffer calls consumer callback', () => {
    const onBuffer = jest.fn();
    const props = createProps({ onBuffer });

    const { result } = renderHook(() => usePlayerProxy(props), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.onBuffer('event');
    });

    expect(onBuffer).toHaveBeenCalledWith('event');
  });

  test('onBufferEnd calls consumer callback', () => {
    const onBufferEnd = jest.fn();
    const props = createProps({ onBufferEnd });

    const { result } = renderHook(() => usePlayerProxy(props), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.onBufferEnd('event');
    });

    expect(onBufferEnd).toHaveBeenCalledWith('event');
  });
});
