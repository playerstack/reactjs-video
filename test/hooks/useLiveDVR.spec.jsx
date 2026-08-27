import React from 'react';
import { render, act } from '@testing-library/react';

import { useLiveDVR } from '@hooks/useLiveDVR';

/**
 * Spec for `useLiveDVR`: derives DVR window state from a `DVRAdapter` and exposes seek actions.
 * A fake adapter drives the seekable range / current time so the hook's derived state
 * (hasDVR, at-edge, window position/duration) and seek mapping can be asserted deterministically.
 */
function makeAdapter({ start = 0, end = 100, current = 100 } = {}) {
  const listeners = new Set();
  return {
    range: { start, end },
    current,
    seeks: [],
    getSeekableRange() {
      return this.range;
    },
    getCurrentTime() {
      return this.current;
    },
    seekTo(t) {
      this.seeks.push(t);
    },
    onTimeUpdate(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    emit() {
      listeners.forEach((cb) => cb());
    },
  };
}

function renderDVR({ adapter, liveDVR = true }) {
  const results = { current: null };
  function Probe() {
    results.current = useLiveDVR({ adapter, liveDVR, playing: true });
    return null;
  }
  render(<Probe />);
  return results;
}

describe('useLiveDVR', () => {
  it('returns no DVR when liveDVR is off', () => {
    const adapter = makeAdapter();
    const results = renderDVR({ adapter, liveDVR: false });
    expect(results.current.dvrState).toBeNull();
    expect(results.current.isAtLiveEdge).toBe(true);
  });

  it('reports a usable DVR window and the at-edge state', () => {
    const adapter = makeAdapter({ start: 0, end: 100, current: 100 });
    const results = renderDVR({ adapter });
    expect(results.current.dvrState.hasDVR).toBe(true);
    expect(results.current.dvrState.sliderDuration).toBe(100);
    // At the end -> at live edge.
    expect(results.current.isAtLiveEdge).toBe(true);
  });

  it('detects being behind live and computes the window position', () => {
    const adapter = makeAdapter({ start: 0, end: 100, current: 40 });
    const results = renderDVR({ adapter });
    expect(results.current.dvrState.hasDVR).toBe(true);
    expect(results.current.dvrState.sliderPosition).toBe(40);
    expect(results.current.isAtLiveEdge).toBe(false);
    expect(results.current.liveOffset).not.toBe('');
  });

  it('treats a too-small window as no DVR', () => {
    const adapter = makeAdapter({ start: 0, end: 5, current: 5 });
    const results = renderDVR({ adapter });
    expect(results.current.dvrState.hasDVR).toBe(false);
  });

  it('seekToLive seeks a live-latency margin behind the end (avoids ended, stays at edge)', () => {
    const adapter = makeAdapter({ start: 0, end: 100, current: 30 });
    const results = renderDVR({ adapter });
    act(() => results.current.seekToLive());
    // Lands at end - LIVE_EDGE_SEEK_MARGIN (100 - 3 = 97), not end-1, so the advancing live
    // window keeps the position comfortably at the edge instead of drifting behind.
    expect(adapter.seeks[adapter.seeks.length - 1]).toBe(97);
  });

  it('seekToDVRPosition maps a window position to an absolute time capped before the edge', () => {
    const adapter = makeAdapter({ start: 10, end: 110, current: 60 });
    const results = renderDVR({ adapter });
    act(() => results.current.seekToDVRPosition(50));
    // seekableStart(10) + 50 = 60, below the go-live cap (end-3 = 107) -> exact.
    expect(adapter.seeks[adapter.seeks.length - 1]).toBe(60);
    act(() => results.current.seekToDVRPosition(100));
    // 10 + 100 = 110 -> capped at the go-live target end - 3 = 107.
    expect(adapter.seeks[adapter.seeks.length - 1]).toBe(107);
  });

  it('recomputes state on adapter time updates', () => {
    const adapter = makeAdapter({ start: 0, end: 100, current: 100 });
    const results = renderDVR({ adapter });
    expect(results.current.isAtLiveEdge).toBe(true);
    act(() => {
      adapter.current = 20;
      adapter.emit();
    });
    expect(results.current.isAtLiveEdge).toBe(false);
    expect(results.current.dvrState.sliderPosition).toBe(20);
  });
});
