jest.setTimeout(30000);
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import usePlayerProxy from '@MediaPlayer/hooks/usePlayerProxy';
import { Provider } from '@context/index';

// Mock the network speed measurement to avoid real network calls
jest.mock('@playerstack/core', () => ({ ...jest.requireActual('@playerstack/core'),
  measureNetworkSpeed: jest.fn().mockResolvedValue(5.0),
  getRecommendedVideoQuality: jest.fn().mockReturnValue(1080),
}));

const wrapper = ({ children }) => <Provider language="en">{children}</Provider>;

const sources = [
  { src: 'video_1080.m3u8', resolution: 1080 },
  { src: 'video_720.m3u8', resolution: 720 },
];

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

describe('usePlayerProxy', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns videoUrl equal to url when no sources', () => {
    const { result } = renderHook(() => usePlayerProxy(baseProps), { wrapper });
    expect(result.current.videoUrl).toBe('video.mp4');
  });

  test('returns callbacks matching prop names', () => {
    const { result } = renderHook(() => usePlayerProxy(baseProps), { wrapper });
    expect(typeof result.current.onBuffer).toBe('function');
    expect(typeof result.current.onBufferEnd).toBe('function');
    expect(typeof result.current.onDuration).toBe('function');
    expect(typeof result.current.onEnded).toBe('function');
    expect(typeof result.current.onError).toBe('function');
    expect(typeof result.current.onPause).toBe('function');
    expect(typeof result.current.onPlay).toBe('function');
    expect(typeof result.current.onProgress).toBe('function');
    expect(typeof result.current.onReady).toBe('function');
    expect(typeof result.current.onSeek).toBe('function');
  });

  test('onDuration calls onDuration prop and updateState', () => {
    const updateState = jest.fn();
    const onDuration = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, onDuration, updateState }), { wrapper });
    act(() => result.current.onDuration(120));
    expect(onDuration).toHaveBeenCalledWith(120);
    expect(updateState).toHaveBeenCalled();
    const fn = updateState.mock.calls[0][0];
    expect(fn({ duration: 0 })).toMatchObject({ duration: 120 });
  });

  test('onEnded calls onEnded prop and sets isEnded', () => {
    const updateState = jest.fn();
    const onEnded = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, onEnded, updateState }), { wrapper });
    act(() => result.current.onEnded());
    expect(onEnded).toHaveBeenCalled();
    const fn = updateState.mock.calls[0][0];
    expect(fn({ isEnded: false })).toMatchObject({ isEnded: true });
  });

  test('onEnablePIP sets isPIP to true', () => {
    const updateState = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, updateState }), { wrapper });
    act(() => result.current.onEnablePIP());
    const fn = updateState.mock.calls[0][0];
    expect(fn({ isPIP: false })).toMatchObject({ isPIP: true });
  });

  test('onDisablePIP sets isPIP to false', () => {
    const updateState = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, updateState }), { wrapper });
    act(() => result.current.onDisablePIP());
    const fn = updateState.mock.calls[0][0];
    expect(fn({ isPIP: true })).toMatchObject({ isPIP: false });
  });

  test('onPause calls onPause prop and sets playing to false', () => {
    const updateState = jest.fn();
    const onPause = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, onPause, updateState }), { wrapper });
    act(() => result.current.onPause());
    expect(onPause).toHaveBeenCalled();
    const fn = updateState.mock.calls[0][0];
    expect(fn({ playing: true })).toMatchObject({ playing: false });
  });

  test('onPlay calls onPlay prop and sets playing to true', () => {
    const updateState = jest.fn();
    const onPlay = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, onPlay, updateState }), { wrapper });
    act(() => result.current.onPlay({ hasAudio: true }));
    expect(onPlay).toHaveBeenCalled();
    const fn = updateState.mock.calls[0][0];
    expect(fn({ playing: false })).toMatchObject({ playing: true });
  });

  test('onPlay sets hasAudio from event when not prevented', () => {
    const updateState = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, updateState }), { wrapper });
    act(() => result.current.onPlay({ hasAudio: false }));
    const fn = updateState.mock.calls[0][0];
    expect(fn({})).toMatchObject({ hasAudio: false });
  });

  test('onPlay sets hasAudio to true when prevented', () => {
    const updateState = jest.fn();
    const props = { ...baseProps, updateState, extraProps: { ...baseProps.extraProps, prevented: true } };
    const { result } = renderHook(() => usePlayerProxy(props), { wrapper });
    act(() => result.current.onPlay({ hasAudio: false }));
    const fn = updateState.mock.calls[0][0];
    expect(fn({})).toMatchObject({ hasAudio: true });
  });

  test('onReady calls onReady prop and sets isLoading to false', () => {
    const updateState = jest.fn();
    const onReady = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, onReady, updateState }), { wrapper });
    act(() => result.current.onReady());
    expect(onReady).toHaveBeenCalled();
    const fn = updateState.mock.calls[0][0];
    expect(fn({ isLoading: true })).toMatchObject({ isLoading: false });
  });

  test('onSeek calls onSeek prop and updates seek state', () => {
    const updateState = jest.fn();
    const onSeek = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, onSeek, updateState }), { wrapper });
    act(() => result.current.onSeek(30));
    expect(onSeek).toHaveBeenCalledWith(30);
    const fn = updateState.mock.calls[0][0];
    expect(fn({ seek: 0 })).toMatchObject({ seek: 30 });
  });

  test('onPlayBackRateChange updates playbackRate', () => {
    const updateState = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, updateState }), { wrapper });
    act(() => result.current.onPlayBackRateChange(1.5));
    const fn = updateState.mock.calls[0][0];
    expect(fn({})).toMatchObject({ playbackRate: 1.5 });
  });

  test('onPlayBackQualityChange updates playbackQuality', () => {
    const updateState = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, updateState }), { wrapper });
    act(() => result.current.onPlayBackQualityChange(720));
    const fn = updateState.mock.calls[0][0];
    expect(fn({})).toMatchObject({ playbackQuality: 720 });
  });

  test('onProgress calls onProgress prop and updates played/loaded when not seeking', () => {
    const updateState = jest.fn();
    const onProgress = jest.fn();
    const { result } = renderHook(
      () => usePlayerProxy({ ...baseProps, onProgress, updateState, playerState: { seeking: false, playbackQuality: null } }),
      { wrapper },
    );
    act(() => result.current.onProgress({ playedSeconds: 30, loaded: 0.25 }));
    expect(onProgress).toHaveBeenCalled();
    const fn = updateState.mock.calls[0][0];
    expect(fn({})).toMatchObject({ played: 30, loaded: 0.25 });
  });

  test('onProgress does not update state when seeking', () => {
    const updateState = jest.fn();
    const { result } = renderHook(
      () => usePlayerProxy({ ...baseProps, updateState, playerState: { seeking: true, playbackQuality: null } }),
      { wrapper },
    );
    act(() => result.current.onProgress({ playedSeconds: 30, loaded: 0.25 }));
    // onProgress prop is called but updateState should not be called with played
    expect(updateState).not.toHaveBeenCalled();
  });

  test('onError sets kernelError in state for non-skipped errors', () => {
    const updateState = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, updateState }), { wrapper });
    const errorData = { type: 'otherError', error: { message: 'decode error' } };
    act(() => result.current.onError('event', errorData, null, null));
    const fn = updateState.mock.calls[0][0];
    const newState = fn({});
    expect(newState.kernelError).toBeDefined();
    expect(newState.kernelError.type).toBe('otherError');
  });

  test('onError skips state update for networkError type', () => {
    const updateState = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, updateState }), { wrapper });
    act(() => result.current.onError('event', { type: 'networkError' }, null, null));
    expect(updateState).not.toHaveBeenCalled();
  });

  test('onError skips state update for recoverable mediaError bufferStalledError', () => {
    const updateState = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, updateState }), { wrapper });
    act(() => result.current.onError('event', { type: 'mediaError', details: 'bufferStalledError' }, null, null));
    expect(updateState).not.toHaveBeenCalled();
  });

  test('onError skips state update for recoverable mediaError bufferNudgeOnStall', () => {
    const updateState = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, updateState }), { wrapper });
    act(() => result.current.onError('event', { type: 'mediaError', details: 'bufferNudgeOnStall' }, null, null));
    expect(updateState).not.toHaveBeenCalled();
  });

  test('onError skips state update for recoverable mediaError bufferAppendError', () => {
    const updateState = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, updateState }), { wrapper });
    act(() => result.current.onError('event', { type: 'mediaError', details: 'bufferAppendError' }, null, null));
    expect(updateState).not.toHaveBeenCalled();
  });

  test('onError skips state update for recoverable mediaError fragParsingError', () => {
    const updateState = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, updateState }), { wrapper });
    act(() => result.current.onError('event', { type: 'mediaError', details: 'fragParsingError' }, null, null));
    expect(updateState).not.toHaveBeenCalled();
  });

  test('onError shows error for non-recoverable mediaError', () => {
    const updateState = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, updateState }), { wrapper });
    act(() =>
      result.current.onError(
        'event',
        { type: 'mediaError', details: 'manifestIncompatibleCodecsError', error: { message: 'codec not supported' } },
        null,
        null,
      ),
    );
    expect(updateState).toHaveBeenCalled();
    const fn = updateState.mock.calls[0][0];
    const newState = fn({});
    expect(newState.kernelError).toBeDefined();
    expect(newState.kernelError.type).toBe('mediaError');
  });

  test('onError always calls onError prop callback even for skipped errors', () => {
    const onError = jest.fn();
    const updateState = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, onError, updateState }), { wrapper });
    act(() => result.current.onError('event', { type: 'mediaError', details: 'bufferStalledError' }, null, null));
    expect(onError).toHaveBeenCalledWith('event', { type: 'mediaError', details: 'bufferStalledError' }, null, null);
    expect(updateState).not.toHaveBeenCalled();
  });

  test('onError with null data does not touch state', () => {
    // Unstructured errors (no data) are transient; the kernel error UI is only
    // shown for structured HLS/DASH/FLV errors.
    const updateState = jest.fn();
    const onError = jest.fn();
    const { result } = renderHook(() => usePlayerProxy({ ...baseProps, updateState, onError }), { wrapper });
    act(() => result.current.onError('event', null, null, null));
    expect(onError).toHaveBeenCalledWith('event', null, null, null);
    expect(updateState).not.toHaveBeenCalled();
  });

  test('logs error when fullHDQualityBreak is not in sources resolutions', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const props = {
      ...baseProps,
      extraProps: {
        url: '',
        sources: [{ src: 'v.m3u8', resolution: 720 }],
        fullHDQualityBreak: 1080,
        prevented: false,
      },
    };
    renderHook(() => usePlayerProxy(props), { wrapper });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid fullHDQualityBreak'),
    );
    consoleSpy.mockRestore();
  });

  test('uses sources for videoUrl when playbackQuality is set', async () => {
    const { result } = renderHook(
      () =>
        usePlayerProxy({
          ...baseProps,
          playerState: { seeking: false, playbackQuality: 720 },
          extraProps: { url: '', sources, fullHDQualityBreak: 1080, prevented: false },
        }),
      { wrapper },
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.videoUrl).toBe('video_720.m3u8');
  });

  test('falls back to sources[0] when playbackQuality not in sources', async () => {
    const { result } = renderHook(
      () =>
        usePlayerProxy({
          ...baseProps,
          playerState: { seeking: false, playbackQuality: 480 },
          extraProps: { url: '', sources, fullHDQualityBreak: 1080, prevented: false },
        }),
      { wrapper },
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.videoUrl).toBe('video_1080.m3u8');
  });

  test('does not re-run auto-quality when sources array reference changes but content is equal', async () => {
    const updateState = jest.fn();
    const { rerender } = renderHook(
      (props) => usePlayerProxy(props),
      {
        wrapper,
        initialProps: {
          ...baseProps,
          updateState,
          playerState: { seeking: false, playbackQuality: 720 },
          extraProps: {
            url: '',
            sources: [
              { src: 'video_1080.m3u8', resolution: 1080 },
              { src: 'video_720.m3u8', resolution: 720 },
            ],
            fullHDQualityBreak: 1080,
            prevented: false,
          },
        },
      },
    );
    await act(async () => {
      await Promise.resolve();
    });
    const callsAfterFirst = updateState.mock.calls.length;

    // Re-render with a NEW array reference but identical content (simulates inline array prop)
    rerender({
      ...baseProps,
      updateState,
      playerState: { seeking: false, playbackQuality: 720 },
      extraProps: {
        url: '',
        sources: [
          { src: 'video_1080.m3u8', resolution: 1080 },
          { src: 'video_720.m3u8', resolution: 720 },
        ],
        fullHDQualityBreak: 1080,
        prevented: false,
      },
    });
    await act(async () => {
      await Promise.resolve();
    });

    // The auto-quality measurement must NOT run again, so no extra updateState calls
    expect(updateState.mock.calls.length).toBe(callsAfterFirst);
  }, 30000);

  test('keeps manually selected videoUrl after unrelated re-render', async () => {
    const inlineSources = () => [
      { src: 'video_1080.m3u8', resolution: 1080 },
      { src: 'video_720.m3u8', resolution: 720 },
    ];
    const { result, rerender } = renderHook((props) => usePlayerProxy(props), {
      wrapper,
      initialProps: {
        ...baseProps,
        playerState: { seeking: false, playbackQuality: 720 },
        extraProps: { url: '', sources: inlineSources(), fullHDQualityBreak: 1080, prevented: false },
      },
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.videoUrl).toBe('video_720.m3u8');

    // Unrelated re-render with a fresh sources array reference (same content)
    rerender({
      ...baseProps,
      playerState: { seeking: false, playbackQuality: 720 },
      extraProps: { url: '', sources: inlineSources(), fullHDQualityBreak: 1080, prevented: false },
    });
    await act(async () => {
      await Promise.resolve();
    });
    // Manual selection preserved
    expect(result.current.videoUrl).toBe('video_720.m3u8');
  });
});
