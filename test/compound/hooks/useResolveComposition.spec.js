import React from 'react';
import { DEFAULT_COMPOSITION } from '@playerstack/web-core/adapters/framework';

import { resolveComposition } from '@compound/hooks/useResolveComposition';
import { BottomBar } from '@compound/parts/BottomBar';
import { TopBar } from '@compound/parts/TopBar';
import { SidebarRight } from '@compound/parts/SidebarRight';
import { PlayButton } from '@compound/parts/PlayButton';
import { Volume } from '@compound/parts/Volume';
import { PlayOverlay } from '@compound/parts/PlayOverlay';
import { Poster } from '@compound/parts/Poster';
import { PlayTime } from '@compound/parts/PlayTime';
import { Title } from '@compound/parts/Title';
import { Source } from '@compound/parts/Source';
import { DesktopUI } from '@compound/parts/DesktopUI';
import { MobileUI } from '@compound/parts/MobileUI';
import { CenterControls } from '@compound/parts/CenterControls';
import { Settings } from '@compound/parts/Settings';
import { Cast } from '@compound/parts/Cast';
import { Timeline } from '@compound/parts/Timeline';
import { Chapters } from '@compound/parts/Chapters';
import { Heatmap } from '@compound/parts/Heatmap';
import { SidebarLeft } from '@compound/parts/SidebarLeft';
import { Fullscreen } from '@compound/parts/Fullscreen';
import { PrevButton } from '@compound/parts/PrevButton';
import { NextButton } from '@compound/parts/NextButton';

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
        // Every default part is at the shared level (no mode wrappers), so it renders in both modes.
        expect(manifest.sharedParts).toEqual(new Set(DEFAULT_COMPOSITION));
        expect(manifest.config).toEqual({});
        expect(manifest.order).toEqual([]);
        // No mode wrapper on the default path — each layout uses its default positions (Req 15.5).
        expect(manifest.desktop).toBeNull();
        expect(manifest.mobile).toBeNull();
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
    test('returns exactly the manifest keys including keepVisibleParts', () => {
      const manifest = resolveComposition([el(Volume)]);

      expect(Object.keys(manifest).sort()).toEqual([
        'config',
        'containerProps',
        'containers',
        'desktop',
        'keepVisibleParts',
        'mobile',
        'mode',
        'order',
        'parts',
        'sharedParts',
      ]);
    });

    test('does not mutate the input children array', () => {
      const children = [el(Volume), el(PlayButton)];
      const snapshot = [...children];

      resolveComposition(children);

      expect(children).toEqual(snapshot);
      expect(children).toHaveLength(2);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Per-mode composition wrappers — DesktopUI / MobileUI (Req 15.3–15.8, 15.12)
  // ───────────────────────────────────────────────────────────────────────────
  describe('per-mode wrappers (Req 15)', () => {
    test('no wrapper ⇒ desktop/mobile null; shared containers carry placement (current behavior)', () => {
      const children = [el(PlayOverlay), el(BottomBar, null, el(PlayButton), el(Volume))];

      const manifest = resolveComposition(children);

      expect(manifest.desktop).toBeNull();
      expect(manifest.mobile).toBeNull();
      expect(manifest.containers).toEqual({ BottomBar: ['PlayButton', 'Volume'] });
      expect(manifest.parts).toEqual(new Set(['PlayOverlay', 'BottomBar', 'PlayButton', 'Volume']));
    });

    test('<DesktopUI> populates manifest.desktop with its containers; mobile stays null', () => {
      const children = el(
        DesktopUI,
        null,
        el(TopBar, null, el(Title, null, 'The Forest')),
        el(BottomBar, null, el(PlayButton), el(Volume), el(Fullscreen)),
        el(SidebarRight, null, el(Cast)),
      );

      const manifest = resolveComposition(children);

      expect(manifest.mobile).toBeNull();
      expect(manifest.desktop).not.toBeNull();
      expect(manifest.desktop.containers).toEqual({
        TopBar: ['Title'],
        BottomBar: ['PlayButton', 'Volume', 'Fullscreen'],
        SidebarRight: ['Cast'],
      });
      // DesktopUI itself is NOT added to shared parts/containers (it is a mode selector).
      expect(manifest.parts.has('DesktopUI')).toBe(false);
      expect(manifest.containers.DesktopUI).toBeUndefined();
      // Branch parts collect BOTH the placement containers and the leaf controls inside them.
      expect(manifest.desktop.parts).toEqual(
        new Set(['TopBar', 'Title', 'BottomBar', 'PlayButton', 'Volume', 'Fullscreen', 'SidebarRight', 'Cast']),
      );
      // The container names DO flow to shared parts too (consistent with the shared scan, where
      // e.g. `BottomBar` is a gated part). The mode WRAPPER names are the only exclusion.
      expect(manifest.parts.has('BottomBar')).toBe(true);
      expect(manifest.parts.has('TopBar')).toBe(true);
    });

    test('<MobileUI> populates manifest.mobile (incl. CenterControls); desktop stays null', () => {
      const children = el(
        MobileUI,
        null,
        el(TopBar, null, el(Settings), el(Cast)),
        el(CenterControls, null, el(PrevButton, { onClick: () => {} }), el(NextButton, { onClick: () => {} })),
        el(BottomBar, null, el(PlayTime), el(Fullscreen)),
      );

      const manifest = resolveComposition(children);

      expect(manifest.desktop).toBeNull();
      expect(manifest.mobile).not.toBeNull();
      expect(manifest.mobile.containers).toEqual({
        TopBar: ['Settings', 'Cast'],
        CenterControls: ['PrevButton', 'NextButton'],
        BottomBar: ['PlayTime', 'Fullscreen'],
      });
      expect(manifest.parts.has('MobileUI')).toBe(false);
    });

    test('sharedParts holds ONLY the parts scanned outside any mode wrapper (Req 15.11)', () => {
      // Volume lives in the SHARED zone (a shared <BottomBar> outside wrappers) ⇒ both modes;
      // Settings lives ONLY inside <MobileUI> ⇒ mobile-exclusive; Cast lives ONLY inside
      // <DesktopUI> ⇒ desktop-only. (Timeline-bound parts are BottomBar-only per Req 16, so a
      // plain unrestricted control is used to exercise the shared-zone path.)
      const children = [
        el(BottomBar, null, el(Volume)),
        el(DesktopUI, null, el(BottomBar, null, el(Cast))),
        el(MobileUI, null, el(TopBar, null, el(Settings))),
      ];

      const manifest = resolveComposition(children);

      // Shared set = the top-level BottomBar + Volume only. The wrapper leaves are NOT shared.
      expect(manifest.sharedParts.has('Volume')).toBe(true);
      expect(manifest.sharedParts.has('Cast')).toBe(false);
      expect(manifest.sharedParts.has('Settings')).toBe(false);
      // Global parts still carry everything (feature activation reaches the engine in both modes).
      expect(manifest.parts.has('Volume')).toBe(true);
      expect(manifest.parts.has('Cast')).toBe(true);
      expect(manifest.parts.has('Settings')).toBe(true);
      // Each mode-exclusive leaf sits only in its own branch.
      expect(manifest.desktop.parts.has('Cast')).toBe(true);
      expect(manifest.mobile.parts.has('Settings')).toBe(true);
    });

    // Req 16 — Timeline/Chapters/Heatmap are BottomBar-only; anywhere else throws at resolve time.
    describe('container-placement restriction (Req 16)', () => {
      const restricted = [
        ['Timeline', Timeline],
        ['Chapters', Chapters],
        ['Heatmap', Heatmap],
      ];

      restricted.forEach(([name, Part]) => {
        test(`<${name}> inside <BottomBar> resolves without error`, () => {
          expect(() => resolveComposition(el(BottomBar, null, el(Part)))).not.toThrow();
        });

        test(`<${name}> at the top level throws a descriptive error`, () => {
          expect(() => resolveComposition([el(Part)])).toThrow(new RegExp(`<${name}>.*<BottomBar>`));
        });

        [
          ['TopBar', TopBar],
          ['SidebarLeft', SidebarLeft],
          ['SidebarRight', SidebarRight],
          ['CenterControls', CenterControls],
        ].forEach(([containerName, Container]) => {
          test(`<${name}> inside <${containerName}> throws`, () => {
            expect(() => resolveComposition(el(Container, null, el(Part)))).toThrow(
              new RegExp(`<${name}>.*<BottomBar>`),
            );
          });

          test(`<${name}> inside <MobileUI><${containerName}> throws`, () => {
            expect(() =>
              resolveComposition(el(MobileUI, null, el(Container, null, el(Part)))),
            ).toThrow(new RegExp(`<${name}>`));
          });
        });

        test(`<${name}> inside <DesktopUI><BottomBar> resolves without error`, () => {
          expect(() => resolveComposition(el(DesktopUI, null, el(BottomBar, null, el(Part))))).not.toThrow();
        });
      });
    });

    test('content config from inside a wrapper still flows to the SHARED config (Req 15.12)', () => {
      const sources = [{ src: 'movie.m3u8', resolution: 1080 }];
      const children = [
        el(Source, { sources }),
        el(DesktopUI, null, el(BottomBar, null, el(Title, null, 'Inside Desktop'))),
      ];

      const manifest = resolveComposition(children);

      // Title config reaches the shared config so the engine/feature activates in both modes.
      expect(manifest.config).toEqual({ sources, title: 'Inside Desktop' });
      // And Title is present in the shared parts too (feature-activation gating like showNavButtons).
      expect(manifest.parts.has('Title')).toBe(true);
      // Placement branch also carries it.
      expect(manifest.desktop.containers).toEqual({ BottomBar: ['Title'] });
      expect(manifest.desktop.config).toEqual({ title: 'Inside Desktop' });
    });

    test('PrevButton/NextButton config from a mode wrapper reaches shared config (showNavButtons)', () => {
      const onPrev = () => {};
      const onNext = () => {};
      const children = el(
        MobileUI,
        null,
        el(CenterControls, null, el(PrevButton, { onClick: onPrev }), el(NextButton, { onClick: onNext })),
      );

      const manifest = resolveComposition(children);

      expect(manifest.parts.has('PrevButton')).toBe(true);
      expect(manifest.parts.has('NextButton')).toBe(true);
      expect(manifest.config.onPrevious).toBe(onPrev);
      expect(manifest.config.onNext).toBe(onNext);
    });

    test('both wrappers present ⇒ both branches populated independently', () => {
      const children = [
        el(PlayOverlay),
        el(Source, { sources: [{ src: 'm.mp4', resolution: 720 }] }),
        el(DesktopUI, null, el(BottomBar, null, el(PlayButton), el(Volume))),
        el(MobileUI, null, el(CenterControls, null, el(PrevButton, { onClick: () => {} }))),
      ];

      const manifest = resolveComposition(children);

      expect(manifest.desktop.containers).toEqual({ BottomBar: ['PlayButton', 'Volume'] });
      expect(manifest.mobile.containers).toEqual({ CenterControls: ['PrevButton'] });
      // Shared parts include the parts from both wrappers plus the top-level shared overlay.
      expect(manifest.parts.has('PlayOverlay')).toBe(true);
      expect(manifest.parts.has('PlayButton')).toBe(true);
      expect(manifest.parts.has('PrevButton')).toBe(true);
      // The mode wrappers themselves are excluded from shared parts.
      expect(manifest.parts.has('DesktopUI')).toBe(false);
      expect(manifest.parts.has('MobileUI')).toBe(false);
    });

    test('an empty mode wrapper yields a branch with empty containers/parts (not null)', () => {
      const manifest = resolveComposition(el(DesktopUI));

      expect(manifest.desktop).toEqual({
        parts: new Set(),
        containers: {},
        containerProps: {},
        config: {},
        keepVisible: false,
      });
      expect(manifest.mobile).toBeNull();
    });

    test('a control placed directly under a wrapper (no container) still activates via shared parts', () => {
      const children = el(MobileUI, null, el(Settings));

      const manifest = resolveComposition(children);

      // No placement container recorded, but the part is present for feature activation.
      expect(manifest.mobile.containers).toEqual({});
      expect(manifest.mobile.parts.has('Settings')).toBe(true);
      expect(manifest.parts.has('Settings')).toBe(true);
    });
  });

  // Req 17 — keepVisible opt-out is captured on the manifest (leaf/container/mode).
  describe('keepVisible opt-out (Req 17)', () => {
    test('a leaf `keepVisible` lands in keepVisibleParts', () => {
      const manifest = resolveComposition(el(BottomBar, null, el(Settings, { keepVisible: true }), el(Volume)));

      expect(manifest.keepVisibleParts.has('Settings')).toBe(true);
      expect(manifest.keepVisibleParts.has('Volume')).toBe(false);
    });

    test('a container `keepVisible` lands on containerProps, not keepVisibleParts', () => {
      const manifest = resolveComposition(el(SidebarLeft, { keepVisible: true }, el(Volume)));

      expect(manifest.containerProps.SidebarLeft).toEqual({ keepVisible: true });
      // A container flag does NOT mark the container name as a keep-visible leaf.
      expect(manifest.keepVisibleParts.has('SidebarLeft')).toBe(false);
    });

    test('`keepVisible` on a mode wrapper is recorded on its branch', () => {
      const manifest = resolveComposition([
        el(DesktopUI, { keepVisible: true }, el(BottomBar, null, el(Volume))),
        el(MobileUI, null, el(BottomBar, null, el(Volume))),
      ]);

      expect(manifest.desktop.keepVisible).toBe(true);
      expect(manifest.mobile.keepVisible).toBe(false);
    });

    test('a leaf `keepVisible` inside a mode wrapper lands in keepVisibleParts', () => {
      const manifest = resolveComposition(
        el(MobileUI, null, el(TopBar, null, el(Settings, { keepVisible: true }))),
      );

      expect(manifest.keepVisibleParts.has('Settings')).toBe(true);
    });

    test('no keepVisible anywhere ⇒ empty keepVisibleParts', () => {
      const manifest = resolveComposition(el(BottomBar, null, el(Volume), el(PlayButton)));

      expect(manifest.keepVisibleParts.size).toBe(0);
    });

    // Timeline riders (Chapters/Heatmap) paint ON the Timeline slider and own no element of their
    // own, so their visibility follows the Timeline's keep-visible. A `keepVisible` on them is
    // inert — core's `acceptsKeepVisible` (single source of truth) rejects it and the resolver
    // must NOT add them to keepVisibleParts, while a real part (Volume) with keepVisible IS added.
    test('a `keepVisible` on the timeline riders Chapters/Heatmap is ignored (they follow the Timeline)', () => {
      const manifest = resolveComposition(
        el(
          BottomBar,
          null,
          el(Timeline),
          el(Chapters, { keepVisible: true }),
          el(Heatmap, { keepVisible: true }),
          el(Volume, { keepVisible: true }),
        ),
      );

      // Riders never opt into keep-visible, regardless of the (inert) prop.
      expect(manifest.keepVisibleParts.has('Chapters')).toBe(false);
      expect(manifest.keepVisibleParts.has('Heatmap')).toBe(false);
      // A regular part that accepts keepVisible still lands in keepVisibleParts.
      expect(manifest.keepVisibleParts.has('Volume')).toBe(true);
    });

    test('a `keepVisible` rider inside a mode wrapper is ignored too', () => {
      const manifest = resolveComposition(
        el(MobileUI, null, el(BottomBar, null, el(Chapters, { keepVisible: true }), el(Volume, { keepVisible: true }))),
      );

      expect(manifest.keepVisibleParts.has('Chapters')).toBe(false);
      expect(manifest.keepVisibleParts.has('Volume')).toBe(true);
    });
  });
});
