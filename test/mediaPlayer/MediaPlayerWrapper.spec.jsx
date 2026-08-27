import React from 'react';
import { render } from '@testing-library/react';
import MediaPlayerWrapper from '@MediaPlayer/components/MediaPlayerWrapper';

describe('MediaPlayerWrapper', () => {
  it('renders children', () => {
    const { getByText } = render(
      <MediaPlayerWrapper>
        <div>Player content</div>
      </MediaPlayerWrapper>,
    );
    expect(getByText('Player content')).toBeTruthy();
  });

  it('forwards ref to wrapper element', () => {
    const ref = React.createRef();
    render(
      <MediaPlayerWrapper ref={ref}>
        <span>Test</span>
      </MediaPlayerWrapper>,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current.tagName).toBe('DIV');
  });

  it('forwards function ref', () => {
    const refFn = jest.fn();
    render(
      <MediaPlayerWrapper ref={refFn}>
        <span>Test</span>
      </MediaPlayerWrapper>,
    );
    expect(refFn).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it('applies style prop', () => {
    const ref = React.createRef();
    render(
      <MediaPlayerWrapper ref={ref} style={{ width: '640px', height: '360px' }}>
        <span>Sized</span>
      </MediaPlayerWrapper>,
    );
    expect(ref.current.style.width).toBe('640px');
    expect(ref.current.style.height).toBe('360px');
  });

  it('passes extra props (tabIndex, role, dir)', () => {
    const { container } = render(
      <MediaPlayerWrapper tabIndex={0} role="application" dir="ltr">
        <span>Props</span>
      </MediaPlayerWrapper>,
    );
    const wrapper = container.firstChild;
    expect(wrapper.getAttribute('tabindex')).toBe('0');
    expect(wrapper.getAttribute('role')).toBe('application');
    expect(wrapper.getAttribute('dir')).toBe('ltr');
  });

  it('has scoped reset styles (box-sizing on children)', () => {
    const { container } = render(
      <MediaPlayerWrapper>
        <button>Click</button>
      </MediaPlayerWrapper>,
    );
    // Wrapper renders styled div with class
    expect(container.firstChild.className).toBeTruthy();
    // Button rendered inside
    expect(container.querySelector('button')).toBeTruthy();
  });

  it('renders with null ref without crashing', () => {
    const { getByText } = render(
      <MediaPlayerWrapper ref={null}>
        <span>No ref</span>
      </MediaPlayerWrapper>,
    );
    expect(getByText('No ref')).toBeTruthy();
  });
});
