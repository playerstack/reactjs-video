import { canPlay, VIDEO_EXTENSIONS, HLS_EXTENSIONS, DASH_EXTENSIONS, FLV_EXTENSIONS } from '@playerstack/core';

describe('patterns', () => {
  describe('VIDEO_EXTENSIONS regex', () => {
    test('matches .mp4', () => {
      expect(VIDEO_EXTENSIONS.test('video.mp4')).toBe(true);
    });

    test('matches .webm', () => {
      expect(VIDEO_EXTENSIONS.test('video.webm')).toBe(true);
    });

    test('matches .ogg', () => {
      expect(VIDEO_EXTENSIONS.test('video.ogg')).toBe(true);
    });

    test('matches .ogv', () => {
      expect(VIDEO_EXTENSIONS.test('video.ogv')).toBe(true);
    });

    test('matches .mov', () => {
      expect(VIDEO_EXTENSIONS.test('video.mov')).toBe(true);
    });

    test('matches .m4v', () => {
      expect(VIDEO_EXTENSIONS.test('video.m4v')).toBe(true);
    });

    test('matches with query string', () => {
      expect(VIDEO_EXTENSIONS.test('video.mp4?foo=bar')).toBe(true);
    });

    test('matches with time fragment', () => {
      expect(VIDEO_EXTENSIONS.test('video.mp4#t=10,30')).toBe(true);
    });

    test('does not match .m3u8', () => {
      expect(VIDEO_EXTENSIONS.test('video.m3u8')).toBe(false);
    });

    test('does not match plain string', () => {
      expect(VIDEO_EXTENSIONS.test('notavideo')).toBe(false);
    });
  });

  describe('HLS_EXTENSIONS regex', () => {
    test('matches .m3u8', () => {
      expect(HLS_EXTENSIONS.test('stream.m3u8')).toBe(true);
    });

    test('matches .m3u8 with query string', () => {
      expect(HLS_EXTENSIONS.test('stream.m3u8?token=abc')).toBe(true);
    });

    test('does not match .mp4', () => {
      expect(HLS_EXTENSIONS.test('video.mp4')).toBe(false);
    });
  });

  describe('DASH_EXTENSIONS regex', () => {
    test('matches .mpd', () => {
      expect(DASH_EXTENSIONS.test('manifest.mpd')).toBe(true);
    });

    test('matches .mpd with query string', () => {
      expect(DASH_EXTENSIONS.test('manifest.mpd?token=xyz')).toBe(true);
    });

    test('does not match .m3u8', () => {
      expect(DASH_EXTENSIONS.test('stream.m3u8')).toBe(false);
    });
  });

  describe('FLV_EXTENSIONS regex', () => {
    test('matches .flv', () => {
      expect(FLV_EXTENSIONS.test('video.flv')).toBe(true);
    });

    test('does not match .mp4', () => {
      expect(FLV_EXTENSIONS.test('video.mp4')).toBe(false);
    });
  });

  describe('canPlay', () => {
    test('returns true for HLS URL', () => {
      expect(canPlay('https://example.com/stream.m3u8')).toBe(true);
    });

    test('returns true for DASH URL', () => {
      expect(canPlay('https://example.com/manifest.mpd')).toBe(true);
    });

    test('returns true for FLV URL', () => {
      expect(canPlay('https://example.com/video.flv')).toBe(true);
    });

    test('returns true for mp4 URL', () => {
      expect(canPlay('https://example.com/video.mp4')).toBe(true);
    });

    test('returns true for webm URL', () => {
      expect(canPlay('https://example.com/video.webm')).toBe(true);
    });

    test('returns true when sources array is non-empty', () => {
      expect(canPlay('', [{ src: 'foo.m3u8', resolution: 720 }])).toBe(true);
    });

    test('returns false when sources array is empty and URL is unknown', () => {
      expect(canPlay('https://example.com/random/path', [])).toBe(false);
    });

    test('returns false for unknown URL', () => {
      expect(canPlay('https://example.com/random/path')).toBe(false);
    });

    test('returns true for blob URL', () => {
      expect(canPlay('blob:https://example.com/abc')).toBe(true);
    });

    test('returns true for MediaStream', () => {
      const stream = new MediaStream();
      expect(canPlay(stream)).toBe(true);
    });
  });
});
