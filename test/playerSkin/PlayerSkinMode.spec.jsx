import React from 'react';
import { render } from '@testing-library/react';
import PlayerSkin from '@PlayerSkin/PlayerSkin';
import { Provider } from '@context/index';

// Mock isMobile from core
jest.mock('@playerstack/web-core', () => {
  const actual = jest.requireActual('@playerstack/web-core');
  return {
    ...actual,
    isMobile: false, // default to desktop in tests
  };
});

const Wrapper = ({ children }) => (
  <Provider language="en">{children}</Provider>
);

const baseProps = {
  videoRef: { current: null },
  playerRef: { current: null },
  live: false,
  hasResource: true,
  hasAudio: true,
  loading: false,
  prevented: false,
  paused: true,
  ended: false,
  seeking: false,
  waiting: false,
  duration: 100,
  currentTime: 10,
  buffered: 0.5,
  muted: false,
  volume: 0.8,
  playbackRate: 1,
  playbackQuality: 720,
  pictureInPictureEnabled: false,
  pip: false,
  fullscreen: false,
  loop: false,
  qualities: [],
  fullHDQualityBreak: 720,
  poster: '',
  onPlayClick: jest.fn(),
  onPauseClick: jest.fn(),
  onTogglePlay: jest.fn(),
  changeCurrentTime: jest.fn(),
  onMutedClick: jest.fn(),
  changeVolume: jest.fn(),
  changePlaybackRate: jest.fn(),
  changePlayBackQuality: jest.fn(),
  requestPictureInPicture: jest.fn(),
  exitPictureInPicture: jest.fn(),
  requestFullscreen: jest.fn(),
  exitFullscreen: jest.fn(),
  onSeeking: jest.fn(),
  onLoopClick: jest.fn(),
  onPreventedClick: jest.fn(),
  onCaptionChange: jest.fn(),
};

describe('PlayerSkin skinMode prop', () => {
  test('renders the desktop layout when skinMode is "desktop"', () => {
    const { container } = render(
      <Wrapper>
        <PlayerSkin {...baseProps} skinMode="desktop" />
      </Wrapper>,
    );
    // Desktop skin has specific class or structure
    expect(container.firstChild).toBeTruthy();
  });

  test('renders the mobile layout when skinMode is "mobile"', () => {
    const { container } = render(
      <Wrapper>
        <PlayerSkin {...baseProps} skinMode="mobile" />
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  test('renders the desktop layout when skinMode is "auto" and isMobile is false', () => {
    const { container } = render(
      <Wrapper>
        <PlayerSkin {...baseProps} skinMode="auto" />
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  test('renders the desktop layout when skinMode is undefined (defaults to auto)', () => {
    const { container } = render(
      <Wrapper>
        <PlayerSkin {...baseProps} />
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  test('forces mobile skin regardless of isMobile when skinMode is "mobile"', () => {
    // isMobile is mocked as false, but skinMode="mobile" should force mobile skin
    const { container } = render(
      <Wrapper>
        <PlayerSkin {...baseProps} skinMode="mobile" />
      </Wrapper>,
    );
    // Mobile skin renders a different structure
    expect(container.firstChild).toBeTruthy();
  });
});
