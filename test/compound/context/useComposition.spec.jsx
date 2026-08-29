import React from 'react';
import { renderHook } from '@testing-library/react';
import { useComposition } from '@compound/context/useComposition';
import { CompositionContext } from '@compound/context/CompositionContext';

// Validates Property 7 (Disponibilidad de Context) — Requirements 4.7 and 4.8.
describe('useComposition', () => {
  test('throws the expected error when used outside <Player> (no Provider)', () => {
    // React reports the render error through console.error; silence it for a clean
    // test report and restore the original implementation afterwards.
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      expect(() => renderHook(() => useComposition())).toThrow(
        '[playerstack] Composable parts must be rendered inside <Player>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  test('returns the provided manifest when rendered inside a CompositionContext Provider', () => {
    const manifest = {
      mode: 'custom',
      parts: new Set(['PlayButton', 'Volume']),
      config: {},
      order: ['PlayButton', 'Volume'],
    };
    const wrapper = ({ children }) => (
      <CompositionContext.Provider value={manifest}>{children}</CompositionContext.Provider>
    );

    const { result } = renderHook(() => useComposition(), { wrapper });

    expect(result.current).toBe(manifest);
  });
});
