import React from 'react';
import { DEFAULT_COMPOSITION } from '@playerstack/web-core/adapters/framework';

import { resolveComposition } from '@compound/hooks/useResolveComposition';
import { BottomBar } from '@compound/parts/BottomBar';
import { PlayButton } from '@compound/parts/PlayButton';
import { Volume } from '@compound/parts/Volume';
import { PlayOverlay } from '@compound/parts/PlayOverlay';
import { Poster } from '@compound/parts/Poster';
import { PlayTime } from '@compound/parts/PlayTime';
import { Title } from '@compound/parts/Title';
import { Source } from '@compound/parts/Source';

/**
 * Validates Property 4 (No-duplicado) —
 * Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8, 7.1, 7.4, 12.7, 12.8.
 *
 * `resolveComposition(children)` is the pure scan of `<Player>`'s children into a declarative
 * manifest `{ mode, parts, config, order }`. It reports WHICH composable parts the author
 * included (presence + author order) and WITH WHAT content (config), descending exactly ONE
 * level into container parts (`BottomBar`). These tests use the REAL part markers (so
 * `type[PART_NAME]` is wired exactly as in production) and build trees with `React.createElement`
 * — this is a `.js` spec kept JSX-free to match the sibling pure-helper specs.
 */

// A foreign function component that carries NO PART_NAME. The resolver must ignore it (Req 5.3)
// without breaking the scan of its valid siblings.
function ForeignComponent() {
  return null;
}

// Terse element builder so nested trees stay readable within the 120-col print width.
const el = React.createElement;

describe('compound/hooks/useResolveComposition', () => {
  describe('no children ⇒ default composition (Req 7.1)', () => {
    // ONLY `children == null` (null OR undefined) takes the default path.
    const nullishCases = [
      ['undefined', undefined],
      ['null', null],
    ];

    nullishCases.forEach(([label, input]) => {
      test(`resolveComposition(${label}) returns mode:'default' with the DEFAULT_COMPOSITION parts`, () => {
        const manifest = resolveComposition(input);

        expect(manifest.mode).toBe('default');
        expect(manifest.parts).toEqual(new Set(DEFAULT_COMPOSITION));
        expect(manifest.config).toEqual({});
        expect(manifest.order).toEqual([]);
      });
    });

    test('parts is a fresh Set copy of the readonly core array (gated with O(1) has())', () => {
      const manifest = resolveComposition(undefined);

      expect(manifest.parts).toBeInstanceOf(Set);
      expect(Array.from(manifest.parts)).toEqual([...DEFAULT_COMPOSITION]);
    });
  });

  describe("recognized children ⇒ mode:'custom' (Req 5.1/5.2/7.4)", () => {
    test('parts and order hold the recognized names in author order', () => {
      const children = [el(Poster, { src: 'p.jpg' }), el(PlayButton), el(Volume)];

      const manifest = resolveComposition(children);

      expect(manifest.mode).toBe('custom');
      expect(manifest.order).toEqual(['Poster', 'PlayButton', 'Volume']);
      expect(manifest.parts).toEqual(new Set(['Poster', 'PlayButton', 'Volume']));
    });

    test('descends into BottomBar direct children, preserving overall author order (Req 5.4/5.2)', () => {
      const children = [el(PlayOverlay), el(BottomBar, null, el(PlayButton), el(Volume), el(PlayTime))];

      const manifest = resolveComposition(children);

      expect(manifest.order).toEqual(['PlayOverlay', 'BottomBar', 'PlayButton', 'Volume', 'PlayTime']);
      expect(manifest.parts).toEqual(new Set(['PlayOverlay', 'BottomBar', 'PlayButton', 'Volume', 'PlayTime']));
    });
  });

  describe('de-dup — Property 4 (Req 5.5)', () => {
    test('repeating <Volume/> yields a single entry in both parts and order', () => {
      const children = [el(Volume), el(Volume), el(PlayButton), el(Volume)];

      const manifest = resolveComposition(children);

      expect(manifest.order).toEqual(['Volume', 'PlayButton']);
      expect(manifest.parts).toEqual(new Set(['Volume', 'PlayButton']));
      expect(manifest.order.filter((name) => name === 'Volume')).toHaveLength(1);
    });

    test('de-dups across the one-level descent (top-level <Volume/> + <Volume/> inside <BottomBar>)', () => {
      const children = [el(Volume), el(BottomBar, null, el(Volume))];

      const manifest = resolveComposition(children);

      expect(manifest.order).toEqual(['Volume', 'BottomBar']);
      expect(manifest.parts).toEqual(new Set(['Volume', 'BottomBar']));
    });
  });

  describe('one-level descent only (Req 5.4 + 5.8)', () => {
    test('registers a container child but NOT a part nested a second level deep', () => {
      // <BottomBar><PlayButton/><BottomBar><Volume/></BottomBar></BottomBar>
      const children = el(BottomBar, null, el(PlayButton), el(BottomBar, null, el(Volume)));

      const manifest = resolveComposition(children);

      // Req 5.4: the top-level container's DIRECT child is registered.
      expect(manifest.parts.has('PlayButton')).toBe(true);
      // The nested BottomBar itself IS recognized (it collapses onto the existing 'BottomBar' entry).
      expect(manifest.parts.has('BottomBar')).toBe(true);
      // Req 5.8: the part TWO levels below the top (Volume, under the nested BottomBar) is NOT registered.
      expect(manifest.parts.has('Volume')).toBe(false);
      expect(manifest.order).toEqual(['BottomBar', 'PlayButton']);
    });

    test('an empty top-level container registers itself and descends into nothing', () => {
      const manifest = resolveComposition(el(BottomBar));

      expect(manifest.parts).toEqual(new Set(['BottomBar']));
      expect(manifest.order).toEqual(['BottomBar']);
    });

    test('keeps scanning valid siblings inside a container after an invalid node', () => {
      const children = el(BottomBar, null, null, el(Volume));

      const manifest = resolveComposition(children);

      expect(manifest.parts).toEqual(new Set(['BottomBar', 'Volume']));
      expect(manifest.order).toEqual(['BottomBar', 'Volume']);
    });
  });

  describe('unknown / invalid nodes are ignored (Req 5.3)', () => {
    test('skips host elements, strings, numbers, null and PART_NAME-less components; keeps valid siblings', () => {
      const children = [el('div', null), 'a plain string child', 42, null, el(ForeignComponent), el(Volume)];

      const manifest = resolveComposition(children);

      expect(manifest.mode).toBe('custom');
      expect(manifest.parts).toEqual(new Set(['Volume']));
      expect(manifest.order).toEqual(['Volume']);
      expect(manifest.config).toEqual({});
    });
  });

  describe('empty array ⇒ empty custom manifest (Req 5.7)', () => {
    test("resolveComposition([]) is mode:'custom' with empty parts/order/config", () => {
      const manifest = resolveComposition([]);

      expect(manifest.mode).toBe('custom');
      expect(manifest.parts).toEqual(new Set());
      expect(manifest.parts.size).toBe(0);
      expect(manifest.order).toEqual([]);
      expect(manifest.config).toEqual({});
    });
  });

  describe('content collection through the resolver (Req 5.6)', () => {
    test('<Title>Hi</Title> puts "Hi" in config.title', () => {
      const manifest = resolveComposition([el(Title, null, 'Hi')]);

      expect(manifest.parts.has('Title')).toBe(true);
      expect(manifest.config.title).toBe('Hi');
    });

    test('<Source sources={s}/> puts s in config.sources', () => {
      const sources = [{ src: 'movie.m3u8', resolution: 1080 }];

      const manifest = resolveComposition([el(Source, { sources })]);

      expect(manifest.parts.has('Source')).toBe(true);
      expect(manifest.config.sources).toBe(sources);
    });

    test('accumulates content from multiple owner parts, including one inside a container', () => {
      const sources = [{ src: 'movie.m3u8', resolution: 1080 }];
      const children = [
        el(Source, { sources }),
        el(Poster, { src: 'p.jpg' }),
        el(BottomBar, null, el(Title, null, 'The Forest')),
      ];

      const manifest = resolveComposition(children);

      expect(manifest.config).toEqual({ sources, poster: 'p.jpg', title: 'The Forest' });
    });
  });

  describe('return shape and input purity', () => {
    test('returns exactly { mode, parts, config, order, containers }', () => {
      const manifest = resolveComposition([el(Volume)]);

      expect(Object.keys(manifest).sort()).toEqual(['config', 'containers', 'mode', 'order', 'parts']);
    });

    test('does not mutate the input children array', () => {
      const children = [el(Volume), el(PlayButton)];
      const snapshot = [...children];

      resolveComposition(children);

      expect(children).toEqual(snapshot);
      expect(children).toHaveLength(2);
    });
  });
});
