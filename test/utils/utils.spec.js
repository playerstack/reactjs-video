import { omit } from '@playerstack/web-core';
import { isMediaStream, isBlobUrl, formatTime, indexBy } from '@playerstack/web-core';

describe('utils/index', () => {
  describe('omit', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 };

    test('omits specified keys', () => {
      expect(omit(obj, ['a', 'b'])).toEqual({ c: 3, d: 4 });
    });

    test('returns full object when nothing to omit', () => {
      expect(omit(obj, [])).toEqual(obj);
    });

    test('handles multiple array args', () => {
      expect(omit(obj, ['a'], ['b'], ['c'])).toEqual({ d: 4 });
    });

    test('handles key not present in object', () => {
      expect(omit(obj, ['z'])).toEqual(obj);
    });
  });

  describe('isMediaStream', () => {
    test('returns true for MediaStream instance', () => {
      const stream = new MediaStream();
      expect(isMediaStream(stream)).toBe(true);
    });

    test('returns false for a string URL', () => {
      expect(isMediaStream('https://example.com/video.mp4')).toBe(false);
    });

    test('returns false for null', () => {
      expect(isMediaStream(null)).toBe(false);
    });

    test('returns false for undefined', () => {
      expect(isMediaStream(undefined)).toBe(false);
    });
  });

  describe('isBlobUrl', () => {
    test('returns true for blob URL', () => {
      expect(isBlobUrl('blob:https://example.com/abc-123')).toBe(true);
    });

    test('returns false for regular URL', () => {
      expect(isBlobUrl('https://example.com/video.mp4')).toBe(false);
    });

    test('returns false for empty string', () => {
      expect(isBlobUrl('')).toBe(false);
    });
  });

  describe('formatTime', () => {
    test('formats seconds under 1 hour as MM:SS', () => {
      expect(formatTime(90)).toBe('01:30');
    });

    test('formats 0 seconds', () => {
      expect(formatTime(0)).toBe('00:00');
    });

    test('formats seconds over 1 hour as HH:MM:SS', () => {
      expect(formatTime(3661)).toBe('01:01:01');
    });

    test('formats exactly 1 hour', () => {
      expect(formatTime(3600)).toBe('01:00:00');
    });

    test('formats 59 seconds', () => {
      expect(formatTime(59)).toBe('00:59');
    });

    test('pads single digit minutes and seconds', () => {
      expect(formatTime(65)).toBe('01:05');
    });
  });

  describe('indexBy', () => {
    test('indexes array by given key', () => {
      const arr = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
      expect(indexBy(arr, 'id')).toEqual({
        1: { id: 1, name: 'Alice' },
        2: { id: 2, name: 'Bob' },
      });
    });

    test('returns empty object for empty array', () => {
      expect(indexBy([], 'id')).toEqual({});
    });

    test('last value wins on duplicate keys', () => {
      const arr = [
        { id: 1, name: 'Alice' },
        { id: 1, name: 'Bob' },
      ];
      expect(indexBy(arr, 'id')).toEqual({ 1: { id: 1, name: 'Bob' } });
    });
  });
});
