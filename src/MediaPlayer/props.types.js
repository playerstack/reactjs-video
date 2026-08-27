import PropTypes, { node } from 'prop-types';
import { en, es, defaultMediaConfig, DEFAULT_PROGRESS_INTERVAL } from '@playerstack/core';

const i18n = { en, es };
const { string, bool, number, array, oneOfType, shape, object, func } = PropTypes;

const availableLanguages = Object.keys(i18n);

/**
 * Common prop types for the video player.
 */
const commonPropTypes = {
  url: string,
  playing: bool,
  loop: bool,
  volume: number,
  muted: bool,
  playbackRate: number,
  width: oneOfType([string, number]),
  height: oneOfType([string, number]),
  progressInterval: number,
  playsinline: bool,
  language: PropTypes.oneOf(availableLanguages),
  stopOnUnmount: bool,
  fallback: node,
  waiting: bool,
  prevented: bool,
  /**
   * Recovery when the browser blocks autoplay-with-sound on first load:
   *   - 'muted' (default): mute + keep playing behind a "click to unmute" tip.
   *   - 'pause': stay paused + show the big play button; first click plays with sound.
   */
  autoplayFallback: PropTypes.oneOf(['muted', 'pause']),
  wrapper: oneOfType([string, func, shape({ render: func.isRequired })]),
  skinMode: PropTypes.oneOf(['auto', 'mobile', 'desktop']),
  config: shape({
    attributes: object,
    tracks: array,
    forceHLS: bool,
    forceSafariHLS: bool,
    forceDisableHls: bool,
    forceDASH: bool,
    forceFLV: bool,
    hlsOptions: object,
    hlsVersion: string,
    dashVersion: string,
    flvVersion: string,
  }),
  onReady: func,
  onStart: func,
  onPlay: func,
  onPause: func,
  onBuffer: func,
  onBufferEnd: func,
  onEnded: func,
  onError: func,
  onDuration: func,
  onSeek: func,
  onPlayBackRateChange: func,
  onProgress: func,
  onPrevious: func,
  onNext: func,
  showNavButtons: bool,
};

/**
 * Ads overlay configuration shape.
 */
const adsPropType = PropTypes.shape({
  /** Title displayed in the ad banner (left gadget) */
  title: string.isRequired,
  /** URL the ad links to when clicked */
  url: string.isRequired,
  /** Text for the call-to-action button */
  buttonText: string.isRequired,
  /** Optional icon/image URL for the ad banner */
  icon: string,
  /**
   * Seconds before the skip button appears.
   * If omitted or null, skip button never appears and timeline works normally.
   */
  skipAfter: number,
  /** Callback when user clicks skip */
  onSkip: func,
  /** Callback when user clicks the ad banner/button */
  onAdClick: func,
  /** Callback when ad video ends (plays through without skip) */
  onAdComplete: func,
});

/**
 * Props exclusive to video player type.
 */
const videoPropTypes = {
  sources: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      resolution: PropTypes.number.isRequired,
    }).isRequired,
  ),
  fullHDQualityBreak: PropTypes.number,
  spriteVTTFile: PropTypes.string,
  chapters: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      startTime: PropTypes.number.isRequired,
    }),
  ),
  captions: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      language: PropTypes.string.isRequired,
      kind: PropTypes.string,
    }),
  ),
  heatmapData: PropTypes.arrayOf(
    PropTypes.shape({
      startTime: PropTypes.number.isRequired,
      endTime: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired,
    }),
  ),
  /** Buffer visualization mode: 'fragmented' (default) shows all per-range segments; 'current' shows only the range at playback position (YouTube-style); 'classic' shows a single bar. */
  bufferMode: PropTypes.oneOf(['fragmented', 'current', 'classic']),
  /** Ads overlay configuration */
  ads: adsPropType,
  /** Media title (metadata only, not rendered as DOM attribute) */
  title: string,
  live: bool,
  liveDVR: bool,
  liveAd: object,
  poster: string,
  pip: bool,
  onPlayBackQualityChange: func,
  onEnablePIP: func,
  onDisablePIP: func,
};

export const propTypes = {
  ...commonPropTypes,
  ...videoPropTypes,
};

const noop = () => {};

export const defaultProps = {
  url: '',
  sources: [],
  chapters: [],
  captions: [],
  heatmapData: [],
  ads: null,
  title: '',
  playing: false,
  loop: false,
  live: false,
  liveDVR: false,
  liveAd: null,
  autoplayFallback: 'muted',
  volume: null,
  muted: false,
  playbackRate: 1,
  width: '640px',
  height: '360px',
  progressInterval: DEFAULT_PROGRESS_INTERVAL,
  playsinline: false,
  pip: false,
  stopOnUnmount: true,
  fallback: null,
  waiting: false,
  prevented: false,
  wrapper: 'div',
  skinMode: 'auto',
  language: availableLanguages[0],
  poster: '',
  config: {
    attributes: {},
    tracks: [],
    ...defaultMediaConfig,
  },
  onReady: noop,
  onStart: noop,
  onPlay: noop,
  onPause: noop,
  onBuffer: noop,
  onBufferEnd: noop,
  onEnded: noop,
  onError: noop,
  onDuration: noop,
  onSeek: noop,
  onPlayBackRateChange: noop,
  onPlayBackQualityChange: noop,
  onProgress: noop,
  onEnablePIP: noop,
  onDisablePIP: noop,
};
