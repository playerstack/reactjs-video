import { renderHook, act } from '@testing-library/react';

import useScrubState from '@PlayerSkin/hooks/useScrubState';
import { createWebSpriteAdapter } from '@utils/spriteAdapter';

// Mock the sprite adapter factory so we can assert the hook builds it exactly once
// (stable adapter across renders) without exercising real browser I/O (fetch/Image).
jest.mock('@utils/spriteAdapter', () => ({
  createWebSpriteAdapter: jest.fn(() => ({ __sprite: true })),
}));

describe('useScrubState', () => {
  test('returns the expected wiring surface', () => {
    const { result } = renderHook(() => useScrubState());

    expect(result.current.spritePreviewRef).toEqual({ current: null });
    expect(result.current.spriteAdapter).toEqual({ __sprite: true });
    expect(result.current.scrubbing).toBe(false);
    expect(result.current.scrubTime).toBe(0);
    expect(typeof result.current.handleScrubbingRequest).toBe('function');
  });

  test('spriteAdapter is built once and stable across renders', () => {
    const { result, rerender } = renderHook(() => useScrubState());

    const firstAdapter = result.current.spriteAdapter;
    const firstRef = result.current.spritePreviewRef;
    const firstHandler = result.current.handleScrubbingRequest;

    rerender();

    expect(result.current.spriteAdapter).toBe(firstAdapter);
    expect(result.current.spritePreviewRef).toBe(firstRef);
    expect(result.current.handleScrubbingRequest).toBe(firstHandler);
    // Memoized: the factory ran exactly once despite the extra render.
    expect(createWebSpriteAdapter).toHaveBeenCalledTimes(1);
  });

  test('spriteAdapter factory is fed a getter reading the current ref target', () => {
    const { result } = renderHook(() => useScrubState());

    const getContainer = createWebSpriteAdapter.mock.calls[0][0];
    expect(typeof getContainer).toBe('function');
    expect(getContainer()).toBe(null);

    const host = document.createElement('div');
    result.current.spritePreviewRef.current = host;
    expect(getContainer()).toBe(host);
  });

  test('handleScrubbingRequest mirrors scrubbing and scrubTime from the event detail', () => {
    const { result } = renderHook(() => useScrubState());

    act(() => {
      result.current.handleScrubbingRequest({ detail: { seeking: true, time: 42 } });
    });

    expect(result.current.scrubbing).toBe(true);
    expect(result.current.scrubTime).toBe(42);

    act(() => {
      result.current.handleScrubbingRequest({ detail: { seeking: false, time: 0 } });
    });

    expect(result.current.scrubbing).toBe(false);
    expect(result.current.scrubTime).toBe(0);
  });

  test('handleScrubbingRequest coerces truthiness of seeking', () => {
    const { result } = renderHook(() => useScrubState());

    act(() => {
      // Truthy non-boolean seeking → mirrored as boolean true.
      result.current.handleScrubbingRequest({ detail: { seeking: 1, time: 10 } });
    });
    expect(result.current.scrubbing).toBe(true);
    expect(result.current.scrubTime).toBe(10);

    act(() => {
      // Falsy non-boolean seeking → mirrored as boolean false.
      result.current.handleScrubbingRequest({ detail: { seeking: 0, time: 5 } });
    });
    expect(result.current.scrubbing).toBe(false);
    expect(result.current.scrubTime).toBe(5);
  });

  test('handleScrubbingRequest ignores non-numeric time, preserving previous scrubTime', () => {
    const { result } = renderHook(() => useScrubState());

    act(() => {
      result.current.handleScrubbingRequest({ detail: { seeking: true, time: 20 } });
    });
    expect(result.current.scrubTime).toBe(20);

    act(() => {
      // time missing → scrubbing still mirrored, scrubTime untouched.
      result.current.handleScrubbingRequest({ detail: { seeking: false } });
    });
    expect(result.current.scrubbing).toBe(false);
    expect(result.current.scrubTime).toBe(20);
  });

  test('handleScrubbingRequest is a no-op when the event has no detail', () => {
    const { result } = renderHook(() => useScrubState());

    act(() => {
      result.current.handleScrubbingRequest({ detail: { seeking: true, time: 7 } });
    });
    expect(result.current.scrubbing).toBe(true);
    expect(result.current.scrubTime).toBe(7);

    act(() => {
      result.current.handleScrubbingRequest({});
    });
    act(() => {
      result.current.handleScrubbingRequest(undefined);
    });

    // State unchanged by the detail-less calls.
    expect(result.current.scrubbing).toBe(true);
    expect(result.current.scrubTime).toBe(7);
  });

  test('is a thin wrapper: no timers or intervals are scheduled', () => {
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    try {
      const { result, rerender } = renderHook(() => useScrubState());

      act(() => {
        result.current.handleScrubbingRequest({ detail: { seeking: true, time: 3 } });
      });
      rerender();
      act(() => {
        result.current.handleScrubbingRequest({ detail: { seeking: false, time: 0 } });
      });

      expect(setTimeoutSpy).not.toHaveBeenCalled();
      expect(setIntervalSpy).not.toHaveBeenCalled();
    } finally {
      setTimeoutSpy.mockRestore();
      setIntervalSpy.mockRestore();
      jest.useRealTimers();
    }
  });
});
