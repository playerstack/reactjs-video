import { getCookie, setCookie, deleteCookie } from '@playerstack/core';

describe('cookie utils', () => {
  beforeEach(() => {
    // Reset cookies before each test
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/');
    });
  });

  describe('setCookie', () => {
    test('sets a cookie with the rmp_ prefix', () => {
      setCookie('test_key', 'test_value');
      expect(document.cookie).toContain('rmp_test_key=test_value');
    });

    test('sets a cookie with an expiration date when days is provided', () => {
      setCookie('expiring_key', 'expiring_value', 7);
      expect(document.cookie).toContain('rmp_expiring_key=expiring_value');
    });

    test('sets a cookie with empty value when value is falsy', () => {
      setCookie('empty_key', '');
      expect(document.cookie).toContain('rmp_empty_key=');
    });

    test('sets a cookie without expiration when days is not provided', () => {
      setCookie('no_expiry', 'value');
      expect(document.cookie).toContain('rmp_no_expiry=value');
    });
  });

  describe('getCookie', () => {
    test('returns the value of a set cookie', () => {
      setCookie('get_test', 'hello');
      expect(getCookie('get_test')).toBe('hello');
    });

    test('returns null when cookie does not exist', () => {
      expect(getCookie('nonexistent_cookie_xyz')).toBeNull();
    });

    test('returns correct value when multiple cookies exist', () => {
      setCookie('key1', 'value1');
      setCookie('key2', 'value2');
      expect(getCookie('key1')).toBe('value1');
      expect(getCookie('key2')).toBe('value2');
    });
  });

  describe('deleteCookie', () => {
    test('deletes a cookie that was previously set', () => {
      setCookie('to_delete', 'some_value');
      expect(getCookie('to_delete')).toBe('some_value');
      deleteCookie('to_delete');
      // After deletion the cookie value should be empty or not found
      // jsdom treats expired cookies as absent
      const val = getCookie('to_delete');
      expect(val === null || val === '').toBe(true);
    });

    test('does not throw when deleting a non-existent cookie', () => {
      expect(() => deleteCookie('ghost_cookie')).not.toThrow();
    });
  });
});
