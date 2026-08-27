import React from 'react';
import { renderHook, act } from '@testing-library/react';
import usePlayerProxy from '@MediaPlayer/hooks/usePlayerProxy';
import { Provider } from '@context/index';

// Mock the network speed measurement to avoid real network calls
jest.mock('@playerstack/web-core', () => ({ ...jest.requireActual('@playerstack/web-core'),
  measureNetworkSpeed: jest.fn().mockResolvedValue(5.0),
  getRecommendedVideoQuality: jest.fn().mockReturnValue(1080),
}));

const wrapper = ({ children }) => <Provider language="en">{children}</Provider>;

const baseProps = {
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
  extraProps: { url: 'video.mp4', sources: [], fullHDQualityBreak: undefined, prevented: false },
};

describe('usePlayerProxy - extra coverage', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── onPlayBackQualityChange ────────────────────────────────────────────────
  describe('proxyMemorized.onPlayBackQualityChange', () => {
    test('calls callback and updates playbackQuality in state', () => {
      const onPlayBackQualityChange = jest.fn();
      const updateState = jest.fn();
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, onPlayBackQualityChange, updateState }),
        { wrapper },
      );
      act(() => result.current.onPlayBackQualityChange(720));
      expect(onPlayBackQualityChange).toHaveBeenCalledWith(720);
      expect(updateState).toHaveBeenCalled();
      const fn = updateState.mock.calls[0][0];
      expect(fn({ playbackQuality: null })).toMatchObject({ playbackQuality: 720 });
    });

    test('handles undefined callback gracefully', () => {
      const updateState = jest.fn();
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, onPlayBackQualityChange: undefined, updateState }),
        { wrapper },
      );
      expect(() => act(() => result.current.onPlayBackQualityChange(1080))).not.toThrow();
      expect(updateState).toHaveBeenCalled();
    });
  });

  // ─── onMount ────────────────────────────────────────────────────────────────
  describe('proxyMemorized.onMount', () => {
    test('calls onMount callback', () => {
      const onMount = jest.fn();
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, onMount }),
        { wrapper },
      );
      act(() => result.current.onMount('arg1', 'arg2'));
      expect(onMount).toHaveBeenCalledWith('arg1', 'arg2');
    });

    test('handles undefined onMount gracefully', () => {
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, onMount: undefined }),
        { wrapper },
      );
      expect(() => act(() => result.current.onMount())).not.toThrow();
    });
  });

  // ─── Error handling: recoverable errors ─────────────────────────────────────
  describe('error handling - recoverable errors', () => {
    test('bufferStalledError does not set kernelError', () => {
      const updateState = jest.fn();
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, updateState }),
        { wrapper },
      );
      act(() =>
        result.current.onError('event', { type: 'mediaError', details: 'bufferStalledError' }, null, null),
      );
      expect(updateState).not.toHaveBeenCalled();
    });

    test('bufferNudgeOnStall does not set kernelError', () => {
      const updateState = jest.fn();
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, updateState }),
        { wrapper },
      );
      act(() =>
        result.current.onError('event', { type: 'mediaError', details: 'bufferNudgeOnStall' }, null, null),
      );
      expect(updateState).not.toHaveBeenCalled();
    });

    test('bufferAppendError does not set kernelError', () => {
      const updateState = jest.fn();
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, updateState }),
        { wrapper },
      );
      act(() =>
        result.current.onError('event', { type: 'mediaError', details: 'bufferAppendError' }, null, null),
      );
      expect(updateState).not.toHaveBeenCalled();
    });

    test('fragParsingError does not set kernelError', () => {
      const updateState = jest.fn();
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, updateState }),
        { wrapper },
      );
      act(() =>
        result.current.onError('event', { type: 'mediaError', details: 'fragParsingError' }, null, null),
      );
      expect(updateState).not.toHaveBeenCalled();
    });

    test('networkError type does not set kernelError', () => {
      const updateState = jest.fn();
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, updateState }),
        { wrapper },
      );
      act(() =>
        result.current.onError('event', { type: 'networkError', details: 'fragLoadError' }, null, null),
      );
      expect(updateState).not.toHaveBeenCalled();
    });
  });

  // ─── Error handling: non-recoverable errors ─────────────────────────────────
  describe('error handling - non-recoverable errors', () => {
    test('non-recoverable mediaError sets kernelError', () => {
      const updateState = jest.fn();
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, updateState }),
        { wrapper },
      );
      act(() =>
        result.current.onError(
          'event',
          { type: 'mediaError', details: 'manifestIncompatibleCodecsError', error: { message: 'codec error' } },
          null,
          null,
        ),
      );
      expect(updateState).toHaveBeenCalled();
      const fn = updateState.mock.calls[0][0];
      const newState = fn({});
      expect(newState.kernelError).toBeDefined();
      expect(newState.kernelError.type).toBe('mediaError');
      expect(newState.kernelError.detail).toBe('codec error');
      expect(newState.isLoading).toBe(false);
      // playing is intentionally NOT forced to false — user intent is preserved.
    });

    test('unknown error type sets kernelError', () => {
      const updateState = jest.fn();
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, updateState }),
        { wrapper },
      );
      act(() =>
        result.current.onError('event', { type: 'fatalError', error: { message: 'something broke' } }, null, null),
      );
      expect(updateState).toHaveBeenCalled();
      const fn = updateState.mock.calls[0][0];
      const newState = fn({});
      expect(newState.kernelError.type).toBe('fatalError');
    });

    test('error with no error.message uses default message', () => {
      const updateState = jest.fn();
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, updateState }),
        { wrapper },
      );
      act(() =>
        result.current.onError('event', { type: 'otherError' }, null, null),
      );
      const fn = updateState.mock.calls[0][0];
      const newState = fn({});
      expect(newState.kernelError.detail).toBe('Something was wrong with the playback. Please try again.');
    });

    test('error with null data does not set kernelError', () => {
      // Unstructured errors (no data) are transient — the kernel error UI is only
      // shown for structured HLS/DASH/FLV errors, so state is left untouched.
      const updateState = jest.fn();
      const onError = jest.fn();
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, updateState, onError }),
        { wrapper },
      );
      act(() => result.current.onError('event', null, null, null));
      expect(onError).toHaveBeenCalledWith('event', null, null, null);
      expect(updateState).not.toHaveBeenCalled();
    });
  });

  // ─── onProgress does not update state when seeking ──────────────────────────
  describe('onProgress when seeking', () => {
    test('does not update played/loaded when seeking is true', () => {
      const updateState = jest.fn();
      const onProgress = jest.fn();
      const { result } = renderHook(
        () =>
          usePlayerProxy({
            ...baseProps,
            onProgress,
            updateState,
            playerState: { seeking: true, playbackQuality: null },
          }),
        { wrapper },
      );
      act(() => result.current.onProgress({ playedSeconds: 50, loaded: 0.5 }));
      // onProgress callback is still called
      expect(onProgress).toHaveBeenCalledWith({ playedSeconds: 50, loaded: 0.5 });
      // But updateState should NOT be called
      expect(updateState).not.toHaveBeenCalled();
    });

    test('updates played/loaded when seeking is false', () => {
      const updateState = jest.fn();
      const onProgress = jest.fn();
      const { result } = renderHook(
        () =>
          usePlayerProxy({
            ...baseProps,
            onProgress,
            updateState,
            playerState: { seeking: false, playbackQuality: null },
          }),
        { wrapper },
      );
      act(() => result.current.onProgress({ playedSeconds: 50, loaded: 0.5 }));
      expect(onProgress).toHaveBeenCalled();
      expect(updateState).toHaveBeenCalled();
      const fn = updateState.mock.calls[0][0];
      expect(fn({})).toMatchObject({ played: 50, loaded: 0.5 });
    });
  });

  // ─── onStart and onLoaded ───────────────────────────────────────────────────
  describe('onStart and onLoaded', () => {
    test('onStart calls the onStart callback', () => {
      const onStart = jest.fn();
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, onStart }),
        { wrapper },
      );
      act(() => result.current.onStart());
      expect(onStart).toHaveBeenCalled();
    });

    test('onLoaded calls the onLoaded callback with args', () => {
      const onLoaded = jest.fn();
      const { result } = renderHook(
        () => usePlayerProxy({ ...baseProps, onLoaded }),
        { wrapper },
      );
      act(() => result.current.onLoaded('loaded-event'));
      expect(onLoaded).toHaveBeenCalledWith('loaded-event');
    });
  });
});
