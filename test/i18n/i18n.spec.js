import { en, es } from '@playerstack/core';

const i18n = { en, es };

describe('i18n', () => {
  const requiredKeys = [
    'exitFullScreenMode',
    'fullScreen',
    'play',
    'pause',
    'normal',
    'settings',
    'speed',
    'quality',
    'hd',
    'live',
    'clickToUnmute',
    'playbackStuckClickResumePlayback',
    'mute',
    'activateSound',
    'thisVideoHasNoSound',
    'timeBar',
  ];

  describe('English translations', () => {
    test.each(requiredKeys)('has key "%s"', (key) => {
      expect(en[key]).toBeDefined();
      expect(typeof en[key]).toBe('string');
    });

    test('play is "Play"', () => {
      expect(en.play).toBe('Play');
    });

    test('pause is "Pause"', () => {
      expect(en.pause).toBe('Pause');
    });

    test('fullScreen is "Full screen"', () => {
      expect(en.fullScreen).toBe('Full screen');
    });
  });

  describe('Spanish translations', () => {
    test.each(requiredKeys)('has key "%s"', (key) => {
      expect(es[key]).toBeDefined();
      expect(typeof es[key]).toBe('string');
    });

    test('play is "Reproducir"', () => {
      expect(es.play).toBe('Reproducir');
    });

    test('pause is "Pausar"', () => {
      expect(es.pause).toBe('Pausar');
    });
  });

  describe('i18n index', () => {
    test('exports en and es', () => {
      expect(i18n.en).toBe(en);
      expect(i18n.es).toBe(es);
    });

    test('available languages include en and es', () => {
      expect(Object.keys(i18n)).toContain('en');
      expect(Object.keys(i18n)).toContain('es');
    });

    test('both locales have same keys', () => {
      const enKeys = Object.keys(en).sort();
      const esKeys = Object.keys(es).sort();
      expect(enKeys).toEqual(esKeys);
    });
  });
});
