import { renderHook } from '@testing-library/react';
import { useDeepCompareMemoize } from '@hooks/useDeepCompareMemoize';

describe('useDeepCompareMemoize', () => {
  test('returns the same reference on first render', () => {
    const value = [{ src: 'a', resolution: 720 }];
    const { result } = renderHook(() => useDeepCompareMemoize(value));
    expect(result.current).toBe(value);
  });

  test('keeps the same reference when content is deeply equal but reference differs', () => {
    const { result, rerender } = renderHook((v) => useDeepCompareMemoize(v), {
      initialProps: [{ src: 'a', resolution: 720 }],
    });
    const first = result.current;

    // New array, identical content
    rerender([{ src: 'a', resolution: 720 }]);
    expect(result.current).toBe(first);
  });

  test('returns a new reference when content changes', () => {
    const { result, rerender } = renderHook((v) => useDeepCompareMemoize(v), {
      initialProps: [{ src: 'a', resolution: 720 }],
    });
    const first = result.current;

    rerender([{ src: 'b', resolution: 1080 }]);
    expect(result.current).not.toBe(first);
    expect(result.current).toEqual([{ src: 'b', resolution: 1080 }]);
  });

  test('handles primitive values', () => {
    const { result, rerender } = renderHook((v) => useDeepCompareMemoize(v), {
      initialProps: 5,
    });
    expect(result.current).toBe(5);
    rerender(5);
    expect(result.current).toBe(5);
    rerender(10);
    expect(result.current).toBe(10);
  });

  test('handles nested object changes', () => {
    const { result, rerender } = renderHook((v) => useDeepCompareMemoize(v), {
      initialProps: { a: { b: 1 } },
    });
    const first = result.current;

    rerender({ a: { b: 1 } });
    expect(result.current).toBe(first);

    rerender({ a: { b: 2 } });
    expect(result.current).not.toBe(first);
  });

  test('handles empty arrays', () => {
    const { result, rerender } = renderHook((v) => useDeepCompareMemoize(v), {
      initialProps: [],
    });
    const first = result.current;
    rerender([]);
    expect(result.current).toBe(first);
  });
});
