import { deriveEngineProps } from '@compound/hooks/deriveEngineProps';

/**
 * Validates Property 2 (Migración de props de contenido) —
 * Requirements 6.3, 6.4, 6.5, 6.6, 6.7, 9.3, 12.7, 12.8.
 *
 * `deriveEngineProps(ephemeral, manifest)` is the pure translator from the composition
 * manifest to the internal engine's prop contract. It:
 *   - takes the ephemeral `<Player>` props as the base (6.4),
 *   - overlays ONLY the content keys actually carried by `manifest.config` (6.5), with the
 *     config value winning over any ephemeral collision (6.6),
 *   - derives `showNavButtons` from the presence of `PrevButton`/`NextButton` parts (6.3), and
 *   - leaves the content surface identical to `ephemeral` when `manifest.config` is empty (6.7).
 *
 * It is pure and deterministic: it clones `ephemeral` before writing, so it never mutates
 * `ephemeral` nor `manifest`, touches no React/DOM, and reads nothing outside its two inputs.
 * Feature-activation props (`ads`, `live`, `liveDVR`, `liveAd`, `prevented`, `pip`, callbacks)
 * ride along on `ephemeral`, so cloning forwards them to the engine untouched (9.3).
 */
describe('compound/hooks/deriveEngineProps', () => {
  // Build a manifest with the shape the deriver consumes. It reads only `config` and `parts`;
  // `mode`/`order` are included so tests double as a guard that those fields never leak.
  const manifest = (config = {}, partNames = []) => ({
    mode: partNames.length > 0 ? 'custom' : 'default',
    parts: new Set(partNames),
    config,
    order: [...partNames],
  });

  describe('base = ephemeral props (Req 6.4)', () => {
    test('empty config + empty parts ⇒ ephemeral preserved, only showNavButtons:false added', () => {
      const ephemeral = {
        url: 'movie.m3u8',
        playing: true,
        volume: 0.5,
        muted: false,
        width: '100%',
        height: 360,
        language: 'en',
      };

      const result = deriveEngineProps(ephemeral, manifest({}, []));

      // Deep-equals ephemeral EXCEPT the orthogonal showNavButtons derivation.
      expect(result).toEqual({ ...ephemeral, showNavButtons: false });
      // Every ephemeral key survives with its original value/identity.
      Object.keys(ephemeral).forEach((key) => {
        expect(result[key]).toBe(ephemeral[key]);
      });
    });
  });

  describe('overlays only content keys present in manifest.config (Req 6.5)', () => {
    test('copies sources and title from config; leaves unrelated ephemeral keys untouched', () => {
      const sources = [{ src: 'video.m3u8', resolution: '1080' }];
      const ephemeral = { url: 'movie.m3u8', playing: false, volume: 1 };

      const result = deriveEngineProps(ephemeral, manifest({ sources, title: 'My video' }, []));

      // The two content keys are overlaid from config...
      expect(result.sources).toBe(sources);
      expect(result.title).toBe('My video');
      // ...while the unrelated ephemeral keys are untouched.
      expect(result.url).toBe('movie.m3u8');
      expect(result.playing).toBe(false);
      expect(result.volume).toBe(1);
    });

    test('a non-content stray key in config is NOT copied into engine props', () => {
      const result = deriveEngineProps(
        { url: 'movie.m3u8' },
        manifest({ sources: [{ src: 'x' }], strayKey: 'should-not-leak' }, []),
      );

      // The overlay is bounded to the known content surface, so config noise cannot leak.
      expect(result).not.toHaveProperty('strayKey');
      expect(result.sources).toEqual([{ src: 'x' }]);
    });

    test('overlays the full content surface when config carries every content key', () => {
      const onPrevious = () => {};
      const onNext = () => {};
      const config = {
        sources: [{ src: 'v.m3u8' }],
        fullHDQualityBreak: 1080,
        captions: [{ src: 'en.vtt' }],
        poster: 'poster.jpg',
        chapters: [{ startTime: 0, title: 'Intro' }],
        heatmapData: [{ time: 0, value: 1 }],
        spriteVTTFile: 'sprite.vtt',
        bufferMode: 'ranges',
        title: 'Episode 1',
        onPrevious,
        onNext,
      };

      const result = deriveEngineProps({ url: 'movie.m3u8' }, manifest(config, []));

      expect(result).toEqual({ url: 'movie.m3u8', ...config, showNavButtons: false });
    });
  });

  describe('config wins over ephemeral for a migrated key (Req 6.6)', () => {
    test('sources present in both ⇒ result takes the config value', () => {
      const ephemeralSources = [{ src: 'A.m3u8' }];
      const configSources = [{ src: 'B.m3u8' }];

      const result = deriveEngineProps(
        { url: 'movie.m3u8', sources: ephemeralSources },
        manifest({ sources: configSources }, []),
      );

      // The overlay runs after the clone, so the migrated content key resolves to config.
      expect(result.sources).toBe(configSources);
      expect(result.sources).not.toBe(ephemeralSources);
    });
  });

  describe('showNavButtons derived from PrevButton/NextButton presence (Req 6.3)', () => {
    test('parts contains PrevButton ⇒ showNavButtons is true', () => {
      const result = deriveEngineProps({ url: 'm.m3u8' }, manifest({}, ['PrevButton']));

      expect(result.showNavButtons).toBe(true);
    });

    test('parts contains NextButton ⇒ showNavButtons is true', () => {
      const result = deriveEngineProps({ url: 'm.m3u8' }, manifest({}, ['NextButton']));

      expect(result.showNavButtons).toBe(true);
    });

    test('parts contains both PrevButton and NextButton ⇒ showNavButtons is true', () => {
      const result = deriveEngineProps({ url: 'm.m3u8' }, manifest({}, ['PrevButton', 'NextButton']));

      expect(result.showNavButtons).toBe(true);
    });

    test('parts without PrevButton/NextButton ⇒ showNavButtons is false', () => {
      const result = deriveEngineProps({ url: 'm.m3u8' }, manifest({}, ['Volume', 'PlayButton']));

      expect(result.showNavButtons).toBe(false);
    });

    test('never reads showNavButtons from ephemeral — presence derivation overrides it', () => {
      // A stale showNavButtons riding in on ephemeral must not win: the flag is ALWAYS derived
      // from `manifest.parts`, replacing the old boolean prop.
      const result = deriveEngineProps({ url: 'm.m3u8', showNavButtons: true }, manifest({}, []));

      expect(result.showNavButtons).toBe(false);
    });
  });

  describe('empty config ⇒ output identical to ephemeral except showNavButtons (Req 6.7)', () => {
    test('content keys already on ephemeral are left unchanged when config is empty', () => {
      const sources = [{ src: 'A.m3u8' }];
      const ephemeral = { url: 'm.m3u8', sources, poster: 'p.jpg', playing: true };

      const result = deriveEngineProps(ephemeral, manifest({}, []));

      // No content key is overlaid, so every ephemeral value keeps its identity...
      expect(result.sources).toBe(sources);
      expect(result.poster).toBe('p.jpg');
      // ...and the result equals ephemeral plus only the orthogonal showNavButtons derivation.
      expect(result).toEqual({ ...ephemeral, showNavButtons: false });
    });

    test('showNavButtons is orthogonal: empty config still yields true when PrevButton present', () => {
      const ephemeral = { url: 'm.m3u8' };

      const result = deriveEngineProps(ephemeral, manifest({}, ['PrevButton']));

      // The empty-config guarantee constrains only the content overlay; deriving showNavButtons
      // from `parts` is a separate step that always runs.
      expect(result).toEqual({ url: 'm.m3u8', showNavButtons: true });
    });
  });

  describe('feature-activation props pass through untouched (Req 9.3)', () => {
    test('ads/live/liveDVR/liveAd/prevented/pip and a lifecycle callback survive into the result', () => {
      const ads = { url: 'ad.xml' };
      const liveAd = { url: 'live-ad.xml' };
      const onPlay = () => {};
      const ephemeral = {
        url: 'm.m3u8',
        ads,
        live: true,
        liveDVR: true,
        liveAd,
        prevented: false,
        pip: true,
        onPlay,
      };

      // Overlaying content + deriving showNavButtons must not strip any ephemeral feature prop.
      const result = deriveEngineProps(ephemeral, manifest({ sources: [{ src: 'x' }] }, ['PrevButton']));

      expect(result.ads).toBe(ads);
      expect(result.live).toBe(true);
      expect(result.liveDVR).toBe(true);
      expect(result.liveAd).toBe(liveAd);
      expect(result.prevented).toBe(false);
      expect(result.pip).toBe(true);
      expect(result.onPlay).toBe(onPlay);
    });
  });

  describe('reads only config + parts (mode/order are ignored)', () => {
    test('informational manifest fields do not leak into engine props', () => {
      const m = manifest({ title: 'X' }, ['PrevButton']);
      // Sanity: the manifest we hand in really carries mode/order.
      expect(m).toHaveProperty('mode');
      expect(m).toHaveProperty('order');

      const result = deriveEngineProps({ url: 'm.m3u8' }, m);

      expect(result).not.toHaveProperty('mode');
      expect(result).not.toHaveProperty('order');
      expect(result).toEqual({ url: 'm.m3u8', title: 'X', showNavButtons: true });
    });
  });

  describe('purity contract (Req 12.6/12.7)', () => {
    test('returns a NEW object, not the ephemeral reference', () => {
      const ephemeral = { url: 'm.m3u8' };

      const result = deriveEngineProps(ephemeral, manifest({}, []));

      expect(result).not.toBe(ephemeral);
    });

    test('does NOT mutate the ephemeral object', () => {
      const ephemeral = { url: 'm.m3u8', sources: [{ src: 'A' }], playing: true };
      const snapshot = { ...ephemeral };

      deriveEngineProps(ephemeral, manifest({ sources: [{ src: 'B' }] }, ['PrevButton']));

      expect(ephemeral).toEqual(snapshot);
      expect(Object.keys(ephemeral)).toEqual(Object.keys(snapshot));
      // The derived flag is written on the clone only, never back onto ephemeral.
      expect(ephemeral).not.toHaveProperty('showNavButtons');
    });

    test('does NOT mutate the manifest (config object and parts Set unchanged)', () => {
      const config = { sources: [{ src: 'B' }], title: 'X' };
      const configSnapshot = { ...config };
      const m = manifest(config, ['PrevButton', 'Volume']);
      const partsBefore = Array.from(m.parts);

      deriveEngineProps({ url: 'm.m3u8' }, m);

      expect(m.config).toBe(config);
      expect(config).toEqual(configSnapshot);
      expect(Array.from(m.parts)).toEqual(partsBefore);
    });
  });
});
