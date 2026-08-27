import React from 'react';
import isEqual from 'react-fast-compare';

import VideoElement from '@core/VideoElement';
import PlayerSkin from '@PlayerSkin';
import { playerStateInitial } from '@playerstack/web-core';
import MediaPlayerWrapper from '@MediaPlayer/components/MediaPlayerWrapper';
import usePlayerProxy from '@MediaPlayer/hooks/usePlayerProxy';

const MediaPlayerSkin = React.forwardRef((props, ref) => {
  // Player dimensions are always derived from the consumer's props.
  // CSS units pass through directly ("100%", "640px", "auto", etc.) so the player is
  // fluid and adapts naturally when the container/viewport resizes.
  const playerStyles = React.useMemo(
    () => ({
      width: props.width || '100%',
      height: props.height || '100%',
    }),
    [props.width, props.height],
  );
  const [playerState, setPlayerState] = React.useState({
    ...playerStateInitial,
    isPIP: props.pip,
    isMuted: props.muted,
    playbackRate: props.playbackRate,
    loop: props.loop,
    playing: props.playing,
    volume: props.muted ? 0 : (props.volume ?? playerStateInitial.volume),
  });

  const [prevProps, setPrevProps] = React.useState({
    pip: props.pip,
    playbackRate: props.playbackRate,
    loop: props.loop,
    playing: props.playing,
    muted: props.muted,
    volume: props.volume,
  });

  // Sync external props to internal state synchronously (during render, not in useEffect)
  if (
    props.pip !== prevProps.pip ||
    props.playbackRate !== prevProps.playbackRate ||
    props.loop !== prevProps.loop ||
    props.playing !== prevProps.playing ||
    props.muted !== prevProps.muted ||
    props.volume !== prevProps.volume
  ) {
    setPrevProps({
      pip: props.pip,
      playbackRate: props.playbackRate,
      loop: props.loop,
      playing: props.playing,
      muted: props.muted,
      volume: props.volume,
    });
    setPlayerState((prevState) => {
      const next = { ...prevState };
      if (props.pip !== prevProps.pip) {
        next.isPIP = props.pip;
      }
      if (props.playbackRate !== prevProps.playbackRate) {
        next.playbackRate = props.playbackRate;
      }
      if (props.loop !== prevProps.loop) {
        next.loop = props.loop;
      }
      if (props.playing !== prevProps.playing) {
        next.playing = props.playing;
      }
      if (props.muted !== prevProps.muted) {
        next.isMuted = props.muted;
        next.volume = props.muted ? 0 : (props.volume ?? playerStateInitial.volume);
      }
      if (props.volume !== prevProps.volume && !props.muted) {
        next.volume = props.volume ?? playerStateInitial.volume;
      }
      return next;
    });
  }

  const playerSkinRef = React.useRef(null);
  const playerRef = React.useRef(null);

  // When a live stream transitions to VOD (HLS #EXT-X-ENDLIST / duration becomes
  // finite), the player must behave like a normal on-demand asset: drop the
  // live/DVR UI and render the standard timeline. Tracked locally because it is
  // driven by the media itself, not by the consumer prop.
  const [liveEnded, setLiveEnded] = React.useState(false);
  const handleLiveEnded = React.useCallback(() => setLiveEnded(true), []);

  // Browser autoplay policy blocked play-with-sound, so core muted the stream and kept it
  // playing. Mirror that muted state so the UI is consistent (volume shows muted) and the
  // "click to unmute" tip appears (`preventedMemorized` = playing && muted). The stream is
  // playing, just muted — the viewer clicks once to restore sound.
  const handleAutoplayMuted = React.useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isMuted: true }));
  }, []);

  // `autoplayFallback: 'pause'`: autoplay-with-sound was blocked and core chose NOT to mute, so
  // reflect the real paused state. The skin then shows the big center play button; the user's
  // first click plays WITH SOUND (the click is the gesture the browser required).
  //
  // `autoplayBlocked` marks "paused before the stream ever played" so the POSTER (if any) shows
  // over the paused frame — parity with a normal pre-play poster. On live the media `currentTime`
  // is the live edge (never <= 0), so the usual `currentTime <= 0` poster rule can't detect the
  // pre-play state; this flag does. Cleared on the first real play.
  const [autoplayBlocked, setAutoplayBlocked] = React.useState(false);
  const handleAutoplayPaused = React.useCallback(() => {
    setAutoplayBlocked(true);
    setPlayerState((prev) => ({ ...prev, playing: false }));
  }, []);
  // Clear the pre-play poster flag once playback actually starts.
  React.useEffect(() => {
    if (playerState.playing && autoplayBlocked) setAutoplayBlocked(false);
  }, [playerState.playing, autoplayBlocked]);

  // Reset the live→VOD flag whenever the source changes.
  const prevLiveSrcRef = React.useRef(props.url);
  const prevLiveSourcesRef = React.useRef(props.sources);
  if (prevLiveSrcRef.current !== props.url || prevLiveSourcesRef.current !== props.sources) {
    prevLiveSrcRef.current = props.url;
    prevLiveSourcesRef.current = props.sources;
    if (liveEnded) setLiveEnded(false);
  }

  // Effective live flags: honor the consumer props until the stream ends.
  const effectiveLive = (props.live || props.liveDVR) && !liveEnded;
  const effectiveLiveDVR = props.liveDVR && !liveEnded;

  // Track previous url/sources to detect source changes and reset state/dimensions
  const prevUrlRef = React.useRef(props.url);
  const prevSourcesRef = React.useRef(props.sources);

  React.useEffect(() => {
    const urlChanged = prevUrlRef.current !== props.url;
    const sourcesChanged = !isEqual(prevSourcesRef.current, props.sources);

    if (urlChanged || sourcesChanged) {
      prevUrlRef.current = props.url;
      prevSourcesRef.current = props.sources;

      setPlayerState((prev) => ({
        ...prev,
        isLoading: true,
        isBuffering: false,
        duration: 0,
        played: 0,
        loaded: 0,
        seek: 0,
        isEnded: false,
        kernelError: null,
        seeking: false,
      }));
    }
  }, [props.url, props.sources]);

  // Auto-play main content when ads deactivates (ad ended or skipped)
  const prevAdsRef = React.useRef(props.ads);
  React.useEffect(() => {
    const wasAdActive = prevAdsRef.current !== null && prevAdsRef.current !== undefined;
    const isAdActive = props.ads !== null && props.ads !== undefined;
    prevAdsRef.current = props.ads;

    // Transition from ad active to inactive — auto-play main content
    if (wasAdActive && !isAdActive) {
      setPlayerState((prev) => ({ ...prev, playing: true }));
    }
  }, [props.ads]);

  const handleKeyDown = React.useCallback((e) => {
    playerSkinRef.current?.handleKeyDown?.(e);
  }, []);

  const preventedMemorized = React.useMemo(
    () => props.prevented || (props.playing && props.muted),
    [props.muted, props.playing, props.prevented],
  );

  // The player dimensions come directly from the consumer's width/height props
  // (e.g. "100%", "640px", "auto"). No pixel-snapshot is performed: the wrapper's
  // CSS ensures the player is fluid within whatever box the consumer gives it,
  // and naturally adapts when the viewport/container resizes (rotation, window resize).
  // Previously an effect here read offsetWidth/offsetHeight once on loadedmetadata
  // and locked the inline style to those pixel values — that caused the player to
  // NOT resize when the container changed dimensions.

  const { videoUrl, ...playerProxy } = usePlayerProxy({
    onBuffer: props.onBuffer,
    onBufferEnd: props.onBufferEnd,
    onDisablePIP: props.onDisablePIP,
    onDuration: props.onDuration,
    onEnablePIP: props.onEnablePIP,
    onEnded: props.onEnded,
    onError: props.onError,
    onPause: props.onPause,
    onPlay: props.onPlay,
    onPlayBackQualityChange: props.onPlayBackQualityChange,
    onPlayBackRateChange: props.onPlayBackRateChange,
    onProgress: props.onProgress,
    onReady: props.onReady,
    onSeek: props.onSeek,
    onStart: props.onStart,
    onLoaded: props.onLoaded,
    onMount: props.onMount,
    updateState: setPlayerState,
    playerState,
    extraProps: {
      url: props.url,
      sources: props.sources,
      fullHDQualityBreak: props.fullHDQualityBreak,
      prevented: preventedMemorized,
    },
  });

  const playerConfig = React.useMemo(
    () => ({
      attributes: props.config.attributes,
      tracks: props.config.tracks,
      forceVideo: props.config.forceVideo,
      forceHLS: props.config.forceHLS,
      dashVersion: props.config.dashVersion,
      forceDASH: props.config.forceDASH,
      forceFLV: props.config.forceFLV,
      flvVersion: props.config.flvVersion,
      forceLoad: props.config.forceLoad,
      forceDisableHls: props.config.forceDisableHls,
      hlsOptions: props.config.hlsOptions,
      hlsVersion: props.config.hlsVersion,
      forceSafariHLS: props.config.forceSafariHLS,
      loopOnEnded: props.config.loopOnEnded,
      live: effectiveLive,
      liveDVR: effectiveLiveDVR,
      autoplayFallback: props.autoplayFallback,
    }),
    [props.config, effectiveLive, effectiveLiveDVR, props.autoplayFallback],
  );

  return (
    <MediaPlayerWrapper
      tabIndex={0}
      role="application"
      dir="ltr"
      ref={playerRef}
      onKeyDown={handleKeyDown}
      style={playerStyles}
    >
      <div className="playerstack-container">
        {videoUrl && (
          <VideoElement
            ref={ref}
            loop={playerState.loop}
            muted={playerState.isMuted}
            playbackRate={playerState.playbackRate}
            playsinline={props.playsinline}
            volume={playerState.volume}
            url={videoUrl}
            width={props.width}
            height={props.height}
            playing={playerState.playing}
            config={playerConfig}
            onLiveEnded={handleLiveEnded}
            onAutoplayMuted={handleAutoplayMuted}
            onAutoplayPaused={handleAutoplayPaused}
            {...playerProxy}
          />
        )}
      </div>
      <PlayerSkin
        ref={playerSkinRef}
        playerRef={playerRef}
        url={videoUrl}
        sources={props.sources}
        hasAudio={playerState.hasAudio}
        spriteVTTFile={props.spriteVTTFile}
        chapters={props.chapters}
        captions={props.captions}
        heatmapData={props.heatmapData}
        bufferMode={props.bufferMode}
        ads={props.ads}
        hasResource={typeof videoUrl === 'string' || props.sources.length > 0}
        kernelMsg={playerState.kernelError}
        loading={playerState.isLoading}
        prevented={preventedMemorized}
        muted={playerState.isMuted}
        paused={playerState.playing === false}
        live={effectiveLive}
        liveDVR={effectiveLiveDVR}
        liveAd={props.liveAd}
        autoplayBlocked={autoplayBlocked}
        bufferedRanges={playerState.bufferedRanges || []}
        ended={playerState.isEnded}
        seeking={playerState.seeking}
        waiting={playerState.isBuffering || props.waiting}
        duration={playerState.duration}
        currentTime={playerState.played}
        volume={playerState.volume}
        playbackRate={playerState.playbackRate}
        playbackQuality={playerState.playbackQuality}
        pictureInPictureEnabled={true}
        pip={playerState.isPIP}
        loop={playerState.loop}
        activeCaption={playerState.activeCaption}
        fullscreen={playerState.isFullScreen}
        fullHDQualityBreak={props.fullHDQualityBreak}
        language={props.language}
        poster={props.poster}
        updateState={setPlayerState}
        player={props.player}
        skinMode={props.skinMode}
        onPrevious={props.onPrevious}
        onNext={props.onNext}
        showNavButtons={props.showNavButtons}
      />
    </MediaPlayerWrapper>
  );
});

MediaPlayerSkin.displayName = 'MediaPlayerSkin';

export default React.memo(
  MediaPlayerSkin,
  (p, n) =>
    p.url === n.url &&
    p.sources === n.sources &&
    p.fullHDQualityBreak === n.fullHDQualityBreak &&
    p.spriteVTTFile === n.spriteVTTFile &&
    p.chapters === n.chapters &&
    p.heatmapData === n.heatmapData &&
    p.bufferMode === n.bufferMode &&
    p.ads === n.ads &&
    p.prevented === n.prevented &&
    p.waiting === n.waiting &&
    p.playing === n.playing &&
    p.loop === n.loop &&
    p.volume === n.volume &&
    p.muted === n.muted &&
    p.paused === n.paused &&
    p.live === n.live &&
    p.pip === n.pip &&
    p.playbackRate === n.playbackRate &&
    p.width === n.width &&
    p.height === n.height &&
    p.progressInterval === n.progressInterval &&
    p.playsinline === n.playsinline &&
    p.pipeline === n.pipeline &&
    p.stopOnUnmount === n.stopOnUnmount &&
    p.player === n.player &&
    p.progressFrequency === n.progressFrequency &&
    p.disableDeferredLoading === n.disableDeferredLoading &&
    p.language === n.language &&
    p.poster === n.poster &&
    p.config === n.config &&
    p.skinMode === n.skinMode &&
    p.onReady === n.onReady &&
    p.onStart === n.onStart &&
    p.onPlay === n.onPlay &&
    p.onPause === n.onPause &&
    p.onBuffer === n.onBuffer &&
    p.onBufferEnd === n.onBufferEnd &&
    p.onEnded === n.onEnded &&
    p.onError === n.onError &&
    p.onDuration === n.onDuration &&
    p.onSeek === n.onSeek &&
    p.onPlayBackRateChange === n.onPlayBackRateChange &&
    p.onPlayBackQualityChange === n.onPlayBackQualityChange &&
    p.onProgress === n.onProgress &&
    p.onEnablePIP === n.onEnablePIP &&
    p.onDisablePIP === n.onDisablePIP &&
    p.onLoaded === n.onLoaded &&
    p.onMount === n.onMount &&
    p.onPrevious === n.onPrevious &&
    p.onNext === n.onNext &&
    p.showNavButtons === n.showNavButtons,
);
