import React from 'react';
import { render } from '@testing-library/react';

import { DEFAULT_COMPOSITION, COMPOSABLE_SLOTS, resolveSlotOrder } from '@playerstack/web-core/adapters/framework';

import CorePlayerSkin from '@PlayerSkin/CorePlayerSkin';
import { Provider } from '@context/index';
import { CompositionContext } from '@compound/context/CompositionContext';

/**
 * Task 8.3 — Integration tests for composition-driven GATING, canonical DOM ORDER and LAYOUT
 * SELECTION at the orchestrator + layouts level (the wiring landed in task 8.2).
 *
 * These validate the observable output of `skin.composition.parts` flowing through
 * `CorePlayerSkin` → `DesktopLayout`/`MobileLayout` → the cluster components:
 *
 *   • Property 1 / Property 3 (Req 8.3/8.4): a part present in `manifest.parts` renders its
 *     `playerstack-*` element/cluster; a part absent does NOT.
 *   • Property 5 (Req 8.5 / 1.8): the DOM order of the emitted elements is the canonical
 *     `COMPOSABLE_SLOTS` order per region, INDEPENDENT of the order the author declared the
 *     parts (here: the order they were collected into `manifest.parts`).
 *   • Layout selection (Req 8.6–8.9): `selectMobileSkin` true → `MobileLayout` with
 *     `data-skin-mode="mobile"`; false → `DesktopLayout` with `data-skin-mode="desktop"`.
 *   • Default composition (Req 7.2/7.3): `parts = DEFAULT_COMPOSITION` renders exactly the
 *     default parts' elements (in canonical order) and nothing outside that set.
 *
 * Rendering approach mirrors the fixed suites from task 8.2 (`CorePlayerSkinNav`,
 * `CorePlayerSkinParity`, `PlayerSkinMode`): render `CorePlayerSkin` directly, wrapped in the
 * skin UI `Provider` (`@context/index`) AND a `CompositionContext.Provider` that supplies the
 * manifest. Driving `manifest.parts` here is equivalent to what a `<Player>`'s children scan
 * (`resolveComposition`) produces — the layouts gate purely on `parts.has(name)`.
 */

// Keep the skin in DESKTOP mode by default (isMobile=false) so the desktop control-bar branch is
// exercised deterministically regardless of the test env's UA — same convention as the Nav/Parity/
// Mode specs. The mobile branch is driven explicitly via `skinMode="mobile"` where needed.
jest.mock('@playerstack/web-core', () => {
  const actual = jest.requireActual('@playerstack/web-core');
  return {
    ...actual,
    isMobile: false,
  };
});

const Wrapper = ({ children }) => <Provider language="en">{children}</Provider>;

// Minimal props required by CorePlayerSkin's bridge + render paths (mirrors CorePlayerSkinNav).
// `live: false` keeps `computeShowTimeSlider` true so the `Timeline` slot renders; no ads, no
// captions and no cast support, so the runtime-gated affordances (Cast/CaptionsToggle/Captions)
// stay hidden and only the composition-driven controls are asserted below.
const baseProps = {
  live: false,
  liveDVR: false,
  loading: false,
  paused: true,
  ended: false,
  seeking: false,
  waiting: false,
  duration: 100,
  bufferedRanges: [],
  currentTime: 0,
  muted: false,
  volume: 1,
  pip: false,
  fullscreen: false,
  qualities: [],
  captions: [],
  activeCaption: undefined,
  chapters: [],
  heatmapData: [],
  playbackRate: 1,
  playbackQuality: 0,
  loop: false,
  language: 'en',
  ads: null,
  kernelMsg: null,
  skinMode: 'desktop',
};

// The desktop `playerstack-*` element the layout emits for each composition part that maps to a
// Custom Element and is gated PURELY by composition presence under `baseProps` (no extra runtime
// condition). `Cast`/`CaptionsToggle` are skin `<button>`s with additional runtime gating and are
// covered separately; `PlayOverlay`/`Poster`/`Captions` are stage overlays (Req 9.6), not gated.
const ELEMENT = {
  PlayButton: 'playerstack-play-button',
  Volume: 'playerstack-volume',
  PlayTime: 'playerstack-play-time',
  Timeline: 'playerstack-time-slider',
  Settings: 'playerstack-settings',
  Fullscreen: 'playerstack-fullscreen-button',
};

/**
 * Render `CorePlayerSkin` with a composition manifest whose `parts` is the given name list.
 * `parts` stands in for what `<Player>`'s children scan would produce; the layout gates presence
 * on `parts.has(name)` (task 8.2). `extraProps` override base playback props (e.g. `skinMode`).
 */
function renderSkin(parts, extraProps = {}) {
  const manifest = { mode: 'custom', parts: new Set(parts), config: {}, order: [], containers: {} };
  return render(
    <Wrapper>
      <CompositionContext.Provider value={{ manifest }}>
        <CorePlayerSkin {...baseProps} {...extraProps} />
      </CompositionContext.Provider>
    </Wrapper>,
  );
}

/** Document-order list of the given tag names found within a region container (or [] if absent). */
function tagOrderWithin(container, regionSelector, tags) {
  const region = container.querySelector(regionSelector);
  if (!region) {
    return [];
  }
  // `querySelectorAll` returns matches in DOM (document) order regardless of selector order.
  return Array.from(region.querySelectorAll(tags.join(','))).map((el) => el.tagName.toLowerCase());
}

// Parts that map to a Custom Element and are gated PURELY by composition presence under baseProps.
const CLEANLY_GATED_PARTS = ['PlayButton', 'Volume', 'PlayTime', 'Timeline', 'Settings', 'Fullscreen'];

// ─────────────────────────────────────────────────────────────────────────────
// Property 1 / Property 3 — presence gating (Req 8.3, 8.4)
// ─────────────────────────────────────────────────────────────────────────────
describe('Presence gating: cluster renders IFF its part ∈ manifest.parts (Property 1/3, Req 8.3/8.4)', () => {
  describe.each(CLEANLY_GATED_PARTS)('%s', (part) => {
    const tag = ELEMENT[part];

    test(`renders <${tag}> when '${part}' ∈ parts`, () => {
      // DEFAULT_COMPOSITION contains this part → its element is emitted.
      const { container } = renderSkin(DEFAULT_COMPOSITION);
      expect(container.querySelector(tag)).not.toBeNull();
    });

    test(`omits <${tag}> when '${part}' ∉ parts`, () => {
      // Same manifest minus this one part → its element must disappear, everything else stays.
      const parts = DEFAULT_COMPOSITION.filter((name) => name !== part);
      const { container } = renderSkin(parts);
      expect(container.querySelector(tag)).toBeNull();
    });
  });

  test("the whole control bar is gated on the 'BottomBar' container part", () => {
    // Present → the `.playerstack-controls` bar (and its inner controls) render.
    const { container: withBar } = renderSkin(DEFAULT_COMPOSITION);
    expect(withBar.querySelector('.playerstack-controls')).not.toBeNull();
    expect(withBar.querySelector('playerstack-play-button')).not.toBeNull();

    // Absent → the bar container and every control inside it are dropped (the standalone
    // timeline lives outside the bar, so it is unaffected — verified in its own gating case).
    const { container: withoutBar } = renderSkin(DEFAULT_COMPOSITION.filter((name) => name !== 'BottomBar'));
    expect(withoutBar.querySelector('.playerstack-controls')).toBeNull();
    expect(withoutBar.querySelector('playerstack-play-button')).toBeNull();
    expect(withoutBar.querySelector('playerstack-settings')).toBeNull();
  });

  test("the nav cluster is gated on 'PrevButton'/'NextButton' parts, independent of the runtime showNav flag", () => {
    const navHandlers = { onPrevious: jest.fn(), onNext: jest.fn() };

    // showNav is satisfied (onPrevious/onNext provided) AND PrevButton ∈ parts → nav renders.
    const { container: withNav } = renderSkin([...DEFAULT_COMPOSITION, 'PrevButton', 'NextButton'], navHandlers);
    expect(withNav.querySelector('.playerstack-prev-button')).not.toBeNull();
    expect(withNav.querySelector('.playerstack-next-button')).not.toBeNull();

    // showNav is STILL satisfied but PrevButton/NextButton ∉ parts (they are opt-in, not in
    // DEFAULT_COMPOSITION) → composition gates it off. Presence is driven by the manifest.
    const { container: withoutNav } = renderSkin(DEFAULT_COMPOSITION, navHandlers);
    expect(withoutNav.querySelector('.playerstack-prev-button')).toBeNull();
    expect(withoutNav.querySelector('.playerstack-next-button')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 5 — canonical DOM order, independent of author/child (parts) order (Req 8.5, 1.8)
// ─────────────────────────────────────────────────────────────────────────────
describe('Canonical DOM order per region, independent of children order (Property 5, Req 8.5/1.8)', () => {
  const LEFT = '.playerstack-controls-left';
  const RIGHT = '.playerstack-controls-right';
  const LEFT_TAGS = [ELEMENT.PlayButton, ELEMENT.Volume, ELEMENT.PlayTime];

  test('control-bar-left renders play-button → volume → play-time (canonical order)', () => {
    const { container } = renderSkin(DEFAULT_COMPOSITION);
    expect(tagOrderWithin(container, LEFT, LEFT_TAGS)).toEqual([
      'playerstack-play-button',
      'playerstack-volume',
      'playerstack-play-time',
    ]);
  });

  test('the resulting order is INDEPENDENT of the order the parts were collected', () => {
    // Two scrambled collection orders (as if the author listed the children differently).
    const scrambledA = ['BottomBar', 'PlayTime', 'PlayButton', 'Volume'];
    const scrambledB = ['BottomBar', 'Volume', 'PlayTime', 'PlayButton'];

    const orderA = tagOrderWithin(renderSkin(scrambledA).container, LEFT, LEFT_TAGS);
    const orderB = tagOrderWithin(renderSkin(scrambledB).container, LEFT, LEFT_TAGS);

    // Same canonical DOM order in both cases…
    expect(orderA).toEqual(['playerstack-play-button', 'playerstack-volume', 'playerstack-play-time']);
    expect(orderB).toEqual(orderA);
    // …and it matches the catalog's canonical order (`resolveSlotOrder`) mapped to elements.
    const expected = resolveSlotOrder(['PlayTime', 'PlayButton', 'Volume']).map((name) => ELEMENT[name]);
    expect(orderA).toEqual(expected);
  });

  test('nav prev-button (order 50) precedes play-button (order 60) and next-button (order 65) follows in control-bar-left', () => {
    const { container } = renderSkin([...DEFAULT_COMPOSITION, 'PrevButton', 'NextButton'], {
      onPrevious: jest.fn(),
      onNext: jest.fn(),
    });
    const left = container.querySelector('.playerstack-controls-left');
    const prevBtn = left.querySelector('.playerstack-prev-button');
    const playBtn = left.querySelector('playerstack-play-button');
    const nextBtn = left.querySelector('.playerstack-next-button');
    expect(prevBtn).not.toBeNull();
    expect(playBtn).not.toBeNull();
    expect(nextBtn).not.toBeNull();
    // Verify DOM order: prev comes before play, next comes after play.
    expect(prevBtn.compareDocumentPosition(playBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(playBtn.compareDocumentPosition(nextBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('control-bar-right renders settings → fullscreen (canonical order)', () => {
    const { container } = renderSkin(DEFAULT_COMPOSITION);
    expect(tagOrderWithin(container, RIGHT, [ELEMENT.Settings, ELEMENT.Fullscreen])).toEqual([
      'playerstack-settings',
      'playerstack-fullscreen-button',
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Layout selection + data-skin-mode (Req 8.6, 8.7, 8.8, 8.9)
// ─────────────────────────────────────────────────────────────────────────────
describe('Layout selection via selectMobileSkin + data-skin-mode (Req 8.6–8.9)', () => {
  const skinModeOf = (container) =>
    container.querySelector('playerstack-media-controller').getAttribute('data-skin-mode');

  test('skinMode="desktop" → DesktopLayout with data-skin-mode="desktop"', () => {
    // selectMobileSkin('desktop', …) === false → DesktopLayout.
    const { container } = renderSkin(DEFAULT_COMPOSITION, { skinMode: 'desktop' });
    expect(skinModeOf(container)).toBe('desktop');
    expect(container.querySelector('.playerstack-controls')).not.toBeNull();
    expect(container.querySelector('.playerstack-mobile-bottom-bar')).toBeNull();
  });

  test('skinMode="mobile" → MobileLayout with data-skin-mode="mobile"', () => {
    // selectMobileSkin('mobile', …) === true → MobileLayout (forces mobile regardless of isMobile).
    const { container } = renderSkin(DEFAULT_COMPOSITION, { skinMode: 'mobile' });
    expect(skinModeOf(container)).toBe('mobile');
    expect(container.querySelector('.playerstack-mobile-bottom-bar')).not.toBeNull();
    expect(container.querySelector('.playerstack-controls')).toBeNull();
  });

  test('skinMode="auto" defers to isMobile (mocked false) → DesktopLayout', () => {
    // selectMobileSkin('auto', false) === false. The pure predicate's isMobile branch itself is
    // unit-covered in helpers/skinSelection.spec.js; here we assert the end-to-end layout outcome.
    const { container } = renderSkin(DEFAULT_COMPOSITION, { skinMode: 'auto' });
    expect(skinModeOf(container)).toBe('desktop');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Default composition (Req 7.2, 7.3)
// ─────────────────────────────────────────────────────────────────────────────
describe('Default composition renders exactly DEFAULT_COMPOSITION and nothing outside it (Req 7.2/7.3)', () => {
  // A bare `<Player url=… />` yields this manifest (Req 7.1); render it directly here.
  const renderDefault = () =>
    render(
      <Wrapper>
        <CompositionContext.Provider
          value={{ manifest: { mode: 'default', parts: new Set(DEFAULT_COMPOSITION), config: {}, order: [] } }}
        >
          <CorePlayerSkin {...baseProps} />
        </CompositionContext.Provider>
      </Wrapper>,
    );

  test('renders the default control set (Req 7.2)', () => {
    const { container } = renderDefault();
    // Default parts that map to an element and render under bare base props.
    expect(container.querySelector('.playerstack-controls')).not.toBeNull(); // BottomBar
    expect(container.querySelector('playerstack-play-button')).not.toBeNull(); // PlayButton
    expect(container.querySelector('playerstack-volume')).not.toBeNull(); // Volume
    expect(container.querySelector('playerstack-play-time')).not.toBeNull(); // PlayTime
    expect(container.querySelector('playerstack-time-slider')).not.toBeNull(); // Timeline
    expect(container.querySelector('playerstack-settings')).not.toBeNull(); // Settings
    expect(container.querySelector('playerstack-fullscreen-button')).not.toBeNull(); // Fullscreen
    expect(container.querySelector('playerstack-play-state')).not.toBeNull(); // PlayOverlay (desktop)
  });

  test('renders the default control set in canonical order (Req 7.2 / Property 5)', () => {
    const { container } = renderDefault();
    expect(
      tagOrderWithin(container, '.playerstack-controls-left', [ELEMENT.PlayButton, ELEMENT.Volume, ELEMENT.PlayTime]),
    ).toEqual(['playerstack-play-button', 'playerstack-volume', 'playerstack-play-time']);
    expect(tagOrderWithin(container, '.playerstack-controls-right', [ELEMENT.Settings, ELEMENT.Fullscreen])).toEqual([
      'playerstack-settings',
      'playerstack-fullscreen-button',
    ]);
  });

  test('does NOT render any composable part outside DEFAULT_COMPOSITION (Req 7.3)', () => {
    const { container } = renderDefault();

    // Every catalog part that maps to a Custom Element but is NOT in DEFAULT_COMPOSITION must be
    // absent. Derived from the catalog so it stays correct if the default set changes.
    const nonDefaultElementTags = COMPOSABLE_SLOTS.filter(
      (slot) => slot.element && !DEFAULT_COMPOSITION.includes(slot.name),
    ).map((slot) => slot.element);

    // Sanity: the catalog does expose at least one opt-in element part (currently Title).
    expect(nonDefaultElementTags).toContain('playerstack-title');
    nonDefaultElementTags.forEach((tag) => {
      expect(container.querySelector(tag)).toBeNull();
    });

    // `Title` is opt-in (not in DEFAULT_COMPOSITION) and its `playerstack-title` element is not
    // rendered in v1 either — assert its absence explicitly (Req 7.3).
    expect(container.querySelector('playerstack-title')).toBeNull();
  });
});
