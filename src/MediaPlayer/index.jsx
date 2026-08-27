import React from 'react';
import merge from 'deepmerge';
import memoize from 'memoize-one';
import isEqual from 'react-fast-compare';

import { propTypes, defaultProps } from '@MediaPlayer/props.types';
import MediaPlayerSkin from '@MediaPlayer/components/MediaPlayerSkin';
import { omit } from '@playerstack/core';

const IS_BROWSER = typeof window !== 'undefined' && window.document && typeof document !== 'undefined';
const IS_GLOBAL = typeof global !== 'undefined' && global.window && global.window.document;
const SUPPORTED_PROPS = Object.keys(propTypes);

// Return null when rendering on the server
// as Suspense is not supported yet
const UniversalSuspense = IS_BROWSER || IS_GLOBAL ? React.Suspense : () => null;

export const createMediaPlayer = (player) => {
  return class MediaPlayer extends React.Component {
    static displayName = 'MediaPlayer';
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    player = null;

    state = {};

    static canPlay = (url, sources) => {
      if (player.canPlay(url, sources)) {
        return true;
      }
      return false;
    };

    static canEnablePIP = (url) => {
      if (player.canEnablePIP && player.canEnablePIP(url)) {
        return true;
      }
      return false;
    };

    // Use references, as refs is used by React
    references = {
      wrapper: (wrapper) => {
        this.wrapper = wrapper;
      },
      player: (player) => {
        if (player && player !== this.player) {
          this.player = player;
          // Force re-render so MediaPlayerSkin receives the player instance
          this.forceUpdate();
        }
      },
    };

    shouldComponentUpdate(nextProps, nextState) {
      return !isEqual(this.props, nextProps) || !isEqual(this.state, nextState);
    }

    componentDidUpdate() {}

    getDuration = () => {
      if (!this.player) return null;
      return this.player.getDuration();
    };

    getCurrentTime = () => {
      if (!this.player) return null;
      return this.player.getCurrentTime();
    };

    getSecondsLoaded = () => {
      if (!this.player) return null;
      return this.player.getSecondsLoaded();
    };

    getInternalPlayer = (key = 'player') => {
      if (!this.player) {
        return null;
      }
      return this.player.getInternalPlayer(key);
    };

    seekTo = (fraction, type, keepPlaying) => {
      if (!this.player) {
        return null;
      }
      this.player.seekTo(fraction, type, keepPlaying);
    };

    handleReady = () => {
      if (this.props.onReady) {
        this.props.onReady(this);
      }
    };

    getActivePlayer = memoize((url, sources) => {
      if (player.canPlay(url, sources)) {
        return player;
      }
      return null;
    });

    getConfig = memoize((_url, _sources, key) => {
      const { config } = this.props;
      return merge.all([defaultProps.config, defaultProps.config[key] || {}, config, config[key] || {}]);
    });

    getAttributes = memoize(() => {
      return omit(this.props, SUPPORTED_PROPS);
    });

    getPlayerConfig = memoize((config) => {
      // Merge captions prop into tracks
      const captionTracks = (this.props.captions || []).map((c) => ({
        kind: c.kind || 'subtitles',
        src: c.src,
        srcLang: c.language,
        label: c.label,
      }));
      const allTracks = [...(config.tracks || []), ...captionTracks];

      return {
        attributes: config.attributes,
        tracks: allTracks,
        forceVideo: config.forceVideo,
        forceHLS: config.forceHLS,
        dashVersion: config.dashVersion,
        forceDASH: config.forceDASH,
        forceFLV: config.forceFLV,
        flvVersion: config.flvVersion,
        forceLoad: config.forceLoad,
        forceDisableHls: config.forceDisableHls,
        hlsOptions: config.hlsOptions,
        hlsVersion: config.hlsVersion,
        forceSafariHLS: config.forceSafariHLS,
        loopOnEnded: config.loopOnEnded,
      };
    });

    getSourceProps = () => {
      if ('sources' in this.props && this.props.sources !== undefined) {
        return {
          sources: this.props.sources,
          fullHDQualityBreak: this.props.fullHDQualityBreak,
        };
      }

      return {
        sources: [],
      };
    };

    getUrlProp = () => {
      if ('url' in this.props && this.props.url !== undefined) {
        return this.props.url;
      }

      return '';
    };

    renderActivePlayer = (url, sources) => {
      if (!url && !sources) {
        return null;
      }

      const player = this.getActivePlayer(url, sources);
      if (!player) {
        return null;
      }

      const config = this.getConfig(url, sources, player.key);
      const playerConfig = this.getPlayerConfig(config);
      const sourceProps = this.getSourceProps();
      const urlProp = this.getUrlProp();

      return (
        <MediaPlayerSkin
          key={player.key}
          ref={this.references.player}
          player={this.player}
          loop={this.props.loop}
          muted={this.props.muted}
          pip={this.props.pip}
          playbackRate={this.props.playbackRate}
          playsinline={this.props.playsinline}
          progressInterval={this.props.progressInterval}
          stopOnUnmount={this.props.stopOnUnmount}
          volume={this.props.volume}
          url={urlProp}
          sources={sourceProps.sources}
          width={this.props.width}
          height={this.props.height}
          playing={this.props.playing}
          config={playerConfig}
          prevented={this.props.prevented}
          waiting={this.props.waiting}
          onBuffer={this.props.onBuffer}
          onBufferEnd={this.props.onBufferEnd}
          onDisablePIP={this.props.onDisablePIP}
          onDuration={this.props.onDuration}
          onEnablePIP={this.props.onEnablePIP}
          onEnded={this.props.onEnded}
          onError={this.props.onError}
          onPause={this.props.onPause}
          onPlay={this.props.onPlay}
          onPlayBackQualityChange={this.props.onPlayBackQualityChange}
          onPlayBackRateChange={this.props.onPlayBackRateChange}
          onPrevious={this.props.onPrevious}
          onNext={this.props.onNext}
          showNavButtons={this.props.showNavButtons}
          fullHDQualityBreak={sourceProps.fullHDQualityBreak}
          language={this.props.language}
          live={this.props.live || this.props.liveDVR}
          liveDVR={this.props.liveDVR}
          liveAd={this.props.liveAd}
          autoplayFallback={this.props.autoplayFallback}
          onProgress={this.props.onProgress}
          onReady={this.handleReady}
          onSeek={this.props.onSeek}
          onStart={this.props.onStart}
          onLoaded={this.props.onLoaded}
          onMount={this.props.onMount}
          disableDeferredLoading={this.props.disableDeferredLoading}
          progressFrequency={this.props.progressFrequency}
          spriteVTTFile={this.props.spriteVTTFile}
          chapters={this.props.chapters}
          captions={this.props.captions}
          heatmapData={this.props.heatmapData}
          bufferMode={this.props.bufferMode}
          ads={this.props.ads}
          poster={this.props.poster}
          skinMode={this.props.skinMode}
        />
      );
    };

    render() {
      const { wrapper: Wrapper } = this.props;
      const urlProp = this.getUrlProp();
      const sourceProps = this.getSourceProps();

      const { className, ...attributes } = this.getAttributes();
      const wrapperRef = typeof Wrapper === 'string' ? this.references.wrapper : undefined;

      return (
        <Wrapper
          ref={wrapperRef}
          data-testid="media-player-skin"
          className={`playerstack${className ? ` ${className}` : ''}`}
          {...attributes}
        >
          <UniversalSuspense fallback={this.props.fallback}>
            {this.renderActivePlayer(urlProp, sourceProps.sources)}
          </UniversalSuspense>
        </Wrapper>
      );
    }
  };
};
