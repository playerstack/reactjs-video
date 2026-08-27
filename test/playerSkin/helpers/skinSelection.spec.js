import { selectMobileSkin } from '@PlayerSkin/helpers/skinSelection';

describe('helpers/skinSelection', () => {
  describe('selectMobileSkin', () => {
    describe("when skinMode === 'mobile'", () => {
      test('returns true regardless of isMobile being false', () => {
        expect(selectMobileSkin('mobile', false)).toBe(true);
      });

      test('returns true regardless of isMobile being true', () => {
        expect(selectMobileSkin('mobile', true)).toBe(true);
      });
    });

    describe("when skinMode === 'desktop'", () => {
      test('returns false even when isMobile is true', () => {
        expect(selectMobileSkin('desktop', true)).toBe(false);
      });

      test('returns false when isMobile is false', () => {
        expect(selectMobileSkin('desktop', false)).toBe(false);
      });
    });

    describe("when skinMode is 'auto'", () => {
      test('defers to isMobile === true', () => {
        expect(selectMobileSkin('auto', true)).toBe(true);
      });

      test('defers to isMobile === false', () => {
        expect(selectMobileSkin('auto', false)).toBe(false);
      });
    });

    describe('when skinMode is undefined', () => {
      test('defers to isMobile === true', () => {
        expect(selectMobileSkin(undefined, true)).toBe(true);
      });

      test('defers to isMobile === false', () => {
        expect(selectMobileSkin(undefined, false)).toBe(false);
      });
    });
  });
});
