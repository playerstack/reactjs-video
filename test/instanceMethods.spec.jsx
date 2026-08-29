import React from 'react';
import { render, act } from '@testing-library/react';

// REAL public root + REAL engine. The pre-composition player was a constructable default export
// (`new PlayerStack()`) that exposed an imperative surface (references / getters / seekTo /
// handleReady) directly on the instance. That monolith is gone (Req 2.3/2.6): the default export
// is now the composed `Player`, a `forwardRef` that FORWARDS its ref straight to the internal
// engine (`createMediaPlayer(playerCore)` — the `MediaPlayer` class carrying that surface). So the
// imperative API is preserved and is reached via a `ref` on `<Player>` instead of `new`.
//
// This is the MIGRATION of the former `instanceMethods.spec.js`: it keeps the meaningful coverage
// that the existing specs do NOT provide — the `references.player`/`references.wrapper` SETTER
// wiring, the `handleReady`/`onReady` callback, and delegation of the getters/`seekTo` to the
// active player (return values + argument forwarding) — now driven end-to-end through the public
// composed `<Player ref>` (Property 10 / VS9). `Player.features.imperativeRef.spec.jsx` only proves
// the methods EXIST and are null-safe; `createMediaPlayer.spec.jsx` sets `instance.player` directly
// and never touches `references.*` or `handleReady`. This spec covers that remaining gap.
//
// `<Player />` is rendered without `url`/`sources`, so `canPlay('', [])` is false and the lazy
// `<video>` engine subtree never mounts (no async import) while the `MediaPlayer` class instance
// still mounts and exposes its imperative surface via the ref.
import Player from '@';

const COMMON_METHODS = ['getDuration', 'getCurrentTime', 'getSecondsLoaded', 'getInternalPlayer'];

const renderPlayer = (props) => {
  const ref = React.createRef();
  render(<Player ref={ref} {...props} />);
  return ref;
};

describe('COMMON_METHODS reached via <Player ref>', () => {
  test.each(COMMON_METHODS)('%s() - delegates to the active player ref', (method) => {
    const ref = renderPlayer();
    // Wiring the active player through the real `references.player` setter (guarded + forceUpdate)
    // must make the imperative getter delegate to it.
    act(() => {
      ref.current.references.player({ [method]: () => 123 });
    });
    expect(ref.current[method]()).toBe(123);
  });

  test.each(COMMON_METHODS)('%s() - returns null when no player is loaded', (method) => {
    const ref = renderPlayer();
    expect(ref.current[method]()).toBe(null);
  });
});

describe('Other imperative methods reached via <Player ref>', () => {
  test('getInternalPlayer() - forwards the default "player" key', () => {
    const ref = renderPlayer();
    const mockGetInternalPlayer = jest.fn().mockReturnValue('abc');
    act(() => {
      ref.current.references.player({ getInternalPlayer: mockGetInternalPlayer });
    });
    const result = ref.current.getInternalPlayer();

    expect(result).toBe('abc');
    expect(mockGetInternalPlayer).toHaveBeenCalledWith('player');
  });

  test('seekTo() - forwards its arguments to the active player', () => {
    const ref = renderPlayer();
    const mockSeekTo = jest.fn();
    act(() => {
      ref.current.references.player({ seekTo: mockSeekTo });
    });
    ref.current.seekTo(5, 'seconds', true);

    expect(mockSeekTo).toHaveBeenCalledTimes(1);
    expect(mockSeekTo).toHaveBeenCalledWith(5, 'seconds', true);
  });

  test('seekTo() - returns null when no player is loaded', () => {
    const ref = renderPlayer();
    expect(ref.current.seekTo()).toBe(null);
  });

  test('handleReady() - invokes the onReady callback with the engine instance', () => {
    const mockOnReady = jest.fn();
    // `onReady` is an ephemeral prop of <Player>, forwarded to the engine, so the preserved
    // `handleReady()` invokes it with the engine instance (the ref target) — same contract the
    // monolith honored with `onReady(instance)`.
    const ref = renderPlayer({ onReady: mockOnReady });
    ref.current.handleReady();
    expect(mockOnReady).toHaveBeenCalledTimes(1);
    expect(mockOnReady).toHaveBeenCalledWith(ref.current);
  });

  test('references - store the provided player/wrapper refs on the instance', () => {
    const ref = renderPlayer();
    act(() => {
      ref.current.references.player('abc');
      ref.current.references.wrapper('def');
    });

    expect(ref.current.player).toBe('abc');
    expect(ref.current.wrapper).toBe('def');
  });
});
