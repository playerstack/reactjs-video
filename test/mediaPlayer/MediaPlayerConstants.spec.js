import { getRecommendedVideoQuality, measureNetworkSpeed as measureNetworkSpeedGeneratedFile } from '@playerstack/web-core';

describe('getRecommendedVideoQuality', () => {
  const allResolutions = [144, 270, 360, 480, 720, 1080, 2160];

  test('returns 144p for very low speed (0.3 Mbps)', () => {
    expect(getRecommendedVideoQuality(0.3, allResolutions)).toBe(144);
  });

  test('returns 270p for speed 0.5 Mbps', () => {
    expect(getRecommendedVideoQuality(0.5, allResolutions)).toBe(270);
  });

  test('returns 360p for speed 0.7 Mbps', () => {
    expect(getRecommendedVideoQuality(0.7, allResolutions)).toBe(360);
  });

  test('returns 480p for speed 1.0 Mbps', () => {
    expect(getRecommendedVideoQuality(1.0, allResolutions)).toBe(480);
  });

  test('returns 720p for speed 2.5 Mbps', () => {
    expect(getRecommendedVideoQuality(2.5, allResolutions)).toBe(720);
  });

  test('returns 1080p for speed 5.0 Mbps', () => {
    expect(getRecommendedVideoQuality(5.0, allResolutions)).toBe(1080);
  });

  test('returns 2160p for speed >= 20 Mbps', () => {
    expect(getRecommendedVideoQuality(20, allResolutions)).toBe(2160);
  });

  test('returns highest available when selected quality not in sources', () => {
    // Speed justifies 1080 but only 720 and 480 are available
    expect(getRecommendedVideoQuality(5.0, [480, 720])).toBe(720);
  });

  test('returns lowest available quality when speed is too low for any tier', () => {
    expect(getRecommendedVideoQuality(0.1, [480, 720, 1080])).toBe(480);
  });

  test('returns undefined when sources array is empty', () => {
    expect(getRecommendedVideoQuality(10, [])).toBeUndefined();
  });

  test('returns correct quality when only one resolution available', () => {
    expect(getRecommendedVideoQuality(5.0, [480])).toBe(480);
  });

  test('speed exactly at threshold picks that tier', () => {
    expect(getRecommendedVideoQuality(2.5, allResolutions)).toBe(720);
  });
});

describe('measureNetworkSpeedGeneratedFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the internet_speed cookie
    document.cookie = 'rmp_internet_speed=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
  });

  test('returns cached speed from cookie when available', async () => {
    document.cookie = 'rmp_internet_speed=15.5; path=/';
    const speed = await measureNetworkSpeedGeneratedFile();
    expect(speed).toBeCloseTo(15.5);
  });

  test('returns null on fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const speed = await measureNetworkSpeedGeneratedFile();
    expect(speed).toBeNull();
    consoleSpy.mockRestore();
  });

  test('measures and returns speed when no cookie cached', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob()),
    });
    const speed = await measureNetworkSpeedGeneratedFile();
    // Speed will be a positive number (calculated from mock timing)
    expect(typeof speed).toBe('number');
    expect(speed).toBeGreaterThan(0);
  });
});
