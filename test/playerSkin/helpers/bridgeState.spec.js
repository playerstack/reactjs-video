import { computeBridgeState } from '@PlayerSkin/helpers/bridgeState';

describe('computeBridgeState', () => {
  describe('when dvrActive is true', () => {
    test('uses the DVR window position/duration and marks it fully loaded', () => {
      const result = computeBridgeState({
        dvrActive: true,
        effectiveDVRPosition: 42,
        currentTime: 120,
        sliderDuration: 300,
        duration: 999,
        bufferedRanges: [{ start: 0, end: 50 }],
      });

      expect(result).toEqual({
        currentTime: 42,
        duration: 300,
        loaded: 300,
        bufferedRanges: [{ start: 0, end: 50 }],
      });
    });

    test('ignores bufferedRanges for loaded and uses sliderDuration even when ranges are empty', () => {
      const result = computeBridgeState({
        dvrActive: true,
        effectiveDVRPosition: 10,
        currentTime: 5,
        sliderDuration: 200,
        duration: 500,
        bufferedRanges: [],
      });

      expect(result.currentTime).toBe(10);
      expect(result.duration).toBe(200);
      expect(result.loaded).toBe(200);
      expect(result.bufferedRanges).toEqual([]);
    });
  });

  describe('when dvrActive is false', () => {
    test('uses absolute time/duration and the last buffered range end as loaded', () => {
      const result = computeBridgeState({
        dvrActive: false,
        effectiveDVRPosition: 42,
        currentTime: 120,
        sliderDuration: 300,
        duration: 999,
        bufferedRanges: [
          { start: 0, end: 30 },
          { start: 40, end: 85 },
        ],
      });

      expect(result).toEqual({
        currentTime: 120,
        duration: 999,
        loaded: 85,
        bufferedRanges: [
          { start: 0, end: 30 },
          { start: 40, end: 85 },
        ],
      });
    });

    test('selects the .end of the last range, not the first', () => {
      const result = computeBridgeState({
        dvrActive: false,
        effectiveDVRPosition: 0,
        currentTime: 15,
        sliderDuration: 0,
        duration: 100,
        bufferedRanges: [
          { start: 0, end: 10 },
          { start: 10, end: 20 },
          { start: 20, end: 60 },
        ],
      });

      expect(result.loaded).toBe(60);
    });

    test('loaded is 0 when bufferedRanges is empty', () => {
      const result = computeBridgeState({
        dvrActive: false,
        effectiveDVRPosition: 0,
        currentTime: 15,
        sliderDuration: 0,
        duration: 100,
        bufferedRanges: [],
      });

      expect(result.currentTime).toBe(15);
      expect(result.duration).toBe(100);
      expect(result.loaded).toBe(0);
      expect(result.bufferedRanges).toEqual([]);
    });
  });
});
