import React from 'react';
import { render } from '@testing-library/react';

// REAL public root, REAL engine (no `@root/engine` mock here): this spec documents that the
// imperative player API is preserved and reachable via a `ref` on `<Player>`.
import Player from '@';

/**
 * Task 11.1 — Imperative API reachability through the composed `<Player>` (Property 10 / VS9).
 *
 * The pre-composition player exposed an imperative surface (`getDuration`, `getCurrentTime`,
 * `getSecondsLoaded`, `getInternalPlayer`, `seekTo`) on a `ref`. That surface is PRESERVED: the
 * composed root forwards its `ref` straight to the internal engine
 * (`Player = forwardRef((props, ref) => <PlayerEngine ref={ref} {...engineProps} />)`, and
 * `@root/engine` is `createMediaPlayer(playerCore)` — a `MediaPlayer` class carrying those
 * methods). So a `ref` on `<Player>` resolves to the engine instance and the imperative API
 * remains reachable without any prop-driven monolith.
 *
 * This spec renders the REAL engine (unmocked). `<Player />` with no `url`/`sources` means
 * `canPlay('', [])` is `false`, so the lazy `<video>` engine subtree is never rendered — no async
 * import, no act noise — while the `MediaPlayer` class instance still mounts and exposes its
 * imperative methods. The methods return `null` (no active player loaded), which documents the
 * API SHAPE is wired and safe; the underlying playback behavior is owned by the engine's own specs.
 */
describe('imperative ref API is reachable via <Player ref> (Property 10)', () => {
  test('a ref on <Player> exposes the preserved imperative methods', () => {
    const ref = React.createRef();
    render(<Player ref={ref} />);

    expect(ref.current).not.toBeNull();
    // The full imperative surface the pre-composition player exposed remains reachable.
    expect(typeof ref.current.getDuration).toBe('function');
    expect(typeof ref.current.getCurrentTime).toBe('function');
    expect(typeof ref.current.getSecondsLoaded).toBe('function');
    expect(typeof ref.current.getInternalPlayer).toBe('function');
    expect(typeof ref.current.seekTo).toBe('function');
  });

  test('the imperative methods are safely callable with no active player loaded', () => {
    const ref = React.createRef();
    render(<Player ref={ref} />);

    // With no source there is no active player, so the getters return null (not throw).
    expect(ref.current.getDuration()).toBeNull();
    expect(ref.current.getCurrentTime()).toBeNull();
    expect(ref.current.getSecondsLoaded()).toBeNull();
    expect(ref.current.getInternalPlayer()).toBeNull();
    // `seekTo` is a no-op (returns undefined/null) rather than throwing when no player exists.
    expect(() => ref.current.seekTo(10)).not.toThrow();
  });
});
