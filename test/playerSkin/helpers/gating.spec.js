import {
  isAdPresent,
  computeSpinnerActive,
  computeShouldStayVisible,
  computeShowTimeSlider,
  computeShowCast,
  isPosterVisible,
  computeHideSettings,
  showNavCluster,
  showChapterReadout,
} from '@PlayerSkin/helpers/gating';

describe('helpers/gating', () => {
  describe('isAdPresent', () => {
    test('returns false when ads is null', () => {
      expect(isAdPresent(null)).toBe(false);
    });

    test('returns false when ads is undefined', () => {
      expect(isAdPresent(undefined)).toBe(false);
    });

    test('returns true when ads is an object', () => {
      expect(isAdPresent({ src: 'ad.mp4' })).toBe(true);
    });

    test('returns true for falsy-but-present values (0, empty string, false)', () => {
      expect(isAdPresent(0)).toBe(true);
      expect(isAdPresent('')).toBe(true);
      expect(isAdPresent(false)).toBe(true);
    });
  });

  describe('computeSpinnerActive', () => {
    const base = {
      waiting: false,
      seeking: false,
      spriteVTTFile: null,
      loading: false,
      paused: false,
      ended: false,
    };

    test('inactive when no waiting/seeking/loading flags set', () => {
      expect(computeSpinnerActive(base)).toBe(false);
    });

    test('active when waiting and not paused/ended', () => {
      expect(computeSpinnerActive({ ...base, waiting: true })).toBe(true);
    });

    test('active when loading and not paused/ended', () => {
      expect(computeSpinnerActive({ ...base, loading: true })).toBe(true);
    });

    test('active when seeking with no sprite VTT file', () => {
      expect(computeSpinnerActive({ ...base, seeking: true })).toBe(true);
    });

    test('inactive when seeking but a sprite VTT file exists (sprite branch)', () => {
      expect(computeSpinnerActive({ ...base, seeking: true, spriteVTTFile: 'sprite.vtt' })).toBe(false);
    });

    test('inactive when paused even if waiting', () => {
      expect(computeSpinnerActive({ ...base, waiting: true, paused: true })).toBe(false);
    });

    test('inactive when ended even if loading', () => {
      expect(computeSpinnerActive({ ...base, loading: true, ended: true })).toBe(false);
    });

    test('coerces truthy non-boolean flags to boolean result', () => {
      expect(computeSpinnerActive({ ...base, waiting: 1 })).toBe(true);
    });
  });

  describe('computeShouldStayVisible', () => {
    const base = {
      paused: false,
      ended: false,
      loading: false,
      waiting: false,
      seeking: false,
      prevented: false,
      kernelMsg: null,
    };

    test('returns false when all flags are false and kernelMsg is null', () => {
      expect(computeShouldStayVisible(base)).toBe(false);
    });

    test('returns true when paused', () => {
      expect(computeShouldStayVisible({ ...base, paused: true })).toBe(true);
    });

    test('returns true when ended', () => {
      expect(computeShouldStayVisible({ ...base, ended: true })).toBe(true);
    });

    test('returns true when loading', () => {
      expect(computeShouldStayVisible({ ...base, loading: true })).toBe(true);
    });

    test('returns true when waiting', () => {
      expect(computeShouldStayVisible({ ...base, waiting: true })).toBe(true);
    });

    test('returns true when seeking', () => {
      expect(computeShouldStayVisible({ ...base, seeking: true })).toBe(true);
    });

    test('returns true when prevented', () => {
      expect(computeShouldStayVisible({ ...base, prevented: true })).toBe(true);
    });

    test('returns true when kernelMsg is a non-null string', () => {
      expect(computeShouldStayVisible({ ...base, kernelMsg: 'error' })).toBe(true);
    });

    test('returns false when kernelMsg is undefined (kernelMsg != null covers undefined)', () => {
      expect(computeShouldStayVisible({ ...base, kernelMsg: undefined })).toBe(false);
    });

    test('returns true when kernelMsg is an empty string (present but not null)', () => {
      expect(computeShouldStayVisible({ ...base, kernelMsg: '' })).toBe(true);
    });
  });

  describe('computeShowTimeSlider', () => {
    test('true when not live', () => {
      expect(computeShowTimeSlider(false, false)).toBe(true);
    });

    test('true when live but liveDVR enabled', () => {
      expect(computeShowTimeSlider(true, true)).toBe(true);
    });

    test('false when live and liveDVR disabled', () => {
      expect(computeShowTimeSlider(true, false)).toBe(false);
    });

    test('true when not live even if liveDVR enabled', () => {
      expect(computeShowTimeSlider(false, true)).toBe(true);
    });

    test('defaults dvrSupported to true (live + liveDVR shows the slider)', () => {
      expect(computeShowTimeSlider(true, true, undefined)).toBe(true);
    });

    test('false when live + liveDVR but the platform cannot time-shift (dvrSupported=false)', () => {
      // iOS < 17.1 → native HLS, no seekable window → degrade to plain live (no timeline).
      expect(computeShowTimeSlider(true, true, false)).toBe(false);
    });

    test('true when live + liveDVR and the platform supports DVR (dvrSupported=true)', () => {
      expect(computeShowTimeSlider(true, true, true)).toBe(true);
    });

    test('true for VOD regardless of dvrSupported', () => {
      expect(computeShowTimeSlider(false, false, false)).toBe(true);
    });
  });

  describe('computeShowCast', () => {
    test('true when supported, no ad present, and video ready', () => {
      expect(computeShowCast(true, false, true)).toBe(true);
    });

    test('falsy when cast not supported', () => {
      expect(computeShowCast(false, false, true)).toBe(false);
    });

    test('false when an ad is present', () => {
      expect(computeShowCast(true, true, true)).toBe(false);
    });

    test('falsy when video not ready', () => {
      expect(computeShowCast(true, false, false)).toBe(false);
    });
  });

  describe('isPosterVisible', () => {
    test('visible when currentTime is 0 (edge <= 0)', () => {
      expect(isPosterVisible(0, false)).toBe(true);
    });

    test('visible when currentTime is negative', () => {
      expect(isPosterVisible(-1, false)).toBe(true);
    });

    test('hidden when currentTime > 0 and not ended', () => {
      expect(isPosterVisible(5, false)).toBe(false);
    });

    test('visible when ended even if currentTime > 0', () => {
      expect(isPosterVisible(5, true)).toBe(true);
    });

    test('visible when autoplay was blocked before play (live: currentTime is the edge, > 0)', () => {
      expect(isPosterVisible(598, false, true)).toBe(true);
    });

    test('hidden when playing normally (currentTime > 0, not ended, not autoplay-blocked)', () => {
      expect(isPosterVisible(598, false, false)).toBe(false);
    });
  });

  describe('computeHideSettings', () => {
    const base = {
      adPresent: false,
      live: false,
      qualityOptionsLength: 1,
      hasCaptions: true,
    };

    test('false when neither ad nor live gating clause is met', () => {
      expect(computeHideSettings(base)).toBe(false);
    });

    test('true via ad clause: adPresent, no qualities, no captions', () => {
      expect(computeHideSettings({ ...base, adPresent: true, qualityOptionsLength: 0, hasCaptions: false })).toBe(true);
    });

    test('true via live clause: live, no qualities, no captions', () => {
      expect(computeHideSettings({ ...base, live: true, qualityOptionsLength: 0, hasCaptions: false })).toBe(true);
    });

    test('false when adPresent but qualities exist', () => {
      expect(computeHideSettings({ ...base, adPresent: true, qualityOptionsLength: 2, hasCaptions: false })).toBe(
        false,
      );
    });

    test('false when adPresent and no qualities but captions exist', () => {
      expect(computeHideSettings({ ...base, adPresent: true, qualityOptionsLength: 0, hasCaptions: true })).toBe(false);
    });

    test('false when live but qualities exist', () => {
      expect(computeHideSettings({ ...base, live: true, qualityOptionsLength: 3, hasCaptions: false })).toBe(false);
    });

    test('false when live and no qualities but captions exist', () => {
      expect(computeHideSettings({ ...base, live: true, qualityOptionsLength: 0, hasCaptions: true })).toBe(false);
    });
  });

  describe('showNavCluster', () => {
    test('false when no nav buttons and no prev/next handlers', () => {
      expect(showNavCluster(false, null, null)).toBe(false);
    });

    test('true when showNavButtons is true', () => {
      expect(showNavCluster(true, null, null)).toBe(true);
    });

    test('true when onPrevious handler provided', () => {
      expect(showNavCluster(false, () => {}, null)).toBe(true);
    });

    test('true when onNext handler provided', () => {
      expect(showNavCluster(false, null, () => {})).toBe(true);
    });

    test('coerces to a boolean (not the handler reference)', () => {
      const onNext = () => {};
      expect(showNavCluster(false, null, onNext)).toBe(true);
    });
  });

  describe('showChapterReadout', () => {
    const chapters = [{ startTime: 0, title: 'Intro' }];

    test('false when chapters is empty', () => {
      expect(showChapterReadout({ adPresent: false, paused: false, chapters: [] })).toBe(false);
    });

    test('false when chapters is null/undefined', () => {
      expect(showChapterReadout({ adPresent: false, paused: false, chapters: null })).toBe(false);
      expect(showChapterReadout({ adPresent: false, paused: false, chapters: undefined })).toBe(false);
    });

    test('true when chapters present, no ad, not paused', () => {
      expect(showChapterReadout({ adPresent: false, paused: false, chapters })).toBe(true);
    });

    test('false when an ad is present and playing (ad+playing suppresses read-out)', () => {
      expect(showChapterReadout({ adPresent: true, paused: false, chapters })).toBe(false);
    });

    test('true when an ad is present but paused', () => {
      expect(showChapterReadout({ adPresent: true, paused: true, chapters })).toBe(true);
    });

    test('true when paused but no ad present', () => {
      expect(showChapterReadout({ adPresent: false, paused: true, chapters })).toBe(true);
    });

    test('coerces to a boolean result', () => {
      expect(showChapterReadout({ adPresent: false, paused: false, chapters })).toBe(true);
    });
  });
});
