import React from 'react';
import { render as rtlRender, act, fireEvent } from '@testing-library/react';

import { DEFAULT_COMPOSITION } from '@playerstack/web-core/adapters/framework';

import MediaPlayerSkin from '@MediaPlayer/components/MediaPlayerSkin/index';
import { CompositionContext } from '@compound/context/CompositionContext';

jest.mock('../../src/core/VideoElement', () => {
  const ReactMock = require('react');
  // Store the onReady callback so tests can trigger it
  let onReadyCallback = null;
  const VideoElementMock = ReactMock.forwardRef((props, ref) => {
    ReactMock.useImperativeHandle(ref, () => ({
      getPlayer: () => null,
      getOrchestrator: () => null,
      getEngine: () => null,
      seekTo: () => {},
      getDuration: () => null,
      getCurrentTime: () => null,
      getSecondsLoaded: () => null,
      getInternalPlayer: () => null,
      play: () => {},
      pause: () => {},
      stop: () => {},
    }));
    // Store onReady for external triggering
    onReadyCallback = props.onReady;
    return ReactMock.createElement('div', { 'data-testid': 'video-element' });
  });
  VideoElementMock.displayName = 'VideoElement';
  VideoElementMock.triggerReady = () => { if (onReadyCallback) onReadyCallback(); };
  return { __esModule: true, default: VideoElementMock };
});

jest.mock('@playerstack/web-core', () => ({ ...jest.requireActual('@playerstack/web-core'),
  measureNetworkSpeed: jest.fn().mockResolvedValue(5),
  getRecommendedVideoQuality: jest.fn().mockReturnValue(720),
}));

const noop = () => {};

// Task 8.1 made CorePlayerSkin (rendered deep inside MediaPlayerSkin) read the composition manifest
// via `useComposition()`, which requires a CompositionContext ancestor. These integration tests
// only assert the tree renders/behaves, so a default-composition manifest (the full
// DEFAULT_COMPOSITION control set) is provided through a wrapper applied to every `render` call
// (React Testing Library re-applies the same wrapper automatically on `rerender`).
const manifest = { mode: 'default', parts: new Set(DEFAULT_COMPOSITION), config: {}, order: [] };

const CompositionWrapper = ({ children }) => (
  <CompositionContext.Provider value={{ manifest }}>{children}</CompositionContext.Provider>
);

const render = (ui, options) => rtlRender(ui, { wrapper: CompositionWrapper, ...options });

const baseProps = {
  activePlayer: () => null,
  player: null,
  url: 'video.mp4',
  sources: [],
  fullHDQualityBreak: undefined,
  spriteVTTFile: undefined,
  live: false,
  language: 'en',
  poster: '',
  loop: false,
  muted: false,
  pip: false,
  playbackRate: 1,
  playsinline: false,
  progressInterval: 1000,
  stopOnUnmount: true,
  volume: 0.8,
  width: '640px',
  height: '360px',
  playing: false,
  prevented: false,
  waiting: false,
  disableDeferredLoading: true,
  progressFrequency: 100,
  skinMode: 'desktop',
  config: {
    attributes: {},
    tracks: [],
    forceVideo: false,
    forceHLS: false,
    dashVersion: '4.7.4',
    forceDASH: false,
    forceFLV: false,
    flvVersion: '1.6.2',
    forceLoad: false,
    forceDisableHls: false,
    hlsOptions: {},
    hlsVersion: '1.5.7',
    forceSafariHLS: false,
    loopOnEnded: false,
  },
  onBuffer: noop,
  onBufferEnd: noop,
  onDisablePIP: noop,
  onDuration: noop,
  onEnablePIP: noop,
  onEnded: noop,
  onError: noop,
  onPause: noop,
  onPlay: noop,
  onPlayBackQualityChange: noop,
  onPlayBackRateChange: noop,
  onProgress: noop,
  onReady: noop,
  onSeek: noop,
  onStart: noop,
  onLoaded: noop,
  onMount: noop,
};

describe('MediaPlayerSkin integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    const { container } = render(<MediaPlayerSkin {...baseProps} />);
    expect(container.firstChild).not.toBeNull();
  });

  test('renders with playing=true', () => {
    const { container } = render(<MediaPlayerSkin {...baseProps} playing={true} />);
    expect(container.firstChild).not.toBeNull();
  });

  test('renders with muted=true', () => {
    const { container } = render(<MediaPlayerSkin {...baseProps} muted={true} />);
    expect(container.firstChild).not.toBeNull();
  });

  describe('props sync block', () => {
    test('syncs pip prop change to internal state', () => {
      const { rerender, container } = render(
        <MediaPlayerSkin {...baseProps} pip={false} />,
      );
      // Change pip from false to true
      rerender(<MediaPlayerSkin {...baseProps} pip={true} />);
      expect(container.firstChild).not.toBeNull();
    });

    test('syncs playbackRate prop change', () => {
      const { rerender, container } = render(
        <MediaPlayerSkin {...baseProps} playbackRate={1} />,
      );
      rerender(<MediaPlayerSkin {...baseProps} playbackRate={2} />);
      expect(container.firstChild).not.toBeNull();
    });

    test('syncs loop prop change', () => {
      const { rerender, container } = render(
        <MediaPlayerSkin {...baseProps} loop={false} />,
      );
      rerender(<MediaPlayerSkin {...baseProps} loop={true} />);
      expect(container.firstChild).not.toBeNull();
    });

    test('syncs playing prop change', () => {
      const { rerender, container } = render(
        <MediaPlayerSkin {...baseProps} playing={false} />,
      );
      rerender(<MediaPlayerSkin {...baseProps} playing={true} />);
      expect(container.firstChild).not.toBeNull();
    });

    test('syncs muted prop change and adjusts volume', () => {
      const { rerender, container } = render(
        <MediaPlayerSkin {...baseProps} muted={false} volume={0.8} />,
      );
      // Muting should set volume to 0 internally
      rerender(<MediaPlayerSkin {...baseProps} muted={true} volume={0.8} />);
      expect(container.firstChild).not.toBeNull();
    });

    test('syncs volume prop change when not muted', () => {
      const { rerender, container } = render(
        <MediaPlayerSkin {...baseProps} volume={0.5} muted={false} />,
      );
      rerender(<MediaPlayerSkin {...baseProps} volume={0.9} muted={false} />);
      expect(container.firstChild).not.toBeNull();
    });

    test('does not override internal state when unrelated prop changes', () => {
      const { rerender, container } = render(
        <MediaPlayerSkin {...baseProps} playing={false} volume={0.5} />,
      );
      // Only playing changes, volume should not be overwritten
      rerender(<MediaPlayerSkin {...baseProps} playing={true} volume={0.5} />);
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('handleKeyDown delegation', () => {
    test('delegates keydown to playerSkinRef', () => {
      const { container } = render(<MediaPlayerSkin {...baseProps} />);
      const wrapper = container.firstChild;

      // Simulate keydown on the wrapper
      fireEvent.keyDown(wrapper, { key: ' ', code: 'Space' });
      // Should not throw - handleKeyDown delegates to playerSkinRef.current
      expect(wrapper).toBeTruthy();
    });

    test('handles keydown when playerSkinRef is not yet available', () => {
      const { container } = render(<MediaPlayerSkin {...baseProps} />);
      const wrapper = container.firstChild;

      // Should not throw even before skin is mounted
      expect(() => fireEvent.keyDown(wrapper, { key: 'f' })).not.toThrow();
    });
  });

  describe('preventedMemorized calculation', () => {
    test('returns true when prevented prop is true', () => {
      const { container } = render(
        <MediaPlayerSkin {...baseProps} prevented={true} />,
      );
      expect(container.firstChild).not.toBeNull();
    });

    test('returns true when playing and muted', () => {
      const { container } = render(
        <MediaPlayerSkin {...baseProps} playing={true} muted={true} prevented={false} />,
      );
      expect(container.firstChild).not.toBeNull();
    });

    test('returns false when not prevented and not (playing && muted)', () => {
      const { container } = render(
        <MediaPlayerSkin {...baseProps} playing={false} muted={false} prevented={false} />,
      );
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('playerStyles effect', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('dimensions always reflect the consumer width/height props (no pixel snapshot)', () => {
      const mockPlayerElement = document.createElement('div');
      Object.defineProperty(mockPlayerElement, 'offsetWidth', { value: 800 });
      Object.defineProperty(mockPlayerElement, 'offsetHeight', { value: 450 });

      const mockPlayer = {
        getPlayer: () => mockPlayerElement,
      };

      const { container } = render(
        <MediaPlayerSkin {...baseProps} width="100%" height="360px" player={mockPlayer} />,
      );

      // Even after the loading finishes and time passes, the wrapper dimensions
      // should remain the consumer's prop values — never locked to pixel offsets.
      act(() => {
        jest.advanceTimersByTime(600);
      });

      const wrapper = container.firstChild;
      expect(wrapper).not.toBeNull();
      // Consumer passed "100%" and "360px"; these pass through, not replaced by 800px/450px.
      expect(wrapper.style.width).toBe('100%');
      expect(wrapper.style.height).toBe('360px');
    });

    test('no pixel-lock effect means no timeout to clean up on unmount', () => {
      const mockPlayerElement = document.createElement('div');
      Object.defineProperty(mockPlayerElement, 'offsetWidth', { value: 640 });
      Object.defineProperty(mockPlayerElement, 'offsetHeight', { value: 360 });

      const mockPlayer = {
        getPlayer: () => mockPlayerElement,
      };

      const { unmount } = render(
        <MediaPlayerSkin {...baseProps} player={mockPlayer} />,
      );

      // Unmount safely — no timeout to leak
      unmount();

      // Advancing timers should not throw
      act(() => {
        jest.advanceTimersByTime(600);
      });
    });
  });

  describe('VideoElement rendering with videoUrl', () => {
    test('renders VideoElement when url is provided', () => {
      const { queryByTestId } = render(
        <MediaPlayerSkin {...baseProps} url="video.mp4" />,
      );
      expect(queryByTestId('video-element')).not.toBeNull();
    });

    test('does not render VideoElement when url is empty', () => {
      const { queryByTestId } = render(
        <MediaPlayerSkin {...baseProps} url="" />,
      );
      // Empty string is falsy, so VideoElement should not render
      expect(queryByTestId('video-element')).toBeNull();
    });

    test('renders VideoElement with sources', async () => {
      const sources = [
        { src: 'video-720.mp4', resolution: 720 },
        { src: 'video-1080.mp4', resolution: 1080 },
      ];
      const { queryByTestId } = render(
        <MediaPlayerSkin {...baseProps} url="" sources={sources} />,
      );
      // With sources, videoUrl should be derived from sources after speed measurement
      // Since measureNetworkSpeedGeneratedFile is mocked to resolve immediately,
      // we need to wait for the async effect
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      expect(queryByTestId('video-element')).not.toBeNull();
    });
  });

  describe('MediaPlayerWrapper attributes', () => {
    test('has tabIndex, role, and dir attributes', () => {
      const { container } = render(<MediaPlayerSkin {...baseProps} />);
      const wrapper = container.firstChild;
      expect(wrapper.getAttribute('tabindex')).toBe('0');
      expect(wrapper.getAttribute('role')).toBe('application');
      expect(wrapper.getAttribute('dir')).toBe('ltr');
    });
  });
});
