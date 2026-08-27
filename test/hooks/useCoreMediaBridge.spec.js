import { renderHook } from '@testing-library/react';

import { createMediaStore } from '@playerstack/core/ui';

import { useCoreMediaBridge } from '@hooks/useCoreMediaBridge';

// Build a fake controller element that owns a real Core MediaStore, mirroring the
// `playerstack-media-controller` host contract (`controller.store`).
function createControllerWithStore() {
  const store = createMediaStore();
  const controller = document.createElement('div');
  controller.store = store;
  return { controllerRef: { current: controller }, store };
}

describe('useCoreMediaBridge', () => {
  test('mirrors the mapped React playback state into the store (Req: play-state mapping)', () => {
    const { controllerRef, store } = createControllerWithStore();
    const state = {
      currentTime: 12,
      duration: 120,
      loaded: 30,
      playing: true,
      muted: false,
      volume: 0.5,
    };

    renderHook(() => useCoreMediaBridge({ controllerRef, state }));

    const snapshot = store.getState();
    expect(snapshot.seek).toBe(12);
    expect(snapshot.played).toBe(12);
    expect(snapshot.loaded).toBe(30);
    expect(snapshot.duration).toBe(120);
    expect(snapshot.playing).toBe(true);
    expect(snapshot.isMuted).toBe(false);
    expect(snapshot.volume).toBe(0.5);
  });

  test('derives playing from paused when playing is not provided', () => {
    const { controllerRef, store } = createControllerWithStore();

    renderHook(() => useCoreMediaBridge({ controllerRef, state: { paused: false } }));
    expect(store.getState().playing).toBe(true);

    const second = createControllerWithStore();
    renderHook(() => useCoreMediaBridge({ controllerRef: second.controllerRef, state: { paused: true } }));
    expect(second.store.getState().playing).toBe(false);
  });

  test('applies safe defaults for missing numeric/boolean fields', () => {
    const { controllerRef, store } = createControllerWithStore();

    renderHook(() => useCoreMediaBridge({ controllerRef, state: {} }));

    const snapshot = store.getState();
    expect(snapshot.seek).toBe(0);
    expect(snapshot.duration).toBe(0);
    expect(snapshot.loaded).toBe(0);
    expect(snapshot.volume).toBe(0);
    expect(snapshot.playbackRate).toBe(1);
    expect(snapshot.isMuted).toBe(false);
    expect(snapshot.loop).toBe(false);
    expect(snapshot.bufferedRanges).toEqual([]);
    expect(snapshot.playbackQuality).toBeNull();
    expect(snapshot.activeCaption).toBeNull();
  });

  test('re-syncs the store when the state changes across renders', () => {
    const { controllerRef, store } = createControllerWithStore();

    const { rerender } = renderHook(({ state }) => useCoreMediaBridge({ controllerRef, state }), {
      initialProps: { state: { currentTime: 5, duration: 100 } },
    });
    expect(store.getState().seek).toBe(5);

    rerender({ state: { currentTime: 42, duration: 100 } });
    expect(store.getState().seek).toBe(42);
    expect(store.getState().played).toBe(42);
  });

  test('maps the remaining playback fields (seeking/loading/buffering/fullscreen/pip/loop)', () => {
    const { controllerRef, store } = createControllerWithStore();
    const state = {
      playbackRate: 1.5,
      playbackQuality: '1080p',
      loop: true,
      pip: true,
      fullscreen: true,
      ended: true,
      seeking: true,
      loading: true,
      buffering: true,
      kernelMsg: 'boom',
      activeCaption: { lang: 'en' },
      bufferedRanges: [[0, 10]],
    };

    renderHook(() => useCoreMediaBridge({ controllerRef, state }));

    const snapshot = store.getState();
    expect(snapshot.playbackRate).toBe(1.5);
    expect(snapshot.playbackQuality).toBe('1080p');
    expect(snapshot.loop).toBe(true);
    expect(snapshot.isPIP).toBe(true);
    expect(snapshot.isFullScreen).toBe(true);
    expect(snapshot.isEnded).toBe(true);
    expect(snapshot.seeking).toBe(true);
    expect(snapshot.isLoading).toBe(true);
    expect(snapshot.isBuffering).toBe(true);
    expect(snapshot.kernelError).toBe('boom');
    expect(snapshot.activeCaption).toEqual({ lang: 'en' });
    expect(snapshot.bufferedRanges).toEqual([[0, 10]]);
  });

  test('does not throw when the controller has no store yet', () => {
    const controllerRef = { current: document.createElement('div') };
    expect(() => renderHook(() => useCoreMediaBridge({ controllerRef, state: { currentTime: 1 } }))).not.toThrow();
  });

  test('does not throw when the controller ref is null', () => {
    const controllerRef = { current: null };
    expect(() => renderHook(() => useCoreMediaBridge({ controllerRef, state: { currentTime: 1 } }))).not.toThrow();
  });
});
