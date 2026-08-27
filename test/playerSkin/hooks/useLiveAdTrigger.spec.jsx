import { renderHook, act } from '@testing-library/react';
import useLiveAdTrigger from '@PlayerSkin/hooks/useLiveAdTrigger';

describe('useLiveAdTrigger', () => {
  test('initial liveAdTrigger is null when no liveAd config is provided', () => {
    const triggerAdRef = { current: null };
    const { result } = renderHook(({ liveAd }) => useLiveAdTrigger({ liveAd, triggerAdRef }), {
      initialProps: { liveAd: null },
    });

    expect(result.current.liveAdTrigger).toBeNull();
  });

  test('wires triggerAdRef.current to the state setter', () => {
    const triggerAdRef = { current: null };
    renderHook(({ liveAd }) => useLiveAdTrigger({ liveAd, triggerAdRef }), {
      initialProps: { liveAd: null },
    });

    expect(typeof triggerAdRef.current).toBe('function');
  });

  test('liveAd transition (null → non-null config) updates liveAdTrigger', () => {
    const triggerAdRef = { current: null };
    const config = { id: 'break-1', duration: 30 };
    const { result, rerender } = renderHook(({ liveAd }) => useLiveAdTrigger({ liveAd, triggerAdRef }), {
      initialProps: { liveAd: null },
    });

    expect(result.current.liveAdTrigger).toBeNull();

    rerender({ liveAd: config });

    expect(result.current.liveAdTrigger).toBe(config);
  });

  test('triggerAdRef setter fires an ad break imperatively', () => {
    const triggerAdRef = { current: null };
    const config = { id: 'imperative-break' };
    const { result } = renderHook(({ liveAd }) => useLiveAdTrigger({ liveAd, triggerAdRef }), {
      initialProps: { liveAd: null },
    });

    act(() => {
      triggerAdRef.current(config);
    });

    expect(result.current.liveAdTrigger).toBe(config);
  });

  test('does not re-trigger when the same liveAd reference persists across renders', () => {
    const triggerAdRef = { current: null };
    const config = { id: 'break-1' };
    const { result, rerender } = renderHook(({ liveAd }) => useLiveAdTrigger({ liveAd, triggerAdRef }), {
      initialProps: { liveAd: config },
    });

    expect(result.current.liveAdTrigger).toBe(config);

    // Manually reset the state, then rerender with the SAME reference: the
    // transition effect must not fire again because liveAd === prevLiveAdRef.
    act(() => {
      triggerAdRef.current(null);
    });
    expect(result.current.liveAdTrigger).toBeNull();

    rerender({ liveAd: config });

    expect(result.current.liveAdTrigger).toBeNull();
  });

  test('triggers again when a new non-null config reference is provided', () => {
    const triggerAdRef = { current: null };
    const first = { id: 'break-1' };
    const second = { id: 'break-2' };
    const { result, rerender } = renderHook(({ liveAd }) => useLiveAdTrigger({ liveAd, triggerAdRef }), {
      initialProps: { liveAd: first },
    });

    expect(result.current.liveAdTrigger).toBe(first);

    rerender({ liveAd: second });

    expect(result.current.liveAdTrigger).toBe(second);
  });

  test('cleanup on unmount does not throw', () => {
    const triggerAdRef = { current: null };
    const { unmount } = renderHook(({ liveAd }) => useLiveAdTrigger({ liveAd, triggerAdRef }), {
      initialProps: { liveAd: null },
    });

    expect(() => unmount()).not.toThrow();
  });
});
