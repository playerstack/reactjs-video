import { createRef } from 'react';
import { render, act } from '@testing-library/react';

import { domFrameworkAdapter } from '@playerstack/web-core/adapters/framework';
import { registerPlayerstackElements } from '@playerstack/web-core/ui';

import { createReactElement } from '@adapter/createReactElement';

// A synthetic binding exercising all three prop channels: an observed attribute
// (`aria-label`), request-event callbacks (`on*`), and rich property props
// (anything else, e.g. `config`).
const BINDING = {
  tagName: 'playerstack-play-button',
  attributes: ['aria-label'],
  requestEvents: ['playerstack-play-request', 'playerstack-pause-request'],
};

// Render the component and return its underlying custom element via a forwarded
// ref, so tests never reach into `container`/DOM nodes directly (keeps the repo's
// testing-library lint rules satisfied while still asserting on the element).
function renderElement(Component, props = {}, children = null) {
  const ref = createRef();
  const utils = render(
    <Component ref={ref} {...props}>
      {children}
    </Component>,
  );
  return { ...utils, el: ref.current, ref };
}

// Register the Core UI_Elements once so `document.createElement(tagName)` yields
// upgraded Custom Elements before any wrapper renders (Req 7.4).
beforeAll(() => {
  registerPlayerstackElements();
});

describe('createReactElement', () => {
  test('renders the custom element tag with its children', () => {
    const PlayButton = createReactElement(BINDING);
    const { el } = renderElement(PlayButton, {}, 'child');

    expect(el.tagName.toLowerCase()).toBe('playerstack-play-button');
    expect(el.textContent).toContain('child');
  });

  test('sets a stable displayName from the tag', () => {
    const PlayButton = createReactElement(BINDING);
    expect(PlayButton.displayName).toBe('Playerstack(playerstack-play-button)');
  });

  test('reflects a declared attribute prop to the element attribute after effects (Req 7.2)', () => {
    const PlayButton = createReactElement(BINDING);
    const { el } = renderElement(PlayButton, { 'aria-label': 'Play video' });

    expect(el.getAttribute('aria-label')).toBe('Play video');
  });

  test('removes a declared attribute when its value is null/undefined (Req 7.2)', () => {
    const PlayButton = createReactElement(BINDING);
    const ref = createRef();
    const { rerender } = render(<PlayButton ref={ref} aria-label="Play" />);
    expect(ref.current.getAttribute('aria-label')).toBe('Play');

    rerender(<PlayButton ref={ref} aria-label={undefined} />);
    expect(ref.current.hasAttribute('aria-label')).toBe(false);
  });

  test('assigns a rich/non-attribute, non-event prop as a JS property (Req 7.2)', () => {
    const PlayButton = createReactElement(BINDING);
    const config = { theme: 'dark', segments: [1, 2, 3] };
    const { el } = renderElement(PlayButton, { config });

    expect(el.config).toEqual(config);
  });

  test('invokes the on* callback when the request event fires (Req 7.3, 16.5)', () => {
    const PlayButton = createReactElement(BINDING);
    const onPlayRequest = jest.fn();
    const { el } = renderElement(PlayButton, { onPlayRequest });

    act(() => {
      el.dispatchEvent(new CustomEvent('playerstack-play-request', { detail: { at: 1 } }));
    });

    expect(onPlayRequest).toHaveBeenCalledTimes(1);
    expect(onPlayRequest.mock.calls[0][0].type).toBe('playerstack-play-request');
  });

  test('uses the LATEST callback after rerender without re-subscribing incorrectly (Req 16.4)', () => {
    const PlayButton = createReactElement(BINDING);
    const first = jest.fn();
    const second = jest.fn();
    const ref = createRef();
    const { rerender } = render(<PlayButton ref={ref} onPlayRequest={first} />);
    const el = ref.current;

    // Swap to a NEW callback identity; the subscription must not churn but must
    // read the latest callback from the ref.
    rerender(<PlayButton ref={ref} onPlayRequest={second} />);

    act(() => {
      el.dispatchEvent(new CustomEvent('playerstack-play-request'));
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('stops invoking the callback after unmount (cleanup, Req 16.5)', () => {
    const PlayButton = createReactElement(BINDING);
    const onPlayRequest = jest.fn();
    const ref = createRef();
    const { unmount } = render(<PlayButton ref={ref} onPlayRequest={onPlayRequest} />);
    const el = ref.current;

    unmount();

    act(() => {
      el.dispatchEvent(new CustomEvent('playerstack-play-request'));
    });

    expect(onPlayRequest).not.toHaveBeenCalled();
  });

  test('forwards the ref to the underlying element', () => {
    const PlayButton = createReactElement(BINDING);
    const { el } = renderElement(PlayButton);

    expect(el).not.toBeNull();
    expect(el.tagName.toLowerCase()).toBe('playerstack-play-button');
  });

  test('supports a callback ref', () => {
    const PlayButton = createReactElement(BINDING);
    let captured = null;
    render(<PlayButton ref={(node) => (captured = node)} />);

    expect(captured).not.toBeNull();
    expect(captured.tagName.toLowerCase()).toBe('playerstack-play-button');
  });

  test('does not re-run syncProperty for a deep-equal object prop across renders (Req 16.1, 7.5)', () => {
    const syncPropertySpy = jest.spyOn(domFrameworkAdapter, 'syncProperty');
    const PlayButton = createReactElement(BINDING);
    const ref = createRef();

    render(<PlayButton ref={ref} config={{ theme: 'dark', list: [1, 2] }} />);
    const initialCalls = syncPropertySpy.mock.calls.filter((call) => call[1] === 'config').length;
    expect(initialCalls).toBe(1);

    // New object reference, identical content -> the deep-compare memoize keeps
    // the same stable reference, so the property-sync effect must not re-run.
    render(<PlayButton ref={ref} config={{ theme: 'dark', list: [1, 2] }} />);

    const rerenderRef = createRef();
    const { rerender } = render(<PlayButton ref={rerenderRef} config={{ theme: 'dark', list: [9] }} />);
    const baseline = syncPropertySpy.mock.calls.filter((call) => call[1] === 'config').length;

    // Deep-equal rerender on the SAME instance: no additional config sync.
    rerender(<PlayButton ref={rerenderRef} config={{ theme: 'dark', list: [9] }} />);
    const afterEqual = syncPropertySpy.mock.calls.filter((call) => call[1] === 'config').length;
    expect(afterEqual).toBe(baseline);

    // A real content change re-runs the sync effect.
    rerender(<PlayButton ref={rerenderRef} config={{ theme: 'light', list: [9] }} />);
    const afterChange = syncPropertySpy.mock.calls.filter((call) => call[1] === 'config').length;
    expect(afterChange).toBe(baseline + 1);

    syncPropertySpy.mockRestore();
  });
});
