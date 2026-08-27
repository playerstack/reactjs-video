import { renderHook, act } from '@testing-library/react';
import useMobileSettings from '@PlayerSkin/hooks/useMobileSettings';

describe('useMobileSettings', () => {
  test('returns a mobileSettingsRef initialized to null and an openMobileSettings function', () => {
    const { result } = renderHook(() => useMobileSettings());

    expect(result.current.mobileSettingsRef).toEqual({ current: null });
    expect(typeof result.current.openMobileSettings).toBe('function');
  });

  test('openMobileSettings calls open_ on the current ref target', () => {
    const { result } = renderHook(() => useMobileSettings());

    const open_ = jest.fn();
    result.current.mobileSettingsRef.current = { open_ };

    act(() => {
      result.current.openMobileSettings();
    });

    expect(open_).toHaveBeenCalledTimes(1);
  });

  test('openMobileSettings is a no-op (does not throw) when the ref is still null', () => {
    const { result } = renderHook(() => useMobileSettings());

    expect(result.current.mobileSettingsRef.current).toBeNull();
    expect(() => {
      act(() => {
        result.current.openMobileSettings();
      });
    }).not.toThrow();
  });

  test('openMobileSettings safely optional-chains when the ref target lacks open_', () => {
    const { result } = renderHook(() => useMobileSettings());

    // Element present but without the imperative method (optional chaining on open_).
    result.current.mobileSettingsRef.current = {};

    expect(() => {
      act(() => {
        result.current.openMobileSettings();
      });
    }).not.toThrow();
  });

  test('openMobileSettings keeps a stable identity across renders', () => {
    const { result, rerender } = renderHook(() => useMobileSettings());

    const first = result.current.openMobileSettings;
    rerender();

    expect(result.current.openMobileSettings).toBe(first);
  });
});
