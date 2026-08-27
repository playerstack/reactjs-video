import { getSDK } from '@playerstack/core';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

globalThis.window = {};

const beforeEachTest = () => {
  window.SDK = null;
  window.SDKReady = null;
};

describe('getSDK function', () => {
  beforeEach(() => {
    beforeEachTest();
  });

  test('loads script', async () => {
    const loadScriptOverride = jest.fn(async (_url, cb) => {
      await delay(15);
      window.SDK = 'sdk';
      cb();
    });

    const sdk = await getSDK('http://example.com/abc.js', 'SDK', undefined, undefined, loadScriptOverride);
    expect(sdk).toBe('sdk');
    expect(loadScriptOverride).toHaveBeenCalledTimes(1);
  });

  test('throws on error', async () => {
    const loadScriptOverride = jest.fn(async (_url, cb) => {
      await delay(15);
      cb(new Error('Load error'));
    });

    await expect(
      getSDK('http://example.com/throws.js', 'SDK', undefined, undefined, loadScriptOverride),
    ).rejects.toThrow('Load error');
    expect(loadScriptOverride).toHaveBeenCalledTimes(1);
  });

  test('does not fetch again when loaded', async () => {
    const loadScriptOverride = jest.fn();
    window.SDK = 'sdk';

    const sdk = await getSDK('http://example.com/def.js', 'SDK', undefined, undefined, loadScriptOverride);
    expect(sdk).toBe('sdk');
    expect(loadScriptOverride).not.toHaveBeenCalled();
  });

  test('does not fetch again when loading', async () => {
    const loadScriptOverride = jest.fn(async (_url, cb) => {
      await delay(15);
      window.SDK = 'sdk';
      cb();
    });

    const result = await Promise.all([
      getSDK('http://example.com/ghi.js', 'SDK', undefined, undefined, loadScriptOverride),
      getSDK('http://example.com/ghi.js', 'SDK', undefined, undefined, loadScriptOverride),
    ]);

    expect(result[0]).toBe('sdk');
    expect(result[1]).toBe('sdk');
    expect(loadScriptOverride).toHaveBeenCalledTimes(1);
  });

  test('does fetch again after fetch error', async () => {
    const loadScriptOverrideError = jest.fn(async (_url, cb) => {
      await delay(15);
      cb(new Error('Load error'));
    });

    const loadScriptOverride = jest.fn(async (_url, cb) => {
      await delay(15);
      window.SDK = 'sdk';
      cb();
    });

    await expect(
      getSDK('http://example.com/pqr.js', 'SDK', undefined, undefined, loadScriptOverrideError),
    ).rejects.toThrow('Load error');

    const sdk = await getSDK('http://example.com/pqr.js', 'SDK', undefined, undefined, loadScriptOverride);
    expect(sdk).toBe('sdk');
    expect(loadScriptOverrideError).toHaveBeenCalledTimes(1);
    expect(loadScriptOverride).toHaveBeenCalledTimes(1);
  });

  test('waits for sdkReady callback', async () => {
    const loadScriptOverride = jest.fn(async (_url, cb) => {
      cb();
      await delay(15);
      window.SDK = 'sdk';
      window.SDKReady();
    });

    const sdk = await getSDK('http://example.com/jkl.js', 'SDK', 'SDKReady', undefined, loadScriptOverride);
    expect(sdk).toBe('sdk');
    expect(loadScriptOverride).toHaveBeenCalledTimes(1);
  });

  test('multiple sdkReady callbacks', async () => {
    const loadScriptOverride = jest.fn(async (_url, cb) => {
      cb();
      await delay(15);
      window.SDK = 'sdk';
      window.SDKReady();
    });

    const result = await Promise.all([
      getSDK('http://example.com/mno.js', 'SDK', 'SDKReady', undefined, loadScriptOverride),
      getSDK('http://example.com/mno.js', 'SDK', 'SDKReady', undefined, loadScriptOverride),
    ]);

    expect(result[0]).toBe('sdk');
    expect(result[1]).toBe('sdk');
    expect(loadScriptOverride).toHaveBeenCalledTimes(1);
  });
});
