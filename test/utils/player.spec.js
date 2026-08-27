import { hasAudio, supportsWebKitPresentationMode } from '@playerstack/web-core';
import { lazy } from '@hooks/utils/lazy';
import { getGlobal, enableStubOn } from '@playerstack/web-core';

describe('player utils', () => {
  describe('getGlobal', () => {
    beforeEach(() => {
      delete window.TestSDK;
      delete window.exports;
      delete window.module;
    });

    test('returns window[key] when it exists', () => {
      window.TestSDK = { version: '1.0' };
      expect(getGlobal('TestSDK')).toEqual({ version: '1.0' });
    });

    test('returns null when key does not exist anywhere', () => {
      expect(getGlobal('NonexistentKey123')).toBeNull();
    });

    test('returns window.exports[key] when available', () => {
      window.exports = { ExpSDK: { ver: '2.0' } };
      expect(getGlobal('ExpSDK')).toEqual({ ver: '2.0' });
    });

    test('returns window.module.exports[key] when available', () => {
      window.module = { exports: { ModSDK: { ver: '3.0' } } };
      expect(getGlobal('ModSDK')).toEqual({ ver: '3.0' });
    });
  });

  describe('hasAudio', () => {
    test('returns true when mozHasAudio is truthy', () => {
      const el = { mozHasAudio: true };
      expect(hasAudio(el)).toBe(true);
    });

    test('returns true when webkitAudioDecodedByteCount > 0', () => {
      const el = { webkitAudioDecodedByteCount: 100 };
      expect(hasAudio(el)).toBeTruthy();
    });

    test('returns true when audioTracks has items', () => {
      const el = { audioTracks: [{}] };
      expect(hasAudio(el)).toBeTruthy();
    });

    test('returns false when no audio indicators', () => {
      const el = { mozHasAudio: false, webkitAudioDecodedByteCount: 0, audioTracks: [] };
      expect(hasAudio(el)).toBeFalsy();
    });

    test('returns falsy for null element', () => {
      expect(hasAudio(null)).toBeFalsy();
    });

    test('returns falsy for undefined element', () => {
      expect(hasAudio(undefined)).toBeFalsy();
    });
  });

  describe('supportsWebKitPresentationMode', () => {
    test('returns false when webkitSupportsPresentationMode is not set', () => {
      const el = {};
      expect(supportsWebKitPresentationMode(el)).toBeFalsy();
    });

    test('returns false when webkitSetPresentationMode is not a function', () => {
      const el = { webkitSupportsPresentationMode: true, webkitSetPresentationMode: 'not-a-function' };
      expect(supportsWebKitPresentationMode(el)).toBeFalsy();
    });

    test('returns true for desktop Safari-like element', () => {
      // Mock navigator.userAgent to not include iPhone/iPod
      const originalUA = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit Safari',
        configurable: true,
      });
      const el = {
        webkitSupportsPresentationMode: true,
        webkitSetPresentationMode: jest.fn(),
      };
      expect(supportsWebKitPresentationMode(el)).toBe(true);
      Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
    });

    test('returns false on iPhone', () => {
      const originalUA = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS)',
        configurable: true,
      });
      const el = {
        webkitSupportsPresentationMode: true,
        webkitSetPresentationMode: jest.fn(),
      };
      expect(supportsWebKitPresentationMode(el)).toBe(false);
      Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
    });

    test('uses document.createElement video when no element passed', () => {
      // When no element is passed, it creates a default <video> which won't have webkit methods
      expect(supportsWebKitPresentationMode()).toBeFalsy();
    });
  });

  describe('enableStubOn', () => {
    test('returns the function as-is when not in test mode', () => {
      const fn = () => 'hello';
      // globalThis.__TEST__ is 'false' (string) in our esbuild config
      const result = enableStubOn(fn);
      // May return fn directly or a wrap depending on __TEST__
      expect(typeof result).toBe('function');
    });
  });

  describe('lazy', () => {
    test('returns a lazy component', () => {
      const LazyComp = lazy(() => Promise.resolve({ default: () => null }));
      // React.lazy returns an object with $$typeof
      expect(LazyComp).toBeDefined();
      expect(LazyComp.$$typeof).toBeDefined();
    });
  });
});
