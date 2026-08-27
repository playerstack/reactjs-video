import React from 'react';
import { render } from '@testing-library/react';
import useSkinVideoRef from '@PlayerSkin/hooks/useSkinVideoRef';

/**
 * `useSkinVideoRef` is a thin skin-I/O wrapper: it resolves the real `<video>` sibling of the
 * `playerstack-media-controller` into a stable ref and flips `videoReady`. The DOM resolution uses
 * `controller.parentElement ?? controller` then `querySelector('video')`, so the tests build a
 * wrapper parent that contains both a controller node and a sibling `<video>`.
 */

// Renders the hook, exposing its latest return value via `results.current`.
function TestComponent({ controllerRef, url, loading, onResult }) {
  const result = useSkinVideoRef({ controllerRef, url, loading });
  onResult(result);
  return null;
}

function renderHook(props) {
  const results = { current: null };
  const onResult = (r) => {
    results.current = r;
  };
  const view = render(<TestComponent {...props} onResult={onResult} />);
  return { results, view };
}

/**
 * Build a DOM where a wrapper parent holds a controller node and (optionally) a sibling `<video>`,
 * mirroring the real `MediaPlayerWrapper` structure the hook queries against. Returns the created
 * nodes directly so the tests never traverse the DOM to find them.
 */
function createControllerDom({ withVideo = true } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'playerstack-wrapper';
  const controller = document.createElement('playerstack-media-controller');
  wrapper.appendChild(controller);
  const container = document.createElement('div');
  container.className = 'playerstack-container';
  wrapper.appendChild(container);
  let video = null;
  if (withVideo) {
    video = document.createElement('video');
    container.appendChild(video);
  }
  document.body.appendChild(wrapper);
  return { wrapper, controller, container, video };
}

describe('useSkinVideoRef', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('resolution', () => {
    test('resolves the sibling <video> into videoRef and flips videoReady', () => {
      const { controller, video } = createControllerDom();
      const controllerRef = { current: controller };

      const { results } = renderHook({ controllerRef, url: 'a.mp4', loading: false });

      expect(results.current.videoRef.current).toBe(video);
      expect(results.current.videoReady).toBe(true);
    });

    test('resolves via controller itself when it has no parent element', () => {
      // Detached controller (no parentElement) that itself contains the <video>.
      const controller = document.createElement('playerstack-media-controller');
      const video = document.createElement('video');
      controller.appendChild(video);
      const controllerRef = { current: controller };

      const { results } = renderHook({ controllerRef, url: 'a.mp4', loading: false });

      expect(results.current.videoRef.current).toBe(video);
      expect(results.current.videoReady).toBe(true);
    });

    test('leaves videoRef null and videoReady false when no <video> exists', () => {
      const { controller } = createControllerDom({ withVideo: false });
      const controllerRef = { current: controller };

      const { results } = renderHook({ controllerRef, url: 'a.mp4', loading: false });

      expect(results.current.videoRef.current).toBeNull();
      expect(results.current.videoReady).toBe(false);
    });
  });

  describe('re-resolution on url/loading change', () => {
    test('re-resolves when url changes', () => {
      const { container, controller, video } = createControllerDom();
      const controllerRef = { current: controller };

      const results = { current: null };
      const onResult = (r) => {
        results.current = r;
      };
      const view = render(
        <TestComponent controllerRef={controllerRef} url="a.mp4" loading={false} onResult={onResult} />,
      );
      expect(results.current.videoRef.current).toBe(video);

      // Simulate the <video> remounting when the source changes.
      video.remove();
      const nextVideo = document.createElement('video');
      container.appendChild(nextVideo);

      view.rerender(<TestComponent controllerRef={controllerRef} url="b.mp4" loading={false} onResult={onResult} />);

      expect(results.current.videoRef.current).toBe(nextVideo);
      expect(results.current.videoReady).toBe(true);
    });

    test('re-resolves when loading settles from true to false', () => {
      const { container, controller } = createControllerDom({ withVideo: false });
      const controllerRef = { current: controller };

      const results = { current: null };
      const onResult = (r) => {
        results.current = r;
      };
      const view = render(<TestComponent controllerRef={controllerRef} url="a.mp4" loading onResult={onResult} />);
      // No <video> yet while loading.
      expect(results.current.videoRef.current).toBeNull();
      expect(results.current.videoReady).toBe(false);

      // <video> mounts once loading settles.
      const video = document.createElement('video');
      container.appendChild(video);

      view.rerender(<TestComponent controllerRef={controllerRef} url="a.mp4" loading={false} onResult={onResult} />);

      expect(results.current.videoRef.current).toBe(video);
      expect(results.current.videoReady).toBe(true);
    });
  });

  describe('no-op / cleanup', () => {
    test('is a no-op when the controller is absent', () => {
      const controllerRef = { current: null };

      const { results } = renderHook({ controllerRef, url: 'a.mp4', loading: false });

      expect(results.current.videoRef.current).toBeNull();
      expect(results.current.videoReady).toBe(false);
    });

    test('does not throw on unmount', () => {
      const { controller } = createControllerDom();
      const controllerRef = { current: controller };

      const { view } = renderHook({ controllerRef, url: 'a.mp4', loading: false });

      expect(() => view.unmount()).not.toThrow();
    });
  });
});
