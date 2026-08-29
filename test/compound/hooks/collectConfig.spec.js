import { collectConfig } from '@compound/hooks/collectConfig';

/**
 * Validates Property 2 (Migración de props de contenido) — Requirements 5.6, 6.2, 10.4, 12.7, 12.8.
 *
 * `collectConfig(name, props, config)` is a pure content-prop collector: it reads a single
 * composable part's content props and writes them into the shared `config` accumulator under
 * the exact key the engine expects. It skips `null`/`undefined` (never clobbering an engine
 * default), never mutates `props`, and returns the same `config` accumulator it received.
 */
describe('compound/hooks/collectConfig', () => {
  // Run against a fresh accumulator so each case is isolated.
  const run = (name, props, config = {}) => collectConfig(name, props, config);

  describe('Title → config.title (from children)', () => {
    test('assigns non-empty string children', () => {
      expect(run('Title', { children: 'My video' })).toEqual({ title: 'My video' });
    });

    test('keeps surrounding whitespace of a non-empty string verbatim (trim only decides emptiness)', () => {
      expect(run('Title', { children: '  Hello  ' })).toEqual({ title: '  Hello  ' });
    });

    test('does NOT assign empty-string children', () => {
      expect(run('Title', { children: '' })).toEqual({});
    });

    test('does NOT assign whitespace-only children', () => {
      expect(run('Title', { children: '   \t\n  ' })).toEqual({});
    });

    test('does NOT assign null children', () => {
      expect(run('Title', { children: null })).toEqual({});
    });

    test('does NOT assign undefined children (prop absent)', () => {
      expect(run('Title', {})).toEqual({});
    });

    test('assigns a non-string node (number) as-is', () => {
      expect(run('Title', { children: 42 })).toEqual({ title: 42 });
    });

    test('assigns a falsy-but-present non-string node (0)', () => {
      expect(run('Title', { children: 0 })).toEqual({ title: 0 });
    });
  });

  describe('Poster → config.poster (from src, fallback poster)', () => {
    test('uses src when present', () => {
      expect(run('Poster', { src: 'poster.jpg' })).toEqual({ poster: 'poster.jpg' });
    });

    test('falls back to poster when src is absent', () => {
      expect(run('Poster', { poster: 'fallback.jpg' })).toEqual({ poster: 'fallback.jpg' });
    });

    test('falls back to poster when src is null', () => {
      expect(run('Poster', { src: null, poster: 'fallback.jpg' })).toEqual({ poster: 'fallback.jpg' });
    });

    test('prefers src over poster when both are present', () => {
      expect(run('Poster', { src: 'a.jpg', poster: 'b.jpg' })).toEqual({ poster: 'a.jpg' });
    });

    test('writes nothing when neither src nor poster is present', () => {
      expect(run('Poster', {})).toEqual({});
    });
  });

  describe('Captions → config.captions (from tracks, fallback captions)', () => {
    const tracks = [{ src: 'en.vtt', srcLang: 'en' }];
    const captions = [{ src: 'es.vtt', srcLang: 'es' }];

    test('uses tracks when present', () => {
      expect(run('Captions', { tracks })).toEqual({ captions: tracks });
    });

    test('falls back to captions when tracks is absent', () => {
      expect(run('Captions', { captions })).toEqual({ captions });
    });

    test('prefers tracks over captions when both are present', () => {
      expect(run('Captions', { tracks, captions })).toEqual({ captions: tracks });
    });

    test('writes nothing when neither tracks nor captions is present', () => {
      expect(run('Captions', {})).toEqual({});
    });
  });

  describe('Source → config.sources / config.fullHDQualityBreak', () => {
    const sources = [{ src: 'video.m3u8', resolution: '1080' }];

    test('assigns both sources and fullHDQualityBreak', () => {
      expect(run('Source', { sources, fullHDQualityBreak: 1080 })).toEqual({
        sources,
        fullHDQualityBreak: 1080,
      });
    });

    test('assigns only sources when fullHDQualityBreak is absent', () => {
      expect(run('Source', { sources })).toEqual({ sources });
    });

    test('assigns only fullHDQualityBreak when sources is absent', () => {
      expect(run('Source', { fullHDQualityBreak: 720 })).toEqual({ fullHDQualityBreak: 720 });
    });

    test('skips null values without clobbering (nothing written)', () => {
      expect(run('Source', { sources: null, fullHDQualityBreak: null })).toEqual({});
    });

    test('writes nothing when both props are absent', () => {
      expect(run('Source', {})).toEqual({});
    });
  });

  describe('Timeline → config.spriteVTTFile / config.bufferMode', () => {
    test('assigns both spriteVTTFile and bufferMode', () => {
      expect(run('Timeline', { spriteVTTFile: 'sprite.vtt', bufferMode: 'ranges' })).toEqual({
        spriteVTTFile: 'sprite.vtt',
        bufferMode: 'ranges',
      });
    });

    test('assigns only the present key', () => {
      expect(run('Timeline', { bufferMode: 'seconds' })).toEqual({ bufferMode: 'seconds' });
    });

    test('writes nothing when both props are absent', () => {
      expect(run('Timeline', {})).toEqual({});
    });
  });

  describe('Chapters → config.chapters', () => {
    const chapters = [{ startTime: 0, title: 'Intro' }];

    test('assigns chapters', () => {
      expect(run('Chapters', { chapters })).toEqual({ chapters });
    });

    test('writes nothing when chapters is absent', () => {
      expect(run('Chapters', {})).toEqual({});
    });
  });

  describe('Heatmap → config.heatmapData', () => {
    const heatmapData = [{ time: 0, value: 1 }];

    test('assigns heatmapData', () => {
      expect(run('Heatmap', { heatmapData })).toEqual({ heatmapData });
    });

    test('writes nothing when heatmapData is absent', () => {
      expect(run('Heatmap', {})).toEqual({});
    });
  });

  describe('PrevButton → config.onPrevious', () => {
    test('assigns onClick as onPrevious', () => {
      const onClick = () => {};
      expect(run('PrevButton', { onClick })).toEqual({ onPrevious: onClick });
    });

    test('writes nothing when onClick is absent', () => {
      expect(run('PrevButton', {})).toEqual({});
    });
  });

  describe('NextButton → config.onNext', () => {
    test('assigns onClick as onNext', () => {
      const onClick = () => {};
      expect(run('NextButton', { onClick })).toEqual({ onNext: onClick });
    });

    test('writes nothing when onClick is absent', () => {
      expect(run('NextButton', {})).toEqual({});
    });
  });

  describe('guards and non-content parts', () => {
    test('props == null returns the same config untouched', () => {
      const config = { existing: true };
      const result = collectConfig('Title', null, config);

      expect(result).toBe(config);
      expect(result).toEqual({ existing: true });
    });

    test('props === undefined returns the same config untouched', () => {
      const config = {};
      const result = collectConfig('Source', undefined, config);

      expect(result).toBe(config);
      expect(config).toEqual({});
    });

    test('a content-less known part (Volume) writes nothing', () => {
      expect(run('Volume', { anything: 'ignored' })).toEqual({});
    });

    test('an unknown part name writes nothing', () => {
      expect(run('Mystery', { sources: [{ src: 'x' }], title: 'ignored' })).toEqual({});
    });

    test("the literal 'default' name writes nothing", () => {
      expect(run('default', { children: 'ignored' })).toEqual({});
    });
  });

  describe('purity contract', () => {
    test('returns the same config accumulator it was given', () => {
      const config = {};
      expect(collectConfig('Chapters', { chapters: [] }, config)).toBe(config);
    });

    test('does NOT mutate the props object', () => {
      const props = { src: 'poster.jpg', poster: 'fallback.jpg' };
      const snapshot = { ...props };

      collectConfig('Poster', props, {});

      expect(props).toEqual(snapshot);
      expect(Object.keys(props)).toEqual(Object.keys(snapshot));
    });

    test('accumulates content from multiple parts into one shared config', () => {
      const sources = [{ src: 'video.m3u8' }];
      const onNext = () => {};
      const config = {};

      collectConfig('Source', { sources }, config);
      collectConfig('Title', { children: 'Episode 1' }, config);
      collectConfig('NextButton', { onClick: onNext }, config);

      expect(config).toEqual({ sources, title: 'Episode 1', onNext });
    });
  });
});
