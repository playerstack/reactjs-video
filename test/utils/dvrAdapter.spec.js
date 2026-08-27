import { createWebDVRAdapter } from '@utils/dvrAdapter';

/**
 * Spec for `createWebDVRAdapter` — the web `DVRAdapter` I/O over an `HTMLMediaElement`.
 * Focus: `getSeekableRange` must report "no usable DVR" until the element has a real playback
 * position (`readyState >= HAVE_CURRENT_DATA`), so a `seekable` window that appears before the
 * position syncs to the live edge does not produce a bogus behind-live offset (the transient
 * `-10:01` timer glitch on first load).
 */

/** A fake media element with configurable seekable range + readyState. */
function fakeVideo({ seekable = [], currentTime = 0, readyState = 4 } = {}) {
  return {
    seekable: {
      length: seekable.length,
      start: (i) => seekable[i][0],
      end: (i) => seekable[i][1],
    },
    currentTime,
    readyState,
  };
}

describe('createWebDVRAdapter — getSeekableRange readiness guard', () => {
  it('returns null when there is no seekable range', () => {
    const adapter = createWebDVRAdapter({ current: fakeVideo({ seekable: [] }) });
    expect(adapter.getSeekableRange()).toBeNull();
  });

  it('returns null when the element ref is empty', () => {
    const adapter = createWebDVRAdapter({ current: null });
    expect(adapter.getSeekableRange()).toBeNull();
  });

  it('returns null while the media is not ready yet (readyState < HAVE_CURRENT_DATA)', () => {
    // seekable window already present (0..601) but the element has no real position yet.
    const adapter = createWebDVRAdapter({
      current: fakeVideo({ seekable: [[0, 601]], currentTime: 0, readyState: 0 }),
    });
    expect(adapter.getSeekableRange()).toBeNull();
  });

  it('returns the range once the media is ready (readyState >= HAVE_CURRENT_DATA)', () => {
    const adapter = createWebDVRAdapter({
      current: fakeVideo({ seekable: [[0, 601]], currentTime: 598, readyState: 4 }),
    });
    expect(adapter.getSeekableRange()).toEqual({ start: 0, end: 601 });
  });

  it('uses the last seekable range end when multiple ranges exist', () => {
    const adapter = createWebDVRAdapter({
      current: fakeVideo({ seekable: [[0, 50], [100, 700]], currentTime: 600, readyState: 4 }),
    });
    expect(adapter.getSeekableRange()).toEqual({ start: 0, end: 700 });
  });
});
