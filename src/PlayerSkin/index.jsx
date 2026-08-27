import React from 'react';
import PropTypes from 'prop-types';

import PlayerSkin from '@PlayerSkin/PlayerSkin';
import { Provider } from '@context/index';
import { en, es } from '@playerstack/web-core';
import usePlayerSkinWrapper from '@hooks/usePlayerSkinWrapper';

const i18n = { en, es };

const PlayerSkinWrapper = React.forwardRef(
  (
    {
      url,
      sources,
      playerRef,
      player,
      hasAudio,
      fullHDQualityBreak,
      live = false,
      language = Object.keys(i18n)[0],
      hasResource = false,
      buffered = null,
      kernelMsg = null,
      updateState,
      waiting = false,
      prevented = false,
      muted = false,
      ...props
    },
    ref,
  ) => {
    const {
      playerSkinRef,
      videoRef,
      qualities,
      memorizedProps,
      handleKeyDown,
      requestFullscreen,
      exitFullscreen,
      changeVolume,
    } = usePlayerSkinWrapper({
      ref,
      playerRef,
      url,
      player,
      fullHDQualityBreak,
      sources,
      prevented,
      muted,
      updateState,
      ads: props.ads || null,
      live,
      liveDVR: props.liveDVR || false,
    });

    return (
      <Provider language={language}>
        <PlayerSkin
          ref={playerSkinRef}
          videoRef={videoRef}
          playerRef={playerRef}
          qualities={qualities}
          hasAudio={hasAudio}
          handleKeyDown={handleKeyDown}
          requestFullscreen={requestFullscreen}
          exitFullscreen={exitFullscreen}
          changeVolume={changeVolume}
          fullHDQualityBreak={fullHDQualityBreak}
          live={live}
          hasResource={hasResource}
          buffered={buffered}
          kernelMsg={kernelMsg}
          prevented={prevented}
          waiting={waiting}
          muted={muted}
          language={language}
          {...props}
          {...memorizedProps}
        />
      </Provider>
    );
  },
);

PlayerSkinWrapper.displayName = 'PlayerSkinWrapper';

PlayerSkinWrapper.propTypes = {
  playerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.instanceOf(HTMLDivElement) })])
    .isRequired,
  player: PropTypes.object,
  live: PropTypes.bool,
  prevented: PropTypes.bool,
  waiting: PropTypes.bool,
  hasResource: PropTypes.bool.isRequired,
  hasAudio: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  paused: PropTypes.bool.isRequired,
  ended: PropTypes.bool.isRequired,
  seeking: PropTypes.bool.isRequired,
  duration: PropTypes.number.isRequired,
  currentTime: PropTypes.number.isRequired,
  muted: PropTypes.bool.isRequired,
  volume: PropTypes.number.isRequired,
  playbackRate: PropTypes.number.isRequired,
  pictureInPictureEnabled: PropTypes.bool.isRequired,
  fullHDQualityBreak: PropTypes.number,
  pip: PropTypes.bool.isRequired,
  fullscreen: PropTypes.bool.isRequired,
  kernelMsg: PropTypes.oneOfType([
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      detail: PropTypes.string.isRequired,
    }),
    PropTypes.oneOf([undefined]),
  ]),
  url: PropTypes.string,
  sources: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      resolution: PropTypes.number.isRequired,
    }).isRequired,
  ).isRequired,
  loop: PropTypes.bool.isRequired,
};

export default React.memo(
  PlayerSkinWrapper,
  (p, n) =>
    p.playerRef === n.playerRef &&
    p.player === n.player &&
    p.live === n.live &&
    p.hasResource === n.hasResource &&
    p.hasAudio === n.hasAudio &&
    p.loading === n.loading &&
    p.prevented === n.prevented &&
    p.paused === n.paused &&
    p.seeking === n.seeking &&
    p.waiting === n.waiting &&
    p.duration === n.duration &&
    p.currentTime === n.currentTime &&
    p.buffered === n.buffered &&
    p.muted === n.muted &&
    p.volume === n.volume &&
    p.playbackRate === n.playbackRate &&
    p.loop === n.loop &&
    p.pictureInPictureEnabled === n.pictureInPictureEnabled &&
    p.fullHDQualityBreak === n.fullHDQualityBreak &&
    p.pip === n.pip &&
    p.fullscreen === n.fullscreen &&
    p.kernelMsg === n.kernelMsg &&
    p.url === n.url &&
    p.sources === n.sources &&
    p.chapters === n.chapters &&
    p.captions === n.captions &&
    p.activeCaption === n.activeCaption &&
    p.poster === n.poster &&
    p.skinMode === n.skinMode,
);
