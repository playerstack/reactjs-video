import { renderHook, act } from '@testing-library/react';

import useCaptionToggle from '@PlayerSkin/hooks/useCaptionToggle';

const CAPTIONS = [{ language: 'en' }, { language: 'es' }];

describe('useCaptionToggle', () => {
  test('returns the expected wiring surface', () => {
    const { result } = renderHook(() =>
      useCaptionToggle({ activeCaption: null, captions: CAPTIONS, onCaptionChange: jest.fn() }),
    );

    expect(typeof result.current.handleCaptionToggle).toBe('function');
  });

  test('toggles OFF (calls onCaptionChange with null) when a caption is active', () => {
    const onCaptionChange = jest.fn();
    const { result } = renderHook(() => useCaptionToggle({ activeCaption: 'en', captions: CAPTIONS, onCaptionChange }));

    act(() => {
      result.current.handleCaptionToggle();
    });

    expect(onCaptionChange).toHaveBeenCalledTimes(1);
    expect(onCaptionChange).toHaveBeenCalledWith(null);
  });

  test('restores the LAST remembered active track when toggling back ON', () => {
    const onCaptionChange = jest.fn();
    // Drive activeCaption 'es' → null so the effect remembers 'es' as the last active track.
    const { result, rerender } = renderHook(
      ({ activeCaption }) => useCaptionToggle({ activeCaption, captions: CAPTIONS, onCaptionChange }),
      { initialProps: { activeCaption: 'es' } },
    );

    rerender({ activeCaption: null });

    act(() => {
      result.current.handleCaptionToggle();
    });

    expect(onCaptionChange).toHaveBeenCalledTimes(1);
    // Remembered 'es' (not the first track 'en') is restored.
    expect(onCaptionChange).toHaveBeenCalledWith('es');
  });

  test('falls back to the FIRST track when none was ever remembered', () => {
    const onCaptionChange = jest.fn();
    const { result } = renderHook(() => useCaptionToggle({ activeCaption: null, captions: CAPTIONS, onCaptionChange }));

    act(() => {
      result.current.handleCaptionToggle();
    });

    expect(onCaptionChange).toHaveBeenCalledTimes(1);
    expect(onCaptionChange).toHaveBeenCalledWith('en');
  });

  test('does nothing when inactive and there are no captions available', () => {
    const onCaptionChange = jest.fn();
    const { result } = renderHook(() => useCaptionToggle({ activeCaption: null, captions: [], onCaptionChange }));

    act(() => {
      result.current.handleCaptionToggle();
    });

    expect(onCaptionChange).not.toHaveBeenCalled();
  });

  test('does not throw when onCaptionChange is not provided', () => {
    const { result } = renderHook(() => useCaptionToggle({ activeCaption: 'en', captions: CAPTIONS }));

    expect(() => {
      act(() => {
        result.current.handleCaptionToggle();
      });
    }).not.toThrow();
  });

  test('stops event propagation when the event exposes stopPropagation', () => {
    const onCaptionChange = jest.fn();
    const { result } = renderHook(() => useCaptionToggle({ activeCaption: 'en', captions: CAPTIONS, onCaptionChange }));
    const stopPropagation = jest.fn();

    act(() => {
      result.current.handleCaptionToggle({ stopPropagation });
    });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onCaptionChange).toHaveBeenCalledWith(null);
  });

  test('remembered track is updated as activeCaption transitions across rerenders', () => {
    const onCaptionChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ activeCaption }) => useCaptionToggle({ activeCaption, captions: CAPTIONS, onCaptionChange }),
      { initialProps: { activeCaption: 'en' } },
    );

    // 'en' active, then off → remembers 'en'.
    rerender({ activeCaption: null });
    act(() => {
      result.current.handleCaptionToggle();
    });
    expect(onCaptionChange).toHaveBeenLastCalledWith('en');

    // Now 'es' becomes active, then off → the remembered track updates to 'es'.
    rerender({ activeCaption: 'es' });
    rerender({ activeCaption: null });
    act(() => {
      result.current.handleCaptionToggle();
    });
    expect(onCaptionChange).toHaveBeenLastCalledWith('es');
  });

  test('unmounts cleanly without scheduling timers (thin wrapper, ref cleanup)', () => {
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    try {
      const { result, unmount } = renderHook(() =>
        useCaptionToggle({ activeCaption: 'en', captions: CAPTIONS, onCaptionChange: jest.fn() }),
      );

      const handler = result.current.handleCaptionToggle;
      expect(() => unmount()).not.toThrow();

      // Calling the retained handler after unmount is a safe no-op regarding timers.
      act(() => {
        handler();
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
