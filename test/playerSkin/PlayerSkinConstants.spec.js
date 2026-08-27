import {
  eventsKeyCodes,
  keyMappings,
  sliderWidth,
  buildIconProps,
} from '@playerstack/core';

describe('PlayerSkin.constants', () => {
  describe('eventsKeyCodes', () => {
    test('maps 32 to SPACE_KEY', () => {
      expect(eventsKeyCodes[32]).toBe('SPACE_KEY');
    });

    test('maps 27 to ESCAPE_KEY', () => {
      expect(eventsKeyCodes[27]).toBe('ESCAPE_KEY');
    });

    test('maps 37 to ARROW_LEFT_KEY', () => {
      expect(eventsKeyCodes[37]).toBe('ARROW_LEFT_KEY');
    });

    test('maps 39 to ARROW_RIGHT_KEY', () => {
      expect(eventsKeyCodes[39]).toBe('ARROW_RIGHT_KEY');
    });

    test('maps 38 to ARROW_UP_KEY', () => {
      expect(eventsKeyCodes[38]).toBe('ARROW_UP_KEY');
    });

    test('maps 40 to ARROW_DOWN_KEY', () => {
      expect(eventsKeyCodes[40]).toBe('ARROW_DOWN_KEY');
    });

    test('maps 77 to MUTE_KEY', () => {
      expect(eventsKeyCodes[77]).toBe('MUTE_KEY');
    });

    test('maps 70 to F_KEY', () => {
      expect(eventsKeyCodes[70]).toBe('F_KEY');
    });
  });

  describe('keyMappings', () => {
    test('maps space to SPACE_KEY', () => {
      expect(keyMappings[' ']).toBe('SPACE_KEY');
    });

    test('maps Escape to ESCAPE_KEY', () => {
      expect(keyMappings['Escape']).toBe('ESCAPE_KEY');
    });

    test('maps ArrowLeft to ARROW_LEFT_KEY', () => {
      expect(keyMappings['ArrowLeft']).toBe('ARROW_LEFT_KEY');
    });

    test('maps ArrowRight to ARROW_RIGHT_KEY', () => {
      expect(keyMappings['ArrowRight']).toBe('ARROW_RIGHT_KEY');
    });

    test('maps ArrowUp to ARROW_UP_KEY', () => {
      expect(keyMappings['ArrowUp']).toBe('ARROW_UP_KEY');
    });

    test('maps ArrowDown to ARROW_DOWN_KEY', () => {
      expect(keyMappings['ArrowDown']).toBe('ARROW_DOWN_KEY');
    });

    test('maps m to MUTE_KEY', () => {
      expect(keyMappings['m']).toBe('MUTE_KEY');
    });

    test('maps f to F_KEY', () => {
      expect(keyMappings['f']).toBe('F_KEY');
    });
  });

  describe('sliderWidth', () => {
    test('returns 83 when fullscreen is true', () => {
      expect(sliderWidth(true)).toBe(83);
    });

    test('returns 55 when fullscreen is false', () => {
      expect(sliderWidth(false)).toBe(55);
    });

    test('returns 55 when fullscreen is undefined', () => {
      expect(sliderWidth(undefined)).toBe(55);
    });
  });

  describe('buildIconProps', () => {
    test('returns fullscreen icon dimensions when fullscreen is true', () => {
      expect(buildIconProps(true)).toEqual({ width: 54, height: 54 });
    });

    test('returns normal icon dimensions when fullscreen is false', () => {
      expect(buildIconProps(false)).toEqual({ width: 36, height: 36 });
    });

    test('returns normal icon dimensions when fullscreen is undefined', () => {
      expect(buildIconProps(undefined)).toEqual({ width: 36, height: 36 });
    });
  });
});
