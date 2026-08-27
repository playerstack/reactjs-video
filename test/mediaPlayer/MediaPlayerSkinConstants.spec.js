import { playerStateInitial } from '@playerstack/web-core';

describe('playerStateInitial', () => {
  test('has expected default shape', () => {
    expect(playerStateInitial).toMatchObject({
      kernelError: null,
      seeking: false,
      seek: 0,
      played: 0,
      loaded: 0,
      duration: 0,
      isFullScreen: false,
      isEnded: false,
      isPIP: false,
      isLoading: true,
      volume: 0.8,
      playbackRate: 1,
      playbackQuality: null,
      videoUrl: null,
      hasAudio: true,
      loop: false,
      playing: false,
      isMuted: false,
    });
  });

  test('volume default is 0.8', () => {
    expect(playerStateInitial.volume).toBe(0.8);
  });

  test('playbackRate default is 1', () => {
    expect(playerStateInitial.playbackRate).toBe(1);
  });

  test('isLoading default is true', () => {
    expect(playerStateInitial.isLoading).toBe(true);
  });

  test('playing default is false', () => {
    expect(playerStateInitial.playing).toBe(false);
  });
});
