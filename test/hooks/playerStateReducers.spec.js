import { reduceSeekState } from '@playerstack/core';

describe('playerState.reducers', () => {
  describe('reduceSeekState', () => {
    test('clears isEnded while seeking, preserves playing (paused)', () => {
      const prev = { seeking: false, isEnded: true, playing: false, volume: 1 };
      const next = reduceSeekState(prev, true);
      expect(next).toEqual({ seeking: true, isEnded: false, playing: false, volume: 1 });
    });

    test('clears isEnded while seeking, preserves playing (playing)', () => {
      const prev = { seeking: false, isEnded: false, playing: true };
      const next = reduceSeekState(prev, true);
      expect(next.seeking).toBe(true);
      expect(next.isEnded).toBe(false);
      expect(next.playing).toBe(true);
    });

    test('auto-plays when seek ends from ended state', () => {
      const prev = { seeking: true, isEnded: true, playing: false };
      const next = reduceSeekState(prev, false);
      expect(next.seeking).toBe(false);
      expect(next.isEnded).toBe(false);
      expect(next.playing).toBe(true);
    });

    test('auto-plays when seek ends from paused state', () => {
      const prev = { seeking: true, isEnded: false, playing: false };
      const next = reduceSeekState(prev, false);
      expect(next.playing).toBe(true);
      expect(next.seeking).toBe(false);
    });

    test('preserves other state fields', () => {
      const prev = { seeking: true, isEnded: false, playing: false, volume: 0.5, loop: true };
      const next = reduceSeekState(prev, false);
      expect(next.volume).toBe(0.5);
      expect(next.loop).toBe(true);
    });

    test('does not mutate previous state', () => {
      const prev = { seeking: false, isEnded: true, playing: false };
      reduceSeekState(prev, true);
      expect(prev).toEqual({ seeking: false, isEnded: true, playing: false });
    });
  });
});
