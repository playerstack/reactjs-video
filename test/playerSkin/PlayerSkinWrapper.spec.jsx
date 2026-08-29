import React from 'react';
import { render as rtlRender } from '@testing-library/react';

import { DEFAULT_COMPOSITION } from '@playerstack/web-core/adapters/framework';

import PlayerSkinWrapper from '@PlayerSkin/index';
import { CompositionContext } from '@compound/context/CompositionContext';

// Task 8.1 made CorePlayerSkin (rendered through PlayerSkinWrapper) read the composition manifest
// via `useComposition()`, which requires a CompositionContext ancestor. These smoke tests only
// assert the tree renders, so a default-composition manifest (the full DEFAULT_COMPOSITION control
// set) is provided through a wrapper applied to every `render` call (RTL re-applies it on rerender).
const manifest = { mode: 'default', parts: new Set(DEFAULT_COMPOSITION), config: {}, order: [] };

const CompositionWrapper = ({ children }) => (
  <CompositionContext.Provider value={{ manifest }}>{children}</CompositionContext.Provider>
);

const render = (ui, options) => rtlRender(ui, { wrapper: CompositionWrapper, ...options });

const baseProps = {
  playerRef: { current: document.createElement('div') },
  player: null,
  url: 'test.mp4',
  sources: [],
  hasAudio: true,
  live: false,
  language: 'en',
  hasResource: true,
  loading: false,
  prevented: false,
  paused: true,
  ended: false,
  seeking: false,
  waiting: false,
  duration: 120,
  buffered: 0.5,
  currentTime: 30,
  muted: false,
  volume: 0.8,
  playbackRate: 1,
  pictureInPictureEnabled: true,
  pip: false,
  fullscreen: false,
  loop: false,
  poster: '',
  kernelMsg: null,
  updateState: jest.fn(),
};

describe('PlayerSkinWrapper', () => {
  test('renders without crashing', () => {
    const { container } = render(<PlayerSkinWrapper {...baseProps} />);
    expect(container.firstChild).not.toBeNull();
  });

  test('renders with live mode', () => {
    const { container } = render(<PlayerSkinWrapper {...baseProps} live={true} />);
    expect(container.firstChild).not.toBeNull();
  });

  test('renders with spanish language', () => {
    const { container } = render(<PlayerSkinWrapper {...baseProps} language="es" />);
    expect(container.firstChild).not.toBeNull();
  });

  test('renders when loading', () => {
    const { container } = render(<PlayerSkinWrapper {...baseProps} loading={true} />);
    expect(container.firstChild).not.toBeNull();
  });

  test('renders when muted', () => {
    const { container } = render(<PlayerSkinWrapper {...baseProps} muted={true} />);
    expect(container.firstChild).not.toBeNull();
  });

  test('renders when ended', () => {
    const { container } = render(<PlayerSkinWrapper {...baseProps} ended={true} />);
    expect(container.firstChild).not.toBeNull();
  });

  test('renders with poster', () => {
    const { container } = render(<PlayerSkinWrapper {...baseProps} poster="poster.jpg" />);
    expect(container.firstChild).not.toBeNull();
  });
});
