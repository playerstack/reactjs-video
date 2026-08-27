import { renderHook, act } from '@testing-library/react';

import { useDvrDragPosition } from '@PlayerSkin/hooks/useDvrDragPosition';

/**
 * Spec for the skin-local thin `useDvrDragPosition` hook (parity with the monolith's DVR
 * drag-position pinning). Asserts the derivations from `dvrState`, that `pinAndSeek` pins the visual
 * `liveDragPosition` and routes through `seekToDVRPosition`, that `effectiveDVRPosition` prefers the
 * pinned value, that the catch-up effect clears the pin with the exact `< 2` tolerance, and that the
 * hook unmounts cleanly. The hook uses only React refs/state (no context), so no Provider is needed.
 */
describe('useDvrDragPosition', () => {
  it('derives hasDVR/sliderPosition/sliderDuration from dvrState', () => {
    const seekToDVRPosition = jest.fn();
    const { result } = renderHook(() =>
      useDvrDragPosition({
        dvrState: { hasDVR: true, sliderDuration: 120, sliderPosition: 40 },
        liveDVR: {},
        seekToDVRPosition,
      }),
    );

    expect(result.current.hasDVR).toBe(true);
    expect(result.current.sliderDuration).toBe(120);
    expect(result.current.sliderPosition).toBe(40);
  });

  it('falls back to safe defaults when dvrState is null/undefined', () => {
    const { result: nullResult } = renderHook(() =>
      useDvrDragPosition({ dvrState: null, liveDVR: null, seekToDVRPosition: jest.fn() }),
    );
    expect(nullResult.current.hasDVR).toBe(false);
    expect(nullResult.current.sliderDuration).toBe(0);
    expect(nullResult.current.sliderPosition).toBe(0);

    const { result: undefinedResult } = renderHook(() =>
      useDvrDragPosition({ dvrState: undefined, liveDVR: undefined, seekToDVRPosition: jest.fn() }),
    );
    expect(undefinedResult.current.hasDVR).toBe(false);
    expect(undefinedResult.current.sliderDuration).toBe(0);
    expect(undefinedResult.current.sliderPosition).toBe(0);
  });

  it('effectiveDVRPosition equals sliderPosition when nothing is pinned', () => {
    const { result } = renderHook(() =>
      useDvrDragPosition({
        dvrState: { hasDVR: true, sliderDuration: 100, sliderPosition: 30 },
        liveDVR: {},
        seekToDVRPosition: jest.fn(),
      }),
    );

    expect(result.current.effectiveDVRPosition).toBe(30);
  });

  it('pinAndSeek pins liveDragPosition and calls seekToDVRPosition(time)', () => {
    const seekToDVRPosition = jest.fn();
    // sliderPosition far from the pinned value so the catch-up effect does NOT clear it.
    const { result } = renderHook(() =>
      useDvrDragPosition({
        dvrState: { hasDVR: true, sliderDuration: 100, sliderPosition: 10 },
        liveDVR: {},
        seekToDVRPosition,
      }),
    );

    act(() => {
      result.current.pinAndSeek(80);
    });

    expect(seekToDVRPosition).toHaveBeenCalledTimes(1);
    expect(seekToDVRPosition).toHaveBeenCalledWith(80);
    // effectiveDVRPosition now prefers the pinned value over sliderPosition (10).
    expect(result.current.effectiveDVRPosition).toBe(80);
  });

  it('does not throw when seekToDVRPosition is absent (optional chaining)', () => {
    const { result } = renderHook(() =>
      useDvrDragPosition({
        dvrState: { hasDVR: true, sliderDuration: 100, sliderPosition: 10 },
        liveDVR: {},
        seekToDVRPosition: undefined,
      }),
    );

    expect(() =>
      act(() => {
        result.current.pinAndSeek(50);
      }),
    ).not.toThrow();
    expect(result.current.effectiveDVRPosition).toBe(50);
  });

  it('catch-up effect clears the pin when abs(sliderPosition - liveDragPosition) < 2', () => {
    const seekToDVRPosition = jest.fn();
    const { result, rerender } = renderHook(
      ({ sliderPosition }) =>
        useDvrDragPosition({
          dvrState: { hasDVR: true, sliderDuration: 100, sliderPosition },
          liveDVR: {},
          seekToDVRPosition,
        }),
      { initialProps: { sliderPosition: 10 } },
    );

    // Pin at 80 while the live window is still far away (diff 70 >= 2 -> stays pinned).
    act(() => {
      result.current.pinAndSeek(80);
    });
    expect(result.current.effectiveDVRPosition).toBe(80);

    // Video catches up to within the tolerance (|79.5 - 80| = 0.5 < 2) -> pin cleared.
    rerender({ sliderPosition: 79.5 });
    expect(result.current.effectiveDVRPosition).toBe(79.5);
  });

  it('catch-up effect keeps the pin when the gap is exactly the tolerance boundary (>= 2)', () => {
    const seekToDVRPosition = jest.fn();
    const { result, rerender } = renderHook(
      ({ sliderPosition }) =>
        useDvrDragPosition({
          dvrState: { hasDVR: true, sliderDuration: 100, sliderPosition },
          liveDVR: {},
          seekToDVRPosition,
        }),
      { initialProps: { sliderPosition: 10 } },
    );

    act(() => {
      result.current.pinAndSeek(80);
    });

    // |78 - 80| = 2, which is NOT < 2 -> the pin must remain.
    rerender({ sliderPosition: 78 });
    expect(result.current.effectiveDVRPosition).toBe(80);
  });

  it('unmounts cleanly without throwing', () => {
    const { result, unmount } = renderHook(() =>
      useDvrDragPosition({
        dvrState: { hasDVR: true, sliderDuration: 100, sliderPosition: 10 },
        liveDVR: {},
        seekToDVRPosition: jest.fn(),
      }),
    );

    act(() => {
      result.current.pinAndSeek(50);
    });

    expect(() => unmount()).not.toThrow();
  });
});
