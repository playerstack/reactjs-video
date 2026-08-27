import React from 'react';
import { render, act } from '@testing-library/react';
import useCast from '@hooks/useCast';

// These tests drive the async Cast/Presentation APIs with real timers. Under
// parallel test load the event loop can lag close to Jest's 5s default, causing
// false timeouts. Give the suite extra headroom.
jest.setTimeout(20000);

function TestComponent({ videoRef, disabled, onResult }) {
  const result = useCast({ videoRef, disabled });
  onResult(result);
  return null;
}

function renderHook(props) {
  const results = { current: null };
  const onResult = (r) => {
    results.current = r;
  };
  const rendered = render(<TestComponent {...props} onResult={onResult} />);
  return { results, rendered };
}

/**
 * Helper to create a video element with a mocked Remote Playback API.
 */
function createVideoWithRemote(overrides = {}) {
  const video = document.createElement('video');
  const remote = {
    state: 'disconnected',
    prompt: jest.fn().mockResolvedValue(undefined),
    watchAvailability: jest.fn().mockResolvedValue(1),
    cancelWatchAvailability: jest.fn().mockResolvedValue(undefined),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    ...overrides,
  };
  Object.defineProperty(video, 'remote', { value: remote, configurable: true });
  return { video, remote };
}

describe('useCast', () => {
  let originalPresentationRequest;

  beforeEach(() => {
    originalPresentationRequest = window.PresentationRequest;
  });

  afterEach(() => {
    if (originalPresentationRequest) {
      window.PresentationRequest = originalPresentationRequest;
    } else {
      delete window.PresentationRequest;
    }
  });

  describe('isSupported', () => {
    test('returns true when video.remote is available', () => {
      const original = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        const el = original(tag);
        if (tag === 'video') {
          Object.defineProperty(el, 'remote', { value: {}, configurable: true });
        }
        return el;
      });

      const { video } = createVideoWithRemote();
      const videoRef = { current: video };
      const { results } = renderHook({ videoRef, disabled: false });
      expect(results.current.isSupported).toBe(true);

      document.createElement.mockRestore();
    });

    test('returns true when PresentationRequest is available', () => {
      window.PresentationRequest = jest.fn();
      const videoRef = { current: document.createElement('video') };
      const { results } = renderHook({ videoRef, disabled: false });
      expect(results.current.isSupported).toBe(true);
    });

    test('returns false when neither API is available', () => {
      delete window.PresentationRequest;
      const videoRef = { current: document.createElement('video') };
      const { results } = renderHook({ videoRef, disabled: false });
      expect(results.current.isSupported).toBe(false);
    });
  });

  describe('castState', () => {
    test('initial state is disconnected', () => {
      const { video } = createVideoWithRemote();
      const videoRef = { current: video };
      const { results } = renderHook({ videoRef, disabled: false });
      expect(results.current.castState).toBe('disconnected');
    });

    test('syncs state from remote events', () => {
      const { video, remote } = createVideoWithRemote();
      const videoRef = { current: video };
      const { results } = renderHook({ videoRef, disabled: false });

      const connectHandler = remote.addEventListener.mock.calls.find(
        ([event]) => event === 'connect',
      )?.[1];
      expect(connectHandler).toBeDefined();

      act(() => {
        connectHandler();
      });
      expect(results.current.castState).toBe('connected');

      const disconnectHandler = remote.addEventListener.mock.calls.find(
        ([event]) => event === 'disconnect',
      )?.[1];
      act(() => {
        disconnectHandler();
      });
      expect(results.current.castState).toBe('disconnected');
    });
  });

  describe('promptCast', () => {
    test('calls remote.prompt() when available', async () => {
      const { video, remote } = createVideoWithRemote();
      const videoRef = { current: video };
      const { results } = renderHook({ videoRef, disabled: false });

      await act(async () => {
        results.current.promptCast();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(remote.prompt).toHaveBeenCalled();
    });

    test('does not throw when videoRef is null', () => {
      window.PresentationRequest = jest.fn().mockImplementation(() => ({
        start: jest.fn().mockRejectedValue(new Error('cancelled')),
      }));
      const videoRef = { current: null };
      const { results } = renderHook({ videoRef, disabled: false });
      expect(() => results.current.promptCast()).not.toThrow();
    });

    test('falls back to PresentationRequest when remote.prompt fails', async () => {
      const mockConnection = { addEventListener: jest.fn() };
      const mockStart = jest.fn().mockResolvedValue(mockConnection);
      window.PresentationRequest = jest.fn().mockImplementation(() => ({
        start: mockStart,
      }));

      const { video } = createVideoWithRemote({
        prompt: jest.fn().mockRejectedValue(new Error('not supported')),
      });
      const videoRef = { current: video };
      const { results } = renderHook({ videoRef, disabled: false });

      await act(async () => {
        results.current.promptCast();
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(window.PresentationRequest).toHaveBeenCalledWith([window.location.href]);
      expect(mockStart).toHaveBeenCalled();
    });

    test('uses PresentationRequest directly when no remote', async () => {
      const mockConnection = { addEventListener: jest.fn() };
      const mockStart = jest.fn().mockResolvedValue(mockConnection);
      window.PresentationRequest = jest.fn().mockImplementation(() => ({
        start: mockStart,
      }));

      const videoRef = { current: document.createElement('video') };
      const { results } = renderHook({ videoRef, disabled: false });

      await act(async () => {
        results.current.promptCast();
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(window.PresentationRequest).toHaveBeenCalledWith([window.location.href]);
      expect(mockStart).toHaveBeenCalled();
    });

    test('sets castState to connected on successful presentation', async () => {
      const mockConnection = { addEventListener: jest.fn() };
      const mockStart = jest.fn().mockResolvedValue(mockConnection);
      window.PresentationRequest = jest.fn().mockImplementation(() => ({
        start: mockStart,
      }));

      const { video } = createVideoWithRemote({
        prompt: jest.fn().mockRejectedValue(new Error('not supported')),
      });
      const videoRef = { current: video };
      const { results } = renderHook({ videoRef, disabled: false });

      await act(async () => {
        results.current.promptCast();
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(results.current.castState).toBe('connected');
    });

    test('stays disconnected when both APIs fail', async () => {
      window.PresentationRequest = jest.fn().mockImplementation(() => ({
        start: jest.fn().mockRejectedValue(new Error('user cancelled')),
      }));

      const { video } = createVideoWithRemote({
        prompt: jest.fn().mockRejectedValue(new Error('not supported')),
      });
      const videoRef = { current: video };
      const { results } = renderHook({ videoRef, disabled: false });

      await act(async () => {
        results.current.promptCast();
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(results.current.castState).toBe('disconnected');
    });
  });

  describe('castAvailable', () => {
    test('becomes true when watchAvailability reports a device', async () => {
      const original = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        const el = original(tag);
        if (tag === 'video') {
          Object.defineProperty(el, 'remote', { value: {}, configurable: true });
        }
        return el;
      });

      let availabilityCallback;
      const { video } = createVideoWithRemote({
        watchAvailability: jest.fn().mockImplementation((cb) => {
          availabilityCallback = cb;
          return Promise.resolve(1);
        }),
      });
      const videoRef = { current: video };
      const { results } = renderHook({ videoRef, disabled: false });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      act(() => {
        availabilityCallback(true);
      });

      expect(results.current.castAvailable).toBe(true);

      document.createElement.mockRestore();
    });

    test('assumes available when only PresentationRequest exists', () => {
      window.PresentationRequest = jest.fn();
      const videoRef = { current: document.createElement('video') };
      const { results } = renderHook({ videoRef, disabled: false });
      expect(results.current.castAvailable).toBe(true);
    });

    test('is false when disabled', () => {
      window.PresentationRequest = jest.fn();
      const { video } = createVideoWithRemote();
      const videoRef = { current: video };
      const { results } = renderHook({ videoRef, disabled: true });
      expect(results.current.castAvailable).toBe(false);
    });
  });

  describe('disabled prop', () => {
    test('sets disableRemotePlayback on video when disabled', () => {
      const { video } = createVideoWithRemote();
      const videoRef = { current: video };
      renderHook({ videoRef, disabled: true });
      expect(video.disableRemotePlayback).toBe(true);
    });

    test('clears disableRemotePlayback when not disabled', () => {
      const { video } = createVideoWithRemote();
      video.disableRemotePlayback = true;
      const videoRef = { current: video };
      const { rendered } = renderHook({ videoRef, disabled: true });

      const results2 = { current: null };
      rendered.rerender(
        <TestComponent videoRef={videoRef} disabled={false} onResult={(r) => { results2.current = r; }} />,
      );
      expect(video.disableRemotePlayback).toBe(false);
    });
  });

  describe('cleanup', () => {
    test('removes event listeners on unmount', () => {
      const { video, remote } = createVideoWithRemote();
      const videoRef = { current: video };
      const { rendered } = renderHook({ videoRef, disabled: false });

      rendered.unmount();
      expect(remote.removeEventListener).toHaveBeenCalledWith('connecting', expect.any(Function));
      expect(remote.removeEventListener).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(remote.removeEventListener).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    test('cancels watchAvailability on unmount', async () => {
      const { video, remote } = createVideoWithRemote();
      const videoRef = { current: video };
      const { rendered } = renderHook({ videoRef, disabled: false });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      rendered.unmount();
      expect(remote.cancelWatchAvailability).toHaveBeenCalledWith(1);
    });

    test('terminates presentation connection on unmount', async () => {
      const mockTerminate = jest.fn();
      const mockConnection = {
        addEventListener: jest.fn(),
        terminate: mockTerminate,
      };
      const mockStart = jest.fn().mockResolvedValue(mockConnection);
      window.PresentationRequest = jest.fn().mockImplementation(() => ({
        start: mockStart,
      }));

      const videoRef = { current: document.createElement('video') };
      const { results, rendered } = renderHook({ videoRef, disabled: false });

      await act(async () => {
        results.current.promptCast();
        await new Promise((r) => setTimeout(r, 10));
      });

      rendered.unmount();
      expect(mockTerminate).toHaveBeenCalled();
    });
  });
});
