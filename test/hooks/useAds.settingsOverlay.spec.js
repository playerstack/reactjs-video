import { buildSettingsOptions as settingsOverlayFn } from '@playerstack/web-core';

const i18n = { speed: 'Speed', quality: 'Quality', captions: 'Captions', auto: 'Auto', off: 'Off' };

describe('buildSettingsOptions as settingsOverlayFn — adMode', () => {
  test('includes speed when adMode is false', () => {
    const result = settingsOverlayFn({ qualityOptions: [], captionOptions: [], live: false, adMode: false, i18n });
    expect(result.some((o) => o.value === 'speed')).toBe(true);
  });

  test('excludes speed when adMode is true', () => {
    const result = settingsOverlayFn({ qualityOptions: [], captionOptions: [], live: false, adMode: true, i18n });
    expect(result.some((o) => o.value === 'speed')).toBe(false);
  });

  test('excludes speed when live is true', () => {
    const result = settingsOverlayFn({ qualityOptions: [], captionOptions: [], live: true, adMode: false, i18n });
    expect(result.some((o) => o.value === 'speed')).toBe(false);
  });

  test('includes quality when qualities available in adMode', () => {
    const qualities = [{ label: '720p', value: '720' }];
    const result = settingsOverlayFn({ qualityOptions: qualities, captionOptions: [], live: false, adMode: true, i18n });
    expect(result.some((o) => o.value === 'quality')).toBe(true);
  });

  test('includes captions when captions available in adMode', () => {
    const captions = [{ label: 'English', value: 'en' }];
    const result = settingsOverlayFn({ qualityOptions: [], captionOptions: captions, live: false, adMode: true, i18n });
    expect(result.some((o) => o.value === 'captions')).toBe(true);
  });

  test('returns empty array when adMode true and no quality or captions', () => {
    const result = settingsOverlayFn({ qualityOptions: [], captionOptions: [], live: false, adMode: true, i18n });
    expect(result).toEqual([]);
  });

  test('quality options include auto option', () => {
    const qualities = [{ label: '1080p', value: '1080' }];
    const result = settingsOverlayFn({ qualityOptions: qualities, captionOptions: [], live: false, adMode: false, i18n });
    const qualityItem = result.find((o) => o.value === 'quality');
    expect(qualityItem.options).toContainEqual({ label: 'Auto', value: '0', isFullHD: false });
  });

  test('captions options include off option', () => {
    const captions = [{ label: 'English', value: 'en' }];
    const result = settingsOverlayFn({ qualityOptions: [], captionOptions: captions, live: false, adMode: false, i18n });
    const captionsItem = result.find((o) => o.value === 'captions');
    expect(captionsItem.options[0]).toEqual({ label: 'Off', value: 'off' });
  });
});
