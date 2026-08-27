import { renderHook } from '@testing-library/react';
import useSkinRequestHandlers from '@PlayerSkin/hooks/useSkinRequestHandlers';

// Builds a full set of jest.fn() callbacks so each test can assert exact delegation.
const makeParams = (overrides = {}) => ({
  onPlayClick: jest.fn(),
  onPauseClick: jest.fn(),
  changeCurrentTime: jest.fn(),
  liveDVR: false,
  hasDVR: false,
  pinAndSeek: jest.fn(),
  changeVolume: jest.fn(),
  onMutedClick: jest.fn(),
  changePlaybackRate: jest.fn(),
  changePlayBackQuality: jest.fn(),
  requestFullscreen: jest.fn(),
  exitFullscreen: jest.fn(),
  requestPictureInPicture: jest.fn(),
  exitPictureInPicture: jest.fn(),
  onLoopClick: jest.fn(),
  onPrevious: jest.fn(),
  onNext: jest.fn(),
  onCaptionChange: jest.fn(),
  updateCaptionStyle: jest.fn(),
  ads: { onSkip: jest.fn() },
  seekToLiveEdge: jest.fn(),
  promptCast: jest.fn(),
  ...overrides,
});

const render = (params) => renderHook((p) => useSkinRequestHandlers(p), { initialProps: params });

describe('useSkinRequestHandlers', () => {
  describe('no-arg pass-through handlers', () => {
    test('handlePlayRequest delegates to onPlayClick', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handlePlayRequest();
      expect(params.onPlayClick).toHaveBeenCalledTimes(1);
    });

    test('handlePauseRequest delegates to onPauseClick', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handlePauseRequest();
      expect(params.onPauseClick).toHaveBeenCalledTimes(1);
    });

    test('handleMuteRequest and handleUnmuteRequest both delegate to onMutedClick', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleMuteRequest();
      result.current.handleUnmuteRequest();
      expect(params.onMutedClick).toHaveBeenCalledTimes(2);
    });

    test('handleEnterFullscreenRequest delegates to requestFullscreen', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleEnterFullscreenRequest();
      expect(params.requestFullscreen).toHaveBeenCalledTimes(1);
    });

    test('handleExitFullscreenRequest delegates to exitFullscreen', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleExitFullscreenRequest();
      expect(params.exitFullscreen).toHaveBeenCalledTimes(1);
    });

    test('handleEnterPipRequest delegates to requestPictureInPicture', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleEnterPipRequest();
      expect(params.requestPictureInPicture).toHaveBeenCalledTimes(1);
    });

    test('handleExitPipRequest delegates to exitPictureInPicture', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleExitPipRequest();
      expect(params.exitPictureInPicture).toHaveBeenCalledTimes(1);
    });

    test('handleLoopRequest delegates to onLoopClick', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleLoopRequest();
      expect(params.onLoopClick).toHaveBeenCalledTimes(1);
    });

    test('handlePrevRequest delegates to onPrevious', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handlePrevRequest();
      expect(params.onPrevious).toHaveBeenCalledTimes(1);
    });

    test('handleNextRequest delegates to onNext', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleNextRequest();
      expect(params.onNext).toHaveBeenCalledTimes(1);
    });

    test('no-arg handlers optional-chain safely when callbacks are undefined', () => {
      const params = makeParams({
        onPlayClick: undefined,
        onPauseClick: undefined,
        onMutedClick: undefined,
        requestFullscreen: undefined,
        exitFullscreen: undefined,
        requestPictureInPicture: undefined,
        exitPictureInPicture: undefined,
        onLoopClick: undefined,
        onPrevious: undefined,
        onNext: undefined,
      });
      const { result } = render(params);
      expect(() => {
        result.current.handlePlayRequest();
        result.current.handlePauseRequest();
        result.current.handleMuteRequest();
        result.current.handleUnmuteRequest();
        result.current.handleEnterFullscreenRequest();
        result.current.handleExitFullscreenRequest();
        result.current.handleEnterPipRequest();
        result.current.handleExitPipRequest();
        result.current.handleLoopRequest();
        result.current.handlePrevRequest();
        result.current.handleNextRequest();
      }).not.toThrow();
    });
  });

  describe('handleSeekRequest — DVR-aware routing', () => {
    test('routes to changeCurrentTime when NOT (liveDVR && hasDVR)', () => {
      const params = makeParams({ liveDVR: false, hasDVR: false });
      const { result } = render(params);
      result.current.handleSeekRequest({ detail: { time: 42 } });
      expect(params.changeCurrentTime).toHaveBeenCalledWith(42);
      expect(params.pinAndSeek).not.toHaveBeenCalled();
    });

    test('routes to changeCurrentTime when liveDVR is true but hasDVR is false', () => {
      const params = makeParams({ liveDVR: true, hasDVR: false });
      const { result } = render(params);
      result.current.handleSeekRequest({ detail: { time: 10 } });
      expect(params.changeCurrentTime).toHaveBeenCalledWith(10);
      expect(params.pinAndSeek).not.toHaveBeenCalled();
    });

    test('routes to pinAndSeek when liveDVR && hasDVR', () => {
      const params = makeParams({ liveDVR: true, hasDVR: true });
      const { result } = render(params);
      result.current.handleSeekRequest({ detail: { time: 7 } });
      expect(params.pinAndSeek).toHaveBeenCalledWith(7);
      expect(params.changeCurrentTime).not.toHaveBeenCalled();
    });

    test('ignores request when detail.time is not a number', () => {
      const params = makeParams({ liveDVR: true, hasDVR: true });
      const { result } = render(params);
      result.current.handleSeekRequest({ detail: { time: 'abc' } });
      result.current.handleSeekRequest({ detail: {} });
      result.current.handleSeekRequest(undefined);
      expect(params.pinAndSeek).not.toHaveBeenCalled();
      expect(params.changeCurrentTime).not.toHaveBeenCalled();
    });

    test('optional-chains changeCurrentTime when undefined', () => {
      const params = makeParams({ changeCurrentTime: undefined });
      const { result } = render(params);
      expect(() => result.current.handleSeekRequest({ detail: { time: 3 } })).not.toThrow();
    });
  });

  describe('handleVolumeRequest', () => {
    test('forwards detail.volume to changeVolume', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleVolumeRequest({ detail: { volume: 0.5 } });
      expect(params.changeVolume).toHaveBeenCalledWith(0.5);
    });

    test('ignores non-numeric volume', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleVolumeRequest({ detail: { volume: 'loud' } });
      result.current.handleVolumeRequest(undefined);
      expect(params.changeVolume).not.toHaveBeenCalled();
    });

    test('optional-chains changeVolume when undefined', () => {
      const params = makeParams({ changeVolume: undefined });
      const { result } = render(params);
      expect(() => result.current.handleVolumeRequest({ detail: { volume: 0.2 } })).not.toThrow();
    });
  });

  describe('handleRateRequest', () => {
    test('forwards detail.rate to changePlaybackRate', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleRateRequest({ detail: { rate: 1.5 } });
      expect(params.changePlaybackRate).toHaveBeenCalledWith(1.5);
    });

    test('ignores non-numeric rate', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleRateRequest({ detail: { rate: 'fast' } });
      result.current.handleRateRequest(undefined);
      expect(params.changePlaybackRate).not.toHaveBeenCalled();
    });

    test('optional-chains changePlaybackRate when undefined', () => {
      const params = makeParams({ changePlaybackRate: undefined });
      const { result } = render(params);
      expect(() => result.current.handleRateRequest({ detail: { rate: 2 } })).not.toThrow();
    });
  });

  describe('handleQualityRequest', () => {
    test('forwards parsed numeric value to changePlayBackQuality', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleQualityRequest({ detail: { value: '1080' } });
      expect(params.changePlayBackQuality).toHaveBeenCalledWith(1080);
    });

    test('falls back to 0 when value is not parseable', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleQualityRequest({ detail: { value: 'auto' } });
      expect(params.changePlayBackQuality).toHaveBeenCalledWith(0);
    });

    test('optional-chains changePlayBackQuality when undefined', () => {
      const params = makeParams({ changePlayBackQuality: undefined });
      const { result } = render(params);
      expect(() => result.current.handleQualityRequest({ detail: { value: '720' } })).not.toThrow();
    });
  });

  describe('handleCaptionRequest', () => {
    test('forwards detail.value to onCaptionChange', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleCaptionRequest({ detail: { value: 'es' } });
      expect(params.onCaptionChange).toHaveBeenCalledWith('es');
    });

    test('forwards a null value (turn captions off) since it is not undefined', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleCaptionRequest({ detail: { value: null } });
      expect(params.onCaptionChange).toHaveBeenCalledWith(null);
    });

    test('ignores request when value is undefined', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleCaptionRequest({ detail: {} });
      result.current.handleCaptionRequest(undefined);
      expect(params.onCaptionChange).not.toHaveBeenCalled();
    });

    test('optional-chains onCaptionChange when undefined', () => {
      const params = makeParams({ onCaptionChange: undefined });
      const { result } = render(params);
      expect(() => result.current.handleCaptionRequest({ detail: { value: 'en' } })).not.toThrow();
    });
  });

  describe('handleCaptionStyleRequest', () => {
    test('forwards detail.style to updateCaptionStyle', () => {
      const params = makeParams();
      const style = { fontSize: 24, color: '#fff' };
      const { result } = render(params);
      result.current.handleCaptionStyleRequest({ detail: { style } });
      expect(params.updateCaptionStyle).toHaveBeenCalledWith(style);
    });

    test('ignores request when style is falsy', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleCaptionStyleRequest({ detail: { style: null } });
      result.current.handleCaptionStyleRequest(undefined);
      expect(params.updateCaptionStyle).not.toHaveBeenCalled();
    });
  });

  describe('handleAdSkip', () => {
    test('delegates to ads.onSkip', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleAdSkip();
      expect(params.ads.onSkip).toHaveBeenCalledTimes(1);
    });

    test('optional-chains safely when ads is null', () => {
      const params = makeParams({ ads: null });
      const { result } = render(params);
      expect(() => result.current.handleAdSkip()).not.toThrow();
    });

    test('optional-chains safely when ads.onSkip is undefined', () => {
      const params = makeParams({ ads: {} });
      const { result } = render(params);
      expect(() => result.current.handleAdSkip()).not.toThrow();
    });
  });

  describe('handleLiveEdgeRequest', () => {
    test('delegates to seekToLiveEdge', () => {
      const params = makeParams();
      const { result } = render(params);
      result.current.handleLiveEdgeRequest();
      expect(params.seekToLiveEdge).toHaveBeenCalledTimes(1);
    });

    test('optional-chains safely when seekToLiveEdge is undefined', () => {
      const params = makeParams({ seekToLiveEdge: undefined });
      const { result } = render(params);
      expect(() => result.current.handleLiveEdgeRequest()).not.toThrow();
    });
  });

  describe('handleCastClick', () => {
    test('stops event propagation and prompts cast', () => {
      const params = makeParams();
      const { result } = render(params);
      const event = { stopPropagation: jest.fn() };
      result.current.handleCastClick(event);
      expect(event.stopPropagation).toHaveBeenCalledTimes(1);
      expect(params.promptCast).toHaveBeenCalledTimes(1);
    });
  });
});
