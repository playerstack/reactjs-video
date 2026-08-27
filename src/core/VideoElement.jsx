import React, { useRef, useEffect, useImperativeHandle } from 'react';

import { MediaEngine, PlayerOrchestrator } from '@playerstack/core';

/**
 * Thin video element component that wires a <video> element to
 * core's MediaEngine + PlayerOrchestrator. This replaces the old
 * PlayerCore + PlayerProxy class-based approach.
 *
 * On mount: creates MediaEngine with the video ref, creates
 * PlayerOrchestrator with the engine.
 * On unmount: calls orchestrator.destroy() which cascades to engine.
 */
const VideoElement = React.forwardRef(function VideoElement(
  {
    url,
    playing,
    volume,
    muted,
    playbackRate,
    loop,
    config = {},
    width,
    height,
    playsinline,
    onProgress,
    onDuration,
    onReady,
    onPlay,
    onPause,
    onEnded,
    onError,
    onSeek,
    onBuffer,
    onBufferEnd,
    onLoaded,
    onPlayBackRateChange,
    onEnablePIP,
    onDisablePIP,
    onMount,
    onLiveEnded,
    onAutoplayMuted,
    onAutoplayPaused,
  },
  ref,
) {
  const videoRef = useRef(null);
  const engineRef = useRef(null);
  const orchestratorRef = useRef(null);
  const mountedRef = useRef(false);

  // Keep callbacks in refs for stable event subscriptions
  const callbacksRef = useRef({
    onProgress,
    onDuration,
    onReady,
    onPlay,
    onPause,
    onEnded,
    onError,
    onSeek,
    onBuffer,
    onBufferEnd,
    onLoaded,
    onPlayBackRateChange,
    onEnablePIP,
    onDisablePIP,
    onMount,
    onLiveEnded,
    onAutoplayMuted,
    onAutoplayPaused,
  });
  callbacksRef.current = {
    onProgress,
    onDuration,
    onReady,
    onPlay,
    onPause,
    onEnded,
    onError,
    onSeek,
    onBuffer,
    onBufferEnd,
    onLoaded,
    onPlayBackRateChange,
    onEnablePIP,
    onDisablePIP,
    onMount,
    onLiveEnded,
    onAutoplayMuted,
    onAutoplayPaused,
  };

  // Expose the video element and orchestrator to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      getPlayer: () => videoRef.current,
      getOrchestrator: () => orchestratorRef.current,
      getEngine: () => engineRef.current,
      seekTo: (amount, type, keepPlaying) => {
        if (!orchestratorRef.current) return;
        const isFraction = !type ? amount > 0 && amount < 1 : type === 'fraction';
        if (isFraction) {
          const duration = engineRef.current?.getDuration() ?? 0;
          if (!duration) return;
          orchestratorRef.current.seekTo(duration * amount, keepPlaying);
          return;
        }
        orchestratorRef.current.seekTo(amount, keepPlaying);
      },
      getDuration: () => engineRef.current?.getDuration() ?? null,
      getCurrentTime: () => engineRef.current?.getCurrentTime() ?? null,
      getSecondsLoaded: () => engineRef.current?.getSecondsLoaded() ?? null,
      getInternalPlayer: (key) => {
        if (!engineRef.current) return null;
        if (key === 'hls') return engineRef.current.getHlsInstance();
        if (key === 'dash') return engineRef.current.getDashInstance();
        return videoRef.current;
      },
      play: () => engineRef.current?.play(),
      pause: () => engineRef.current?.pause(),
      stop: () => engineRef.current?.stop(),
      enablePIP: () => engineRef.current?.enablePiP(),
      disablePIP: () => engineRef.current?.disablePiP(),
    }),
    [],
  );

  // Create engine + orchestrator on mount
  useEffect(() => {
    mountedRef.current = true;
    const engine = new MediaEngine(videoRef.current, {
      hlsVersion: config.hlsVersion,
      dashVersion: config.dashVersion,
      flvVersion: config.flvVersion,
      forceHLS: config.forceHLS,
      forceDASH: config.forceDASH,
      forceFLV: config.forceFLV,
      forceSafariHLS: config.forceSafariHLS,
      forceDisableHls: config.forceDisableHls,
      hlsOptions: config.hlsOptions,
      live: config.live,
      liveDVR: config.liveDVR,
    });
    const orchestrator = new PlayerOrchestrator(engine, {
      live: config.live,
      liveDVR: config.liveDVR,
      autoplayFallback: config.autoplayFallback,
    });

    engineRef.current = engine;
    orchestratorRef.current = orchestrator;

    // Subscribe to orchestrator events via stable refs
    orchestrator.on('progress', (data) => {
      if (callbacksRef.current.onProgress) callbacksRef.current.onProgress(data);
    });
    orchestrator.on('duration', (duration) => {
      if (callbacksRef.current.onDuration) callbacksRef.current.onDuration(duration);
    });
    orchestrator.on('ready', () => {
      if (callbacksRef.current.onReady) callbacksRef.current.onReady();
    });
    orchestrator.on('play', () => {
      if (callbacksRef.current.onPlay) callbacksRef.current.onPlay();
    });
    orchestrator.on('pause', () => {
      if (callbacksRef.current.onPause) callbacksRef.current.onPause();
    });
    orchestrator.on('ended', () => {
      if (callbacksRef.current.onEnded) callbacksRef.current.onEnded();
    });
    orchestrator.on('error', (error) => {
      if (callbacksRef.current.onError) callbacksRef.current.onError(error);
    });
    orchestrator.on('seek', (time) => {
      if (callbacksRef.current.onSeek) callbacksRef.current.onSeek(time);
    });
    orchestrator.on('liveEnded', () => {
      if (callbacksRef.current.onLiveEnded) callbacksRef.current.onLiveEnded();
    });
    orchestrator.on('autoplayMuted', () => {
      if (callbacksRef.current.onAutoplayMuted) callbacksRef.current.onAutoplayMuted();
    });
    orchestrator.on('autoplayPaused', () => {
      if (callbacksRef.current.onAutoplayPaused) callbacksRef.current.onAutoplayPaused();
    });

    // Subscribe to engine-level events not covered by orchestrator
    engine.on('buffer', () => {
      if (callbacksRef.current.onBuffer) callbacksRef.current.onBuffer();
    });
    engine.on('bufferEnd', () => {
      if (callbacksRef.current.onBufferEnd) callbacksRef.current.onBufferEnd();
    });
    engine.on('loaded', () => {
      if (callbacksRef.current.onLoaded) callbacksRef.current.onLoaded();
    });
    engine.on('playbackRateChange', (rate) => {
      if (callbacksRef.current.onPlayBackRateChange) callbacksRef.current.onPlayBackRateChange(rate);
    });
    engine.on('enablePiP', () => {
      if (callbacksRef.current.onEnablePIP) callbacksRef.current.onEnablePIP();
    });
    engine.on('disablePiP', () => {
      if (callbacksRef.current.onDisablePIP) callbacksRef.current.onDisablePIP();
    });

    // Notify parent that the player is mounted
    if (callbacksRef.current.onMount) callbacksRef.current.onMount();

    return () => {
      mountedRef.current = false;
      orchestrator.destroy();
      engineRef.current = null;
      orchestratorRef.current = null;
    };
    // Engine and orchestrator are created once on mount; config is stabilized
    // externally, so the effect must not re-run when its fields change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync playing prop
  useEffect(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.setPlaying(playing);
    }
  }, [playing]);

  // Sync volume prop
  useEffect(() => {
    if (orchestratorRef.current && volume !== null && volume !== undefined) {
      orchestratorRef.current.setVolume(volume);
    }
  }, [volume]);

  // Sync muted prop
  useEffect(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.setMuted(muted);
    }
  }, [muted]);

  // Sync playbackRate prop
  useEffect(() => {
    if (orchestratorRef.current && playbackRate !== undefined) {
      orchestratorRef.current.setPlaybackRate(playbackRate);
    }
  }, [playbackRate]);

  // Sync loop prop
  useEffect(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.setLoop(!!loop);
    }
  }, [loop]);

  // Sync URL — load new source when URL changes
  useEffect(() => {
    if (orchestratorRef.current && url) {
      orchestratorRef.current.load(url);
    }
  }, [url]);

  const style = {
    width: width === 'auto' ? width : '100%',
    height: height === 'auto' ? height : '100%',
    objectFit: 'contain',
  };

  return (
    <video
      data-testid="video-element"
      ref={videoRef}
      style={style}
      preload="auto"
      autoPlay={playing || undefined}
      controls={false}
      muted={muted}
      loop={loop}
      {...(playsinline ? { playsInline: true, 'webkit-playsinline': '', 'x5-playsinline': '' } : {})}
      {...config.attributes}
    >
      {config.tracks?.map((track, index) => (
        <track key={index} {...track} />
      ))}
    </video>
  );
});

VideoElement.displayName = 'VideoElement';

export default VideoElement;
