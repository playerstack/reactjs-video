import { mapQualityOptions } from '@PlayerSkin/helpers/qualityOptions';

describe('qualityOptions', () => {
  describe('mapQualityOptions', () => {
    test('returns an empty array for an empty input', () => {
      expect(mapQualityOptions([])).toEqual([]);
    });

    test('maps a single entry to exactly label/value/isFullHD', () => {
      const result = mapQualityOptions([{ label: '1080p', value: '1080', isFullHD: true }]);

      expect(result).toEqual([{ label: '1080p', value: '1080', isFullHD: true }]);
    });

    test('maps multiple entries preserving order', () => {
      const result = mapQualityOptions([
        { label: '1080p', value: '1080', isFullHD: true },
        { label: '720p', value: '720', isFullHD: false },
        { label: 'Auto', value: 'auto', isFullHD: false },
      ]);

      expect(result).toEqual([
        { label: '1080p', value: '1080', isFullHD: true },
        { label: '720p', value: '720', isFullHD: false },
        { label: 'Auto', value: 'auto', isFullHD: false },
      ]);
    });

    test('preserves only the three fields and drops any extras', () => {
      const result = mapQualityOptions([
        {
          label: '1080p',
          value: '1080',
          isFullHD: true,
          bitrate: 5000,
          src: 'https://example.com/1080.m3u8',
        },
      ]);

      expect(result[0]).toEqual({
        label: '1080p',
        value: '1080',
        isFullHD: true,
      });
      expect(Object.keys(result[0])).toEqual(['label', 'value', 'isFullHD']);
    });

    test('carries through undefined fields without adding others', () => {
      const result = mapQualityOptions([{ value: '480' }]);

      expect(result[0]).toEqual({
        label: undefined,
        value: '480',
        isFullHD: undefined,
      });
      expect(Object.keys(result[0])).toEqual(['label', 'value', 'isFullHD']);
    });

    test('returns a new array (does not mutate the input)', () => {
      const input = [{ label: '720p', value: '720', isFullHD: false }];
      const result = mapQualityOptions(input);

      expect(result).not.toBe(input);
      expect(result[0]).not.toBe(input[0]);
    });
  });
});
