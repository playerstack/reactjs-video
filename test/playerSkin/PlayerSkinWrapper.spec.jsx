import React from 'react';
import { render } from '@testing-library/react';
import PlayerSkinWrapper from '@PlayerSkin/index';

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
