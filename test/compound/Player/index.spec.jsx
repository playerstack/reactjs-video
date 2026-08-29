import React from 'react';
import { render } from '@testing-library/react';

// Public entry (src/index.js) resolved through the `@` alias — the same specifier the existing
// entry specs (props/instanceMethods/staticMethods) use. The default export and the named
// `Player` must be the same composed root; the namespace import lets us assert that the removed
// monolith's former named exports resolve to `undefined`.
import Player, * as entryApi from '@';

// The composition Context value the (mocked) engine reads via the REAL useComposition(), recorded
// in render order. Named with the `mock` prefix so it may be referenced from the jest.mock factory.
const mockContextRecords = [];

// Swap ONLY the heavy, async <video> playback engine for a synchronous probe. Everything that
// DETERMINES the Context value — resolveComposition, deriveEngineProps, the memoization and the
// CompositionContext.Provider — stays REAL and is exercised here; none of it is stubbed. In
// production this deep engine subtree is exactly what consumes the Context (the orchestrator via
// useComposition), so reading the Context from the engine slot faithfully mirrors what a descendant
// sees. The probe is a plain (non-memoized) function component, so it re-renders on every <Player>
// render and records the Context value each time.
jest.mock('@root/engine', () => {
  const ReactLib = require('react');
  const { useComposition } = require('@compound/context/useComposition');

  return {
    __esModule: true,
    default: ReactLib.forwardRef(function MockPlayerEngine() {
      mockContextRecords.push(useComposition());
      return null;
    }),
  };
});

// Validates Requirements 1.1, 1.2, 2.2, 2.6, 4.2 and 4.3.
describe('public entry (src/index.js) + composed root Provider', () => {
  beforeEach(() => {
    // The exports assertions never render, but reset the render log so the Provider test below
    // reads only its own records regardless of execution order.
    mockContextRecords.length = 0;
  });

  describe('public exports', () => {
    test('default export is referentially identical to the named `Player` (Req 1.1/1.2/2.2)', () => {
      expect(Player).toBeDefined();
      expect(entryApi.Player).toBeDefined();
      // Strict referential identity: `default === Player` (same composed-root reference).
      expect(Object.is(Player, entryApi.Player)).toBe(true);
      // The namespace's own `default` slot is that very same reference too.
      expect(Object.is(Player, entryApi.default)).toBe(true);
    });

    test('re-exports the composable parts as named exports (Req 1.1/1.3)', () => {
      // Sanity: prove the entry loaded with a populated named surface, so the `undefined`
      // assertions below are meaningful and not a false positive from a broken import.
      expect(entryApi.PlayButton).toBeDefined();
      expect(entryApi.Volume).toBeDefined();
      expect(entryApi.BottomBar).toBeDefined();
      expect(entryApi.Captions).toBeDefined();
    });

    test('former monolith / internal-engine named exports resolve to `undefined` (Req 2.6)', () => {
      // The old entry exported ONLY a default (the prop-driven monolith); it never had these
      // named exports, and the engine factory is deliberately kept internal at `@root/engine`
      // (Req 2.5). Accessing any of the removed API's former names yields `undefined`.
      expect(entryApi.createMediaPlayer).toBeUndefined();
      expect(entryApi.Engine).toBeUndefined();
      expect(entryApi.MediaPlayer).toBeUndefined();
    });

    test('default export is the composed root, not the old constructable monolith (Req 2.6)', () => {
      // The removed monolith was a constructable React.Component class exposing static
      // `canPlay`/`canEnablePIP` and `displayName === 'MediaPlayer'`. The composed root is a
      // React.forwardRef object carrying neither static, with `displayName === 'Player'`.
      expect(Player.canPlay).toBeUndefined();
      expect(Player.canEnablePIP).toBeUndefined();
      expect(Player.displayName).toBe('Player');
    });
  });

  describe('root CompositionContext value identity (Req 4.2/4.3)', () => {
    test('stable identity while `manifest` is unchanged; new identity when it changes', () => {
      const { PlayButton, Volume } = entryApi;

      // A SINGLE, reused children reference. <Player> memoizes resolveComposition by `children`
      // identity, so re-rendering with this same reference must preserve the manifest identity
      // and therefore the provided Context value identity.
      const stableChildren = <PlayButton />;

      const { rerender } = render(
        <Player url="movie.mp4" playing={false}>
          {stableChildren}
        </Player>,
      );
      const afterFirstRender = mockContextRecords[mockContextRecords.length - 1];
      const rendersAfterFirst = mockContextRecords.length;

      // Re-render with the SAME children reference → same manifest → same Context value identity.
      rerender(
        <Player url="movie.mp4" playing={false}>
          {stableChildren}
        </Player>,
      );
      const afterSameChildren = mockContextRecords[mockContextRecords.length - 1];

      // Re-render with a DIFFERENT children set → manifest recomputed → new Context value identity.
      rerender(
        <Player url="movie.mp4" playing={false}>
          {[<PlayButton key="p" />, <Volume key="v" />]}
        </Player>,
      );
      const afterDifferentChildren = mockContextRecords[mockContextRecords.length - 1];

      // The probe re-rendered and read the Context on every <Player> render (initial + 2 re-renders).
      expect(rendersAfterFirst).toBeGreaterThanOrEqual(1);
      expect(mockContextRecords.length).toBeGreaterThanOrEqual(3);

      // Req 4.1: the provided value carries the composition manifest (parts is a Set).
      expect(afterFirstRender).toHaveProperty('manifest');
      expect(afterFirstRender.manifest.parts).toBeInstanceOf(Set);

      // Req 4.2: unchanged manifest ⇒ SAME provided value identity (and same manifest identity).
      expect(Object.is(afterFirstRender, afterSameChildren)).toBe(true);
      expect(Object.is(afterFirstRender.manifest, afterSameChildren.manifest)).toBe(true);

      // Req 4.3: changed manifest ⇒ NEW provided value identity (and new manifest identity).
      expect(Object.is(afterSameChildren, afterDifferentChildren)).toBe(false);
      expect(Object.is(afterSameChildren.manifest, afterDifferentChildren.manifest)).toBe(false);
    });
  });
});
