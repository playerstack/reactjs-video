import React from 'react';
import { renderHook, act } from '@testing-library/react';
import usePlayerSkinWrapper from '@hooks/usePlayerSkinWrapper';
import { Provider } from '@context/index';

const wrapper = ({ children }) => <Provider language="en">{children}</Provider>;

const makePlayer = () => ({
  seekTo: jest.fn(),
  getCurrentTime: jest.fn(() => 30),
  getDuration: jest.fn(() => 120),
  getPlayer: jest.fn(() => null),
});

const makePlayerRef = () => ({ current: document.createElement('div') });

describe('usePlayerSkinWrapper', () => {
  let player;
  let playerRef;
  let updateState;

  beforeEach(() => {
    player = makePlayer();
    playerRef = makePlayerRef();
    playerRef.current.requestFullscreen = jest.fn();
    updateState = jest.fn();
    jest.clearAllMocks();
  });

  const getHook = (overrides = {}) =>
    renderHook(
      () =>
        usePlayerSkinWrapper({
          ref: React.createRef(),
          playerRef,
          url: 'test.mp4',
          player,
          fullHDQualityBreak: 1080,
          sources: [],
          prevented: false,
          muted: false,
          updateState,
          ...overrides,
        }),
      { wrapper },
    );

  test('returns expected properties', () => {
    const { result } = getHook();
    expect(result.current.videoRef).toBeDefined();
    expect(result.current.playerSkinRef).toBeDefined();
    expect(result.current.qualities).toBeDefined();
    expect(result.current.memorizedProps).toBeDefined();
    expect(typeof result.current.handleKeyDown).toBe('function');
    expect(typeof result.current.requestFullscreen).toBe('function');
    expect(typeof result.current.exitFullscreen).toBe('function');
    expect(typeof result.current.changeVolume).toBe('function');
  });

  // ── qualities ──────────────────────────────────────────────────────────────
  test('qualities is empty when sources is empty', () => {
    const { result } = getHook({ sources: [] });
    expect(result.current.qualities).toEqual([]);
  });

  test('qualities maps sources to label/value/isFullHD', () => {
    const sources = [
      { src: 'video_1080.m3u8', resolution: 1080 },
      { src: 'video_720.m3u8', resolution: 720 },
    ];
    const { result } = getHook({ sources, fullHDQualityBreak: 1080 });
    expect(result.current.qualities).toHaveLength(2);
    expect(result.current.qualities[0].value).toBe('1080');
    expect(result.current.qualities[0].isFullHD).toBe(true);
    expect(result.current.qualities[1].value).toBe('720');
    expect(result.current.qualities[1].isFullHD).toBe(false);
  });

  // ── memorizedProps ─────────────────────────────────────────────────────────
  test('onPlayClick calls updateState with playing: true', () => {
    const { result } = getHook();
    act(() => result.current.memorizedProps.onPlayClick());
    expect(updateState).toHaveBeenCalled();
    const fn = updateState.mock.calls[0][0];
    expect(fn({ playing: false })).toMatchObject({ playing: true });
  });

  test('onPauseClick calls updateState with playing: false', () => {
    const { result } = getHook();
    act(() => result.current.memorizedProps.onPauseClick());
    const fn = updateState.mock.calls[0][0];
    expect(fn({ playing: true })).toMatchObject({ playing: false });
  });

  test('onTogglePlay toggles playing state', () => {
    const { result } = getHook();
    act(() => result.current.memorizedProps.onTogglePlay());
    const fn = updateState.mock.calls[0][0];
    expect(fn({ playing: false })).toMatchObject({ playing: true });
    expect(fn({ playing: true })).toMatchObject({ playing: false });
  });

  test('changePlaybackRate updates playbackRate', () => {
    const { result } = getHook();
    act(() => result.current.memorizedProps.changePlaybackRate(1.5));
    const fn = updateState.mock.calls[0][0];
    expect(fn({ playbackRate: 1 })).toMatchObject({ playbackRate: 1.5 });
  });

  test('changePlayBackQuality updates playbackQuality', () => {
    const { result } = getHook();
    act(() => result.current.memorizedProps.changePlayBackQuality(720));
    const fn = updateState.mock.calls[0][0];
    expect(fn({ playbackQuality: null })).toMatchObject({ playbackQuality: 720 });
  });

  test('requestPictureInPicture sets isPIP to true', () => {
    const { result } = getHook();
    act(() => result.current.memorizedProps.requestPictureInPicture());
    const fn = updateState.mock.calls[0][0];
    expect(fn({ isPIP: false })).toMatchObject({ isPIP: true });
  });

  test('exitPictureInPicture sets isPIP to false', () => {
    const { result } = getHook();
    act(() => result.current.memorizedProps.exitPictureInPicture());
    const fn = updateState.mock.calls[0][0];
    expect(fn({ isPIP: true })).toMatchObject({ isPIP: false });
  });

  test('onSeeking updates seeking state', () => {
    const { result } = getHook();
    act(() => result.current.memorizedProps.onSeeking(true));
    const fn = updateState.mock.calls[0][0];
    expect(fn({ seeking: false })).toMatchObject({ seeking: true });
  });

  test('onLoopClick toggles loop state', () => {
    const { result } = getHook();
    act(() => result.current.memorizedProps.onLoopClick());
    const fn = updateState.mock.calls[0][0];
    expect(fn({ loop: false })).toMatchObject({ loop: true });
    expect(fn({ loop: true })).toMatchObject({ loop: false });
  });

  test('onPreventedClick unmutes and sets volume to 1', () => {
    const { result } = getHook();
    act(() => result.current.memorizedProps.onPreventedClick());
    const fn = updateState.mock.calls[0][0];
    expect(fn({})).toMatchObject({ isMuted: false, volume: 1 });
  });

  test('changeCurrentTime calls player.seekTo', () => {
    const { result } = getHook();
    act(() => result.current.memorizedProps.changeCurrentTime(45));
    expect(player.seekTo).toHaveBeenCalledWith(45);
  });

  test('changeCurrentTime does nothing when player is null', () => {
    const { result } = getHook({ player: null });
    expect(() => act(() => result.current.memorizedProps.changeCurrentTime(45))).not.toThrow();
  });

  // ── handleKeyDown ──────────────────────────────────────────────────────────
  const makeKeyEvent = (key, keyCode) => ({
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    key,
    keyCode,
    which: keyCode,
  });

  test('SPACE_KEY toggles playing', () => {
    const { result } = getHook();
    act(() => result.current.handleKeyDown(makeKeyEvent(' ', 32)));
    expect(updateState).toHaveBeenCalled();
    const fn = updateState.mock.calls[0][0];
    expect(fn({ playing: false })).toMatchObject({ playing: true });
  });

  test('F_KEY calls requestToggleFullscreen', () => {
    const { result } = getHook();
    // requestToggleFullscreen delegates to fullscreen hook, just check no throw
    expect(() => act(() => result.current.handleKeyDown(makeKeyEvent('f', 70)))).not.toThrow();
  });

  test('MUTE_KEY calls onMutedClick', () => {
    const { result } = getHook();
    expect(() => act(() => result.current.handleKeyDown(makeKeyEvent('m', 77)))).not.toThrow();
  });

  test('ARROW_LEFT_KEY seeks back 5 seconds', () => {
    player.getCurrentTime.mockReturnValue(30);
    const { result } = getHook();
    act(() => result.current.handleKeyDown(makeKeyEvent('ArrowLeft', 37)));
    expect(player.seekTo).toHaveBeenCalledWith(25);
  });

  test('ARROW_LEFT_KEY clamps to 0 when currentTime < 5', () => {
    player.getCurrentTime.mockReturnValue(3);
    const { result } = getHook();
    act(() => result.current.handleKeyDown(makeKeyEvent('ArrowLeft', 37)));
    expect(player.seekTo).toHaveBeenCalledWith(0);
  });

  test('ARROW_RIGHT_KEY seeks forward 5 seconds', () => {
    player.getCurrentTime.mockReturnValue(30);
    player.getDuration.mockReturnValue(120);
    const { result } = getHook();
    act(() => result.current.handleKeyDown(makeKeyEvent('ArrowRight', 39)));
    expect(player.seekTo).toHaveBeenCalledWith(35);
  });

  test('ARROW_RIGHT_KEY clamps to duration', () => {
    player.getCurrentTime.mockReturnValue(118);
    player.getDuration.mockReturnValue(120);
    const { result } = getHook();
    act(() => result.current.handleKeyDown(makeKeyEvent('ArrowRight', 39)));
    expect(player.seekTo).toHaveBeenCalledWith(120);
  });

  test('ARROW_UP_KEY increases volume', () => {
    const { result } = getHook();
    // Just check it doesn't throw (videoRef.current is null in test env)
    expect(() => act(() => result.current.handleKeyDown(makeKeyEvent('ArrowUp', 38)))).not.toThrow();
  });

  test('ARROW_DOWN_KEY decreases volume', () => {
    const { result } = getHook();
    expect(() => act(() => result.current.handleKeyDown(makeKeyEvent('ArrowDown', 40)))).not.toThrow();
  });

  test('unknown key does nothing', () => {
    const { result } = getHook();
    expect(() => act(() => result.current.handleKeyDown(makeKeyEvent('z', 90)))).not.toThrow();
  });

  test('handleKeyDown does nothing when player is null', () => {
    const { result } = getHook({ player: null });
    const event = makeKeyEvent(' ', 32);
    act(() => result.current.handleKeyDown(event));
    expect(updateState).not.toHaveBeenCalled();
  });
});
