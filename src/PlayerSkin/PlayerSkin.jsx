import React from 'react';
import PropTypes from 'prop-types';

import CorePlayerSkin from '@PlayerSkin/CorePlayerSkin';

// The reactjs player UI is now rendered by composing Core's `playerstack-*` UI_Elements
// through the React_Adapter (tasks 14.3/14.7). `CorePlayerSkin` handles both the desktop
// (Table 21-A) and mobile (Table 21-B) layouts plus the Commons overlays (Table 21-C),
// selecting the layout from `skinMode`/`isMobile` internally. Styling arrives via Core's
// Style_Auto_Injection — the consumer imports no CSS. The former styled-components
// Desktop/Mobile skins and their CSS-in-JS were removed in task 14.4 (CSS ported to Core
// in task 14.6).
const PlayerSkin = React.forwardRef((props, ref) => {
  return <CorePlayerSkin ref={ref} {...props} />;
});

PlayerSkin.displayName = 'PlayerSkin';

PlayerSkin.propTypes = {
  spriteVTTFile: PropTypes.string,
  chapters: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      startTime: PropTypes.number.isRequired,
    }),
  ),
  heatmapData: PropTypes.arrayOf(
    PropTypes.shape({
      startTime: PropTypes.number.isRequired,
      endTime: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired,
    }),
  ),
  bufferMode: PropTypes.oneOf(['fragmented', 'current', 'classic']),
  videoRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.instanceOf(HTMLVideoElement) })])
    .isRequired,
  playerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.instanceOf(HTMLDivElement) })])
    .isRequired,
  prevented: PropTypes.bool,
  waiting: PropTypes.bool,
  live: PropTypes.bool.isRequired,
  hasResource: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  paused: PropTypes.bool.isRequired,
  ended: PropTypes.bool.isRequired,
  seeking: PropTypes.bool.isRequired,
  onPlayClick: PropTypes.func.isRequired,
  onPauseClick: PropTypes.func.isRequired,
  duration: PropTypes.number.isRequired,
  currentTime: PropTypes.number.isRequired,
  changeCurrentTime: PropTypes.func.isRequired,
  muted: PropTypes.bool.isRequired,
  volume: PropTypes.number.isRequired,
  changeVolume: PropTypes.func.isRequired,
  onMutedClick: PropTypes.func.isRequired,
  changePlaybackRate: PropTypes.func.isRequired,
  pictureInPictureEnabled: PropTypes.bool.isRequired,
  pip: PropTypes.bool.isRequired,
  requestPictureInPicture: PropTypes.func.isRequired,
  exitPictureInPicture: PropTypes.func.isRequired,
  fullscreen: PropTypes.bool.isRequired,
  qualities: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      isFullHD: PropTypes.bool.isRequired,
    }).isRequired,
  ).isRequired,
  playbackRate: PropTypes.number.isRequired,
  loop: PropTypes.bool.isRequired,
  requestFullscreen: PropTypes.func.isRequired,
  exitFullscreen: PropTypes.func.isRequired,
  onLoopClick: PropTypes.func.isRequired,
  onPreventedClick: PropTypes.func.isRequired,
  kernelMsg: PropTypes.oneOfType([
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      detail: PropTypes.string.isRequired,
    }),
    PropTypes.oneOf([undefined]),
  ]),
  fullHDQualityBreak: PropTypes.number,
  poster: PropTypes.string.isRequired,
  skinMode: PropTypes.oneOf(['auto', 'mobile', 'desktop']),
};

export default React.memo(
  PlayerSkin,
  (p, n) =>
    p.spriteVTTFile === n.spriteVTTFile &&
    p.chapters === n.chapters &&
    p.heatmapData === n.heatmapData &&
    p.bufferMode === n.bufferMode &&
    p.videoRef === n.videoRef &&
    p.playerRef === n.playerRef &&
    p.live === n.live &&
    p.hasResource === n.hasResource &&
    p.hasAudio === n.hasAudio &&
    p.loading === n.loading &&
    p.prevented === n.prevented &&
    p.paused === n.paused &&
    p.ended === n.ended &&
    p.seeking === n.seeking &&
    p.waiting === n.waiting &&
    p.duration === n.duration &&
    p.currentTime === n.currentTime &&
    p.bufferedRanges === n.bufferedRanges &&
    p.muted === n.muted &&
    p.volume === n.volume &&
    p.pictureInPictureEnabled === n.pictureInPictureEnabled &&
    p.pip === n.pip &&
    p.fullscreen === n.fullscreen &&
    p.qualities === n.qualities &&
    p.playbackRate === n.playbackRate &&
    p.playbackQuality === n.playbackQuality &&
    p.loop === n.loop &&
    p.kernelMsg === n.kernelMsg &&
    p.fullHDQualityBreak === n.fullHDQualityBreak &&
    p.poster === n.poster &&
    p.skinMode === n.skinMode &&
    p.onPauseClick === n.onPauseClick &&
    p.onPlayClick === n.onPlayClick &&
    p.onTogglePlay === n.onTogglePlay &&
    p.changeCurrentTime === n.changeCurrentTime &&
    p.onMutedClick === n.onMutedClick &&
    p.changeVolume === n.changeVolume &&
    p.changePlaybackRate === n.changePlaybackRate &&
    p.requestPictureInPicture === n.requestPictureInPicture &&
    p.exitPictureInPicture === n.exitPictureInPicture &&
    p.requestFullscreen === n.requestFullscreen &&
    p.exitFullscreen === n.exitFullscreen &&
    p.onSeeking === n.onSeeking &&
    p.onLoopClick === n.onLoopClick &&
    p.onCaptionChange === n.onCaptionChange &&
    p.onPreventedClick === n.onPreventedClick &&
    p.captions === n.captions &&
    p.activeCaption === n.activeCaption &&
    p.onPrevious === n.onPrevious &&
    p.onNext === n.onNext &&
    p.showNavButtons === n.showNavButtons,
);
