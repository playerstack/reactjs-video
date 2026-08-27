import { renderHook } from '@testing-library/react';
import useAdActiveAttribute from '@PlayerSkin/hooks/useAdActiveAttribute';

/**
 * `useAdActiveAttribute` is a thin skin-I/O wrapper: it reflects ad presence onto the controller
 * host by setting/removing the `data-ad-active` attribute, so the Style_Layer's
 * `playerstack-media-controller[data-ad-active]` rules resolve. The tests build a controllerRef
 * pointing at a REAL DOM element and assert `element.getAttribute('data-ad-active')` before/after
 * flipping `adPresent`.
 */

// Build a controllerRef whose `current` is a real DOM node the hook can mutate.
function createControllerRef() {
  const controller = document.createElement('playerstack-media-controller');
  document.body.appendChild(controller);
  return { controllerRef: { current: controller }, controller };
}

describe('useAdActiveAttribute', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('attribute reflection', () => {
    test('sets data-ad-active="true" on the controller host when adPresent is true', () => {
      const { controllerRef, controller } = createControllerRef();

      renderHook(() => useAdActiveAttribute({ controllerRef, adPresent: true }));

      expect(controller.getAttribute('data-ad-active')).toBe('true');
    });

    test('does not set data-ad-active when adPresent is false', () => {
      const { controllerRef, controller } = createControllerRef();

      renderHook(() => useAdActiveAttribute({ controllerRef, adPresent: false }));

      expect(controller.getAttribute('data-ad-active')).toBeNull();
    });
  });

  describe('keyed re-run on adPresent change', () => {
    test('removes the attribute when adPresent flips from true to false', () => {
      const { controllerRef, controller } = createControllerRef();

      const { rerender } = renderHook(({ adPresent }) => useAdActiveAttribute({ controllerRef, adPresent }), {
        initialProps: { adPresent: true },
      });
      expect(controller.getAttribute('data-ad-active')).toBe('true');

      rerender({ adPresent: false });

      expect(controller.getAttribute('data-ad-active')).toBeNull();
    });

    test('adds the attribute when adPresent flips from false to true', () => {
      const { controllerRef, controller } = createControllerRef();

      const { rerender } = renderHook(({ adPresent }) => useAdActiveAttribute({ controllerRef, adPresent }), {
        initialProps: { adPresent: false },
      });
      expect(controller.getAttribute('data-ad-active')).toBeNull();

      rerender({ adPresent: true });

      expect(controller.getAttribute('data-ad-active')).toBe('true');
    });
  });

  describe('no-op / cleanup', () => {
    test('is a no-op when the controller ref is empty', () => {
      const controllerRef = { current: null };

      expect(() => renderHook(() => useAdActiveAttribute({ controllerRef, adPresent: true }))).not.toThrow();
    });

    test('does not throw on unmount', () => {
      const { controllerRef } = createControllerRef();

      const { unmount } = renderHook(() => useAdActiveAttribute({ controllerRef, adPresent: true }));

      expect(() => unmount()).not.toThrow();
    });
  });
});
