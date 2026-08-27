import { createWebPlayerAdapter } from '@utils/webPlayerAdapter';

function createMockMediaElement() {
  return {
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    load: jest.fn(),
    removeAttribute: jest.fn(),
    src: '',
    currentTime: 0,
    duration: 120,
    volume: 1,
    muted: false,
    playbackRate: 1,
    buffered: {
      length: 1,
      end: jest.fn().mockReturnValue(60),
    },
  };
}

describe('createWebPlayerAdapter', () => {
  let videoRef;
  let adapter;

  beforeEach(() => {
    videoRef = { current: createMockMediaElement() };
    adapter = createWebPlayerAdapter(videoRef);
  });

  describe('play', () => {
    it('calls play on the media element', () => {
      adapter.play();
      expect(videoRef.current.play).toHaveBeenCalled();
    });

    it('does not throw when ref is null', () => {
      videoRef.current = null;
      expect(() => adapter.play()).not.toThrow();
    });
  });

  describe('pause', () => {
    it('calls pause on the media element', () => {
      adapter.pause();
      expect(videoRef.current.pause).toHaveBeenCalled();
    });

    it('does not throw when ref is null', () => {
      videoRef.current = null;
      expect(() => adapter.pause()).not.toThrow();
    });
  });

  describe('stop', () => {
    it('pauses, removes src, and reloads', () => {
      adapter.stop();
      expect(videoRef.current.pause).toHaveBeenCalled();
      expect(videoRef.current.removeAttribute).toHaveBeenCalledWith('src');
      expect(videoRef.current.load).toHaveBeenCalled();
    });

    it('does not throw when ref is null', () => {
      videoRef.current = null;
      expect(() => adapter.stop()).not.toThrow();
    });
  });

  describe('load', () => {
    it('sets src on the media element', () => {
      adapter.load('https://example.com/video.mp4');
      expect(videoRef.current.src).toBe('https://example.com/video.mp4');
    });

    it('does not throw when ref is null', () => {
      videoRef.current = null;
      expect(() => adapter.load('https://example.com/video.mp4')).not.toThrow();
    });
  });

  describe('seekTo', () => {
    it('sets currentTime on the media element', () => {
      adapter.seekTo(30);
      expect(videoRef.current.currentTime).toBe(30);
    });

    it('does not throw when ref is null', () => {
      videoRef.current = null;
      expect(() => adapter.seekTo(30)).not.toThrow();
    });
  });

  describe('setVolume', () => {
    it('sets volume on the media element', () => {
      adapter.setVolume(0.5);
      expect(videoRef.current.volume).toBe(0.5);
    });

    it('does not throw when ref is null', () => {
      videoRef.current = null;
      expect(() => adapter.setVolume(0.5)).not.toThrow();
    });
  });

  describe('mute', () => {
    it('sets muted to true', () => {
      adapter.mute();
      expect(videoRef.current.muted).toBe(true);
    });

    it('does not throw when ref is null', () => {
      videoRef.current = null;
      expect(() => adapter.mute()).not.toThrow();
    });
  });

  describe('unmute', () => {
    it('sets muted to false', () => {
      videoRef.current.muted = true;
      adapter.unmute();
      expect(videoRef.current.muted).toBe(false);
    });

    it('does not throw when ref is null', () => {
      videoRef.current = null;
      expect(() => adapter.unmute()).not.toThrow();
    });
  });

  describe('setPlaybackRate', () => {
    it('sets playbackRate on the media element', () => {
      adapter.setPlaybackRate(2);
      expect(videoRef.current.playbackRate).toBe(2);
    });

    it('does not throw when ref is null', () => {
      videoRef.current = null;
      expect(() => adapter.setPlaybackRate(2)).not.toThrow();
    });
  });

  describe('getDuration', () => {
    it('returns duration from media element', () => {
      expect(adapter.getDuration()).toBe(120);
    });

    it('returns null when ref is null', () => {
      videoRef.current = null;
      expect(adapter.getDuration()).toBeNull();
    });

    it('returns null when duration is 0', () => {
      videoRef.current.duration = 0;
      expect(adapter.getDuration()).toBeNull();
    });

    it('returns null when duration is NaN', () => {
      videoRef.current.duration = NaN;
      expect(adapter.getDuration()).toBeNull();
    });
  });

  describe('getCurrentTime', () => {
    it('returns currentTime from media element', () => {
      videoRef.current.currentTime = 45;
      expect(adapter.getCurrentTime()).toBe(45);
    });

    it('returns 0 when currentTime is 0', () => {
      videoRef.current.currentTime = 0;
      expect(adapter.getCurrentTime()).toBe(0);
    });

    it('returns null when ref is null', () => {
      videoRef.current = null;
      expect(adapter.getCurrentTime()).toBeNull();
    });
  });

  describe('getSecondsLoaded', () => {
    it('returns buffered end value', () => {
      expect(adapter.getSecondsLoaded()).toBe(60);
    });

    it('returns null when ref is null', () => {
      videoRef.current = null;
      expect(adapter.getSecondsLoaded()).toBeNull();
    });

    it('returns null when buffered length is 0', () => {
      videoRef.current.buffered = { length: 0, end: jest.fn() };
      expect(adapter.getSecondsLoaded()).toBeNull();
    });

    it('returns null when buffered is undefined', () => {
      videoRef.current.buffered = undefined;
      expect(adapter.getSecondsLoaded()).toBeNull();
    });
  });
});
