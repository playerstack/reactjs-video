import React from 'react';
import { render } from '@testing-library/react';
import useSkinImperativeHandle from '@PlayerSkin/hooks/useSkinImperativeHandle';

// `useSkinImperativeHandle` calls `useImperativeHandle(ref, ...)`, so it only
// populates a ref when hosted inside a component that receives one. This harness
// forwards the ref through so tests can inspect its `.current` handle.
const Harness = React.forwardRef(({ triggerAdRef }, ref) => {
  useSkinImperativeHandle(ref, { triggerAdRef });
  return null;
});
Harness.displayName = 'Harness';

// Mount the harness with a caller-owned ref so the imperative handle is
// populated onto `handleRef.current`. The ref is created by the caller (not
// derived from the `render` result) so tests read a plain handle object.
const mountHandle = (handleRef, triggerAdRef) => {
  render(<Harness ref={handleRef} triggerAdRef={triggerAdRef} />);
};

describe('useSkinImperativeHandle', () => {
  test('exposes showControls and hideControls as no-ops', () => {
    const triggerAdRef = { current: jest.fn() };
    const handleRef = React.createRef();
    mountHandle(handleRef, triggerAdRef);

    expect(typeof handleRef.current.showControls).toBe('function');
    expect(typeof handleRef.current.hideControls).toBe('function');
    // No-ops: calling them does nothing, returns undefined, never throws.
    expect(handleRef.current.showControls()).toBeUndefined();
    expect(handleRef.current.hideControls()).toBeUndefined();
    expect(triggerAdRef.current).not.toHaveBeenCalled();
  });

  test('triggerAd delegates to triggerAdRef.current with the passed config', () => {
    const triggerAdRef = { current: jest.fn() };
    const handleRef = React.createRef();
    mountHandle(handleRef, triggerAdRef);
    const config = { id: 'break-1', duration: 30 };

    handleRef.current.triggerAd(config);

    expect(triggerAdRef.current).toHaveBeenCalledTimes(1);
    expect(triggerAdRef.current).toHaveBeenCalledWith(config);
  });

  test('triggerAd reads the latest triggerAdRef.current at call time', () => {
    const triggerAdRef = { current: jest.fn() };
    const handleRef = React.createRef();
    mountHandle(handleRef, triggerAdRef);
    const latest = jest.fn();
    triggerAdRef.current = latest;
    const config = { id: 'break-2' };

    handleRef.current.triggerAd(config);

    expect(latest).toHaveBeenCalledTimes(1);
    expect(latest).toHaveBeenCalledWith(config);
  });

  test('triggerAd optional-chains safely when triggerAdRef.current is null', () => {
    const triggerAdRef = { current: null };
    const handleRef = React.createRef();
    mountHandle(handleRef, triggerAdRef);

    expect(() => handleRef.current.triggerAd({ id: 'noop' })).not.toThrow();
  });
});
