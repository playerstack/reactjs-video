import React from 'react';
import { render } from '@testing-library/react';
import { createMediaPlayer } from '@MediaPlayer';

// Mock MediaPlayerSkin to isolate createMediaPlayer logic
jest.mock('../../src/MediaPlayer/components/MediaPlayerSkin', () => {
  const ReactMock = require('react');
  const MockSkin = ReactMock.forwardRef((props, ref) => (
    ReactMock.createElement('div', {
      'data-testid': 'media-player-skin-mock',
      'data-url': props.url,
      'data-sources': JSON.stringify(props.sources),
    })
  ));
  MockSkin.displayName = 'MockMediaPlayerSkin';
  return { __esModule: true, default: MockSkin };
});

const mockPlayer = {
  key: 'test-player',
  name: 'TestPlayer',
  canPlay: (url, sources) => {
    if (sources && sources.length > 0) return true;
    return /\.(mp4|webm)($|\?)/.test(url);
  },
  canEnablePIP: (url) => {
    return /\.(mp4|webm)($|\?)/.test(url) && !!document.pictureInPictureEnabled;
  },
  lazyPlayer: React.lazy(() => Promise.resolve({ default: () => <div>player</div> })),
};

describe('createMediaPlayer factory', () => {
  let MediaPlayer;

  beforeEach(() => {
    MediaPlayer = createMediaPlayer(mockPlayer);
  });

  // ─── Static methods ─────────────────────────────────────────────────────────
  describe('canPlay static method', () => {
    test('returns true for playable URL', () => {
      expect(MediaPlayer.canPlay('video.mp4')).toBe(true);
    });

    test('returns true when sources are provided', () => {
      expect(MediaPlayer.canPlay('', [{ src: 'a.mp4', resolution: 720 }])).toBe(true);
    });

    test('returns false for non-playable URL', () => {
      expect(MediaPlayer.canPlay('https://example.com/page.html')).toBe(false);
    });
  });

  describe('canEnablePIP static method', () => {
    test('returns true when canEnablePIP is supported', () => {
      Object.defineProperty(document, 'pictureInPictureEnabled', { value: true, writable: true });
      expect(MediaPlayer.canEnablePIP('video.mp4')).toBe(true);
    });

    test('returns false when URL is not playable', () => {
      Object.defineProperty(document, 'pictureInPictureEnabled', { value: true, writable: true });
      expect(MediaPlayer.canEnablePIP('random.txt')).toBe(false);
    });

    test('returns false when PIP is not enabled', () => {
      Object.defineProperty(document, 'pictureInPictureEnabled', { value: false, writable: true });
      expect(MediaPlayer.canEnablePIP('video.mp4')).toBe(false);
    });
  });

  // ─── Instance methods ───────────────────────────────────────────────────────
  describe('instance methods', () => {
    let instance;

    beforeEach(() => {
      instance = new MediaPlayer({ url: 'video.mp4' });
    });

    describe('getDuration', () => {
      test('returns null when no player ref', () => {
        expect(instance.getDuration()).toBeNull();
      });

      test('returns duration from player', () => {
        instance.player = { getDuration: () => 120 };
        expect(instance.getDuration()).toBe(120);
      });
    });

    describe('getCurrentTime', () => {
      test('returns null when no player ref', () => {
        expect(instance.getCurrentTime()).toBeNull();
      });

      test('returns current time from player', () => {
        instance.player = { getCurrentTime: () => 45 };
        expect(instance.getCurrentTime()).toBe(45);
      });
    });

    describe('getSecondsLoaded', () => {
      test('returns null when no player ref', () => {
        expect(instance.getSecondsLoaded()).toBeNull();
      });

      test('returns seconds loaded from player', () => {
        instance.player = { getSecondsLoaded: () => 60 };
        expect(instance.getSecondsLoaded()).toBe(60);
      });
    });

    describe('getInternalPlayer', () => {
      test('returns null when no player ref', () => {
        expect(instance.getInternalPlayer()).toBeNull();
      });

      test('returns internal player with default key', () => {
        const mockGetInternal = jest.fn().mockReturnValue('video-element');
        instance.player = { getInternalPlayer: mockGetInternal };
        expect(instance.getInternalPlayer()).toBe('video-element');
        expect(mockGetInternal).toHaveBeenCalledWith('player');
      });

      test('returns internal player with custom key', () => {
        const mockGetInternal = jest.fn().mockReturnValue('hls-instance');
        instance.player = { getInternalPlayer: mockGetInternal };
        expect(instance.getInternalPlayer('hls')).toBe('hls-instance');
        expect(mockGetInternal).toHaveBeenCalledWith('hls');
      });
    });

    describe('seekTo', () => {
      test('returns null when no player ref', () => {
        expect(instance.seekTo(10, 'seconds', true)).toBeNull();
      });

      test('calls player.seekTo with arguments', () => {
        const mockSeekTo = jest.fn();
        instance.player = { seekTo: mockSeekTo };
        instance.seekTo(0.5, 'fraction', false);
        expect(mockSeekTo).toHaveBeenCalledWith(0.5, 'fraction', false);
      });
    });
  });

  // ─── renderActivePlayer ─────────────────────────────────────────────────────
  describe('renderActivePlayer', () => {
    test('renders MediaPlayerSkin when url is provided', () => {
      const { queryByTestId } = render(
        <React.Suspense fallback={null}>
          <MediaPlayer url="video.mp4" />
        </React.Suspense>,
      );
      expect(queryByTestId('media-player-skin-mock')).not.toBeNull();
    });

    test('returns null when no url and no sources', () => {
      const instance = new MediaPlayer({ url: '', sources: [] });
      const result = instance.renderActivePlayer('', []);
      expect(result).toBeNull();
    });

    test('returns null when player cannot play', () => {
      const instance = new MediaPlayer({ url: 'random.txt', sources: [] });
      const result = instance.renderActivePlayer('random.txt', []);
      expect(result).toBeNull();
    });

    test('renders when sources are provided', () => {
      const sources = [{ src: 'v720.mp4', resolution: 720 }];
      const { queryByTestId } = render(
        <React.Suspense fallback={null}>
          <MediaPlayer url="" sources={sources} />
        </React.Suspense>,
      );
      expect(queryByTestId('media-player-skin-mock')).not.toBeNull();
    });
  });

  // ─── getSourceProps ─────────────────────────────────────────────────────────
  describe('getSourceProps', () => {
    test('returns sources and fullHDQualityBreak when sources prop is set', () => {
      const sources = [{ src: 'v.mp4', resolution: 720 }];
      const instance = new MediaPlayer({ sources, fullHDQualityBreak: 720 });
      const result = instance.getSourceProps();
      expect(result).toEqual({ sources, fullHDQualityBreak: 720 });
    });

    test('returns empty sources when no sources prop', () => {
      const instance = new MediaPlayer({});
      // Remove sources from props to test the else branch
      delete instance.props.sources;
      const result = instance.getSourceProps();
      expect(result).toEqual({ sources: [] });
    });
  });

  // ─── getUrlProp ─────────────────────────────────────────────────────────────
  describe('getUrlProp', () => {
    test('returns url when url prop is set', () => {
      const instance = new MediaPlayer({ url: 'video.mp4' });
      const result = instance.getUrlProp();
      expect(result).toBe('video.mp4');
    });

    test('returns empty string when no url prop', () => {
      const instance = new MediaPlayer({});
      delete instance.props.url;
      const result = instance.getUrlProp();
      expect(result).toBe('');
    });
  });

  // ─── getPlayerConfig ────────────────────────────────────────────────────────
  describe('getPlayerConfig', () => {
    test('extracts player config from full config', () => {
      const instance = new MediaPlayer({ url: 'video.mp4' });
      const config = {
        attributes: { crossOrigin: 'anonymous' },
        tracks: [{ kind: 'subtitles', src: 'subs.vtt' }],
        forceVideo: true,
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
        extraPropThatShouldBeIgnored: true,
      };
      const result = instance.getPlayerConfig(config);
      expect(result.attributes).toEqual({ crossOrigin: 'anonymous' });
      expect(result.tracks).toEqual([{ kind: 'subtitles', src: 'subs.vtt' }]);
      expect(result.forceVideo).toBe(true);
      expect(result).not.toHaveProperty('extraPropThatShouldBeIgnored');
    });

    test('memoizes results for same input', () => {
      const instance = new MediaPlayer({ url: 'video.mp4' });
      const config = { attributes: {}, tracks: [], forceVideo: false, forceHLS: false, dashVersion: '4.7.4', forceDASH: false, forceFLV: false, flvVersion: '1.6.2', forceLoad: false, forceDisableHls: false, hlsOptions: {}, hlsVersion: '1.5.7', forceSafariHLS: false, loopOnEnded: false };
      const result1 = instance.getPlayerConfig(config);
      const result2 = instance.getPlayerConfig(config);
      expect(result1).toBe(result2);
    });
  });
});
