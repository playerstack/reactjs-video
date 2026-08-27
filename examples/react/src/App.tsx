import React, { useCallback, useEffect } from 'react';

import Duration from './components/Duration';
import screenfull from './utils/fullscreen';
import PlayerStack from '../../../src';
import { version } from '../../../package.json';
import { IState } from './types/App.types';

const SEPARATOR = ' · ';

const App = () => {
  const urlFileInputRef = React.useRef<HTMLInputElement>(null);
  const urlVTTInputRef = React.useRef<HTMLInputElement>(null);
  const urlPosterInputRef = React.useRef<HTMLInputElement>(null);
  const ref = React.useRef<any>();

  const [state, setState] = React.useState<IState>({
    urlFile: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    spriteVTTFile: null,
    pip: false,
    playing: false,
    volume: 0.8,
    muted: false,
    played: 0,
    loaded: 0,
    duration: 0,
    playbackRate: 1.0,
    loop: false,
    seeking: false,
    poster: './example-poster.jpg',
  });

  const load = useCallback((urlFile: string) => {
    setState({
      urlFile,
      spriteVTTFile: null,
      played: 0,
      loaded: 0,
      pip: false,
      duration: 0,
      loop: false,
      muted: false,
      playbackRate: 1.0,
      playing: false,
      seeking: false,
      volume: 0.8,
      poster: './example-poster.jpg',
    });
  }, []);

  const handlePlayPause = useCallback(() => {
    setState((prev) => ({ ...prev, playing: !prev.playing }));
  }, []);

  const handleStop = useCallback(() => {
    setState((prev) => ({ ...prev, url: null, playing: false }));
  }, []);

  useEffect(() => {
    const url = state.urlFile;
    load(url);
  }, [load, state.urlFile]);

  const handleToggleLoop = useCallback(() => {
    setState((prev) => ({ ...prev, loop: !prev.loop }));
  }, []);

  const handleVolumeChange = useCallback((e) => {
    setState((prev) => ({ ...prev, volume: parseFloat(e.target.value) }));
  }, []);

  const handleToggleMuted = useCallback(() => {
    setState((prev) => ({ ...prev, muted: !prev.muted }));
  }, []);

  const handleSetPlaybackRate = useCallback((e) => {
    setState((prev) => ({ ...prev, playbackRate: parseFloat(e.target.value) }));
  }, []);

  const handleOnPlaybackRateChange = useCallback((speed) => {
    setState((prev) => ({ ...prev, playbackRate: parseFloat(speed) }));
  }, []);

  const handleTogglePIP = useCallback(() => {
    setState((prev) => ({ ...prev, pip: !prev.pip }));
  }, []);

  const handlePlay = () => {
    setState((prev) => ({ ...prev, playing: true }));
  };

  const handleEnablePIP = useCallback(() => {
    setState((prev) => ({ ...prev, pip: true }));
  }, []);

  const handleDisablePIP = useCallback(() => {
    setState((prev) => ({ ...prev, pip: false }));
  }, []);

  const handlePause = useCallback(() => {
    setState((prev) => ({ ...prev, playing: false }));
  }, []);

  const handleSeekMouseDown = useCallback((e) => {
    setState((prev) => ({ ...prev, seeking: true }));
  }, []);

  const handleSeekChange = useCallback((e) => {
    setState((prev) => ({ ...prev, played: parseFloat(e.target.value) }));
  }, []);

  const handleSeekMouseUp = useCallback((e) => {
    if (ref.current) {
      setState((prev) => ({ ...prev, seeking: false }));
      ref.current.seekTo(parseFloat(e.target.value));
    }
  }, []);

  const handleProgress = useCallback(
    (progress) => {
      // We only want to update time slider if we are not currently seeking
      if (!state.seeking) {
        setState((prev) => ({
          ...prev,
          loaded: progress.loaded,
          loadedSeconds: progress.loadedSeconds,
          played: progress.played,
          playedSeconds: progress.playedSeconds,
        }));
      }
    },
    [state.seeking],
  );

  const handleEnded = useCallback(() => {
    setState((prev) => ({ ...prev, playing: prev.loop }));
  }, []);

  const handleDuration = useCallback((duration) => {
    setState((prev) => ({ ...prev, duration }));
  }, []);

  const handleClickFullscreen = useCallback(() => {
    const player = document.querySelector<HTMLElement>('div[role="application"]');
    if (player !== null) {
      screenfull.request(player);
    }
  }, []);

  const renderLoadButton = useCallback(
    (url: string, label: string) => {
      return (
        <button type="button" onClick={() => load(url)}>
          {label}
        </button>
      );
    },
    [load],
  );

  return (
    <div className="app">
      <section className="section">
        <h1>PlayerStack Demo</h1>
        <div className="player-wrapper">
          <PlayerStack
            ref={ref}
            className="reactjs-player"
            width="100%"
            height="100%"
            // url={state.urlFile}
            config={{
              file: {
                forceVideo: true,
                forceHLS: true,
                hlsOptions: {
                  xhrSetup: (xhr) => {
                    xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
                    xhr.setRequestHeader('Cache-Control', 'no-cache');
                    xhr.withCredentials = false;
                  },
                },
              },
            }}
            url="http://localhost:5173/uploads/videos/f08e80da-bf1d-4e3d-8899-f0f6155f6efa_video_1080_4800000_load.m3u8"
            spriteVTTFile="http://127.0.0.1:8000/uploads/videos/f08e80da-bf1d-4e3d-8899-f0f6155f6efa_video_sprite.vtt"
            fullHDQualityBreak={720}
            sources={[
              {
                src: '/uploads/videos/f08e80da-bf1d-4e3d-8899-f0f6155f6efa_video_1080_4800000_load.m3u8',
                resolution: 1080,
              },
              {
                src: '/uploads/videos/f08e80da-bf1d-4e3d-8899-f0f6155f6efa_video_720_2400000_load.m3u8',
                resolution: 720,
              },
              {
                src: '/uploads/videos/f08e80da-bf1d-4e3d-8899-f0f6155f6efa_video_540_1200000_load.m3u8',
                resolution: 540,
              },
              {
                src: '/uploads/videos/f08e80da-bf1d-4e3d-8899-f0f6155f6efa_video_360_800000_load.m3u8',
                resolution: 360,
              },
              {
                src: '/uploads/videos/f08e80da-bf1d-4e3d-8899-f0f6155f6efa_video_270_400000_load.m3u8',
                resolution: 270,
              },
              {
                src: '/uploads/videos/f08e80da-bf1d-4e3d-8899-f0f6155f6efa_video_144p_load.m3u8',
                resolution: 144,
              },
            ]}
            language="es"
            chapters={[
              { title: 'Intro', startTime: 0 },
              { title: 'The Forest', startTime: 60 },
              { title: 'Camp Site', startTime: 120 },
              { title: 'The Sprites', startTime: 180 },
              { title: 'River Crossing', startTime: 300 },
              { title: 'The Cave', startTime: 420 },
              { title: 'Credits', startTime: 540 },
            ]}
            heatmapData={[
              { startTime: 0, endTime: 4.2, value: 0.08 },
              { startTime: 4.2, endTime: 8.4, value: 0.15 },
              { startTime: 8.4, endTime: 12.6, value: 0.22 },
              { startTime: 12.6, endTime: 16.8, value: 0.18 },
              { startTime: 16.8, endTime: 21, value: 0.32 },
              { startTime: 21, endTime: 25.2, value: 0.45 },
              { startTime: 25.2, endTime: 29.4, value: 0.38 },
              { startTime: 29.4, endTime: 33.6, value: 0.52 },
              { startTime: 33.6, endTime: 37.8, value: 0.65 },
              { startTime: 37.8, endTime: 42, value: 0.48 },
              { startTime: 42, endTime: 46.2, value: 0.72 },
              { startTime: 46.2, endTime: 50.4, value: 0.85 },
              { startTime: 50.4, endTime: 54.6, value: 0.92 },
              { startTime: 54.6, endTime: 58.8, value: 0.78 },
              { startTime: 58.8, endTime: 63, value: 0.95 },
              { startTime: 63, endTime: 67.2, value: 1.0 },
              { startTime: 67.2, endTime: 71.4, value: 0.88 },
              { startTime: 71.4, endTime: 75.6, value: 0.62 },
              { startTime: 75.6, endTime: 79.8, value: 0.45 },
              { startTime: 79.8, endTime: 84, value: 0.55 },
              { startTime: 84, endTime: 88.2, value: 0.7 },
              { startTime: 88.2, endTime: 92.4, value: 0.82 },
              { startTime: 92.4, endTime: 96.6, value: 0.6 },
              { startTime: 96.6, endTime: 100.8, value: 0.42 },
              { startTime: 100.8, endTime: 105, value: 0.35 },
              { startTime: 105, endTime: 109.2, value: 0.28 },
              { startTime: 109.2, endTime: 113.4, value: 0.45 },
              { startTime: 113.4, endTime: 117.6, value: 0.62 },
              { startTime: 117.6, endTime: 121.8, value: 0.78 },
              { startTime: 121.8, endTime: 126, value: 0.9 },
              { startTime: 126, endTime: 130.2, value: 0.95 },
              { startTime: 130.2, endTime: 134.4, value: 0.82 },
              { startTime: 134.4, endTime: 138.6, value: 0.58 },
              { startTime: 138.6, endTime: 142.8, value: 0.42 },
              { startTime: 142.8, endTime: 147, value: 0.35 },
              { startTime: 147, endTime: 151.2, value: 0.25 },
              { startTime: 151.2, endTime: 155.4, value: 0.3 },
              { startTime: 155.4, endTime: 159.6, value: 0.48 },
              { startTime: 159.6, endTime: 163.8, value: 0.65 },
              { startTime: 163.8, endTime: 168, value: 0.55 },
              { startTime: 168, endTime: 172.2, value: 0.4 },
              { startTime: 172.2, endTime: 176.4, value: 0.32 },
              { startTime: 176.4, endTime: 180.6, value: 0.45 },
              { startTime: 180.6, endTime: 184.8, value: 0.58 },
              { startTime: 184.8, endTime: 189, value: 0.72 },
              { startTime: 189, endTime: 193.2, value: 0.85 },
              { startTime: 193.2, endTime: 197.4, value: 0.78 },
              { startTime: 197.4, endTime: 201.6, value: 0.6 },
              { startTime: 201.6, endTime: 205.8, value: 0.42 },
              { startTime: 205.8, endTime: 210, value: 0.2 },
            ]}
            poster={state.poster}
            prevented={false}
            waiting={false}
            playing={state.playing}
            muted={state.muted}
            pip={state.pip}
            loop={state.loop}
            playbackRate={state.playbackRate}
            volume={state.volume}
            onReady={() => console.log('onReady')}
            onStart={() => console.log('onStart')}
            onPlay={handlePlay}
            onEnablePIP={handleEnablePIP}
            onDisablePIP={handleDisablePIP}
            onPause={handlePause}
            onBuffer={() => console.log('onBuffer')}
            onPlayBackRateChange={handleOnPlaybackRateChange}
            onSeek={(e) => console.log('onSeek', e)}
            onEnded={handleEnded}
            onError={(e) => console.log('onError', e)}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onPlayBackQualityChange={(e) => console.log('onPlayBackQualityChange', e)}
            onPrevious={() => console.log('onPrevious')}
            onNext={() => console.log('onNext')}
            showNavButtons
          />
        </div>

        <table>
          <tbody>
            <tr>
              <th>Controls</th>
              <td>
                <button onClick={handleStop}>Stop</button>
                <button onClick={handlePlayPause}>{state.playing ? 'Pause' : 'Play'}</button>
                <button onClick={handleClickFullscreen}>Fullscreen</button>
                {PlayerStack.canEnablePIP(state.urlFile) && (
                  <button onClick={handleTogglePIP}>{state.pip ? 'Disable PiP' : 'Enable PiP'}</button>
                )}
              </td>
            </tr>
            <tr>
              <th>Speed</th>
              <td>
                <button onClick={handleSetPlaybackRate} value={1}>
                  1x
                </button>
                <button onClick={handleSetPlaybackRate} value={1.5}>
                  1.5x
                </button>
                <button onClick={handleSetPlaybackRate} value={2}>
                  2x
                </button>
              </td>
            </tr>
            <tr>
              <th>Seek</th>
              <td>
                <input
                  type="range"
                  min={0}
                  max={0.999999}
                  step="any"
                  value={state.played}
                  onMouseDown={handleSeekMouseDown}
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekMouseUp}
                />
              </td>
            </tr>
            <tr>
              <th>Volume</th>
              <td>
                <input type="range" min={0} max={1} step="any" value={state.volume} onChange={handleVolumeChange} />
              </td>
            </tr>
            <tr>
              <th>
                <label htmlFor="muted">Muted</label>
              </th>
              <td>
                <input id="muted" type="checkbox" checked={state.muted} onChange={handleToggleMuted} />
              </td>
            </tr>
            <tr>
              <th>
                <label htmlFor="loop">Loop</label>
              </th>
              <td>
                <input id="loop" type="checkbox" checked={state.loop} onChange={handleToggleLoop} />
              </td>
            </tr>
            <tr>
              <th>Played</th>
              <td>
                <progress max={1} value={state.played} />
              </td>
            </tr>
            <tr>
              <th>Loaded</th>
              <td>
                <progress max={1} value={state.loaded} />
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <section className="section">
        <h2>Files</h2>
        <table>
          <tbody>
            <tr>
              <th>Files</th>
              <td>
                {renderLoadButton(
                  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
                  'mp4',
                )}
                {renderLoadButton(
                  'https://test-videos.co.uk/vids/bigbuckbunny/webm/vp8/360/Big_Buck_Bunny_360_10s_1MB.webm',
                  'webm',
                )}
                {renderLoadButton('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'HLS (m3u8)')}
                <br />
                {renderLoadButton(
                  'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps_640x360_800k.mpd',
                  'DASH (mpd)',
                )}
              </td>
            </tr>
          </tbody>
        </table>
        <table>
          <tbody>
            <tr>
              <th>File URL</th>
              <td>
                <input ref={urlFileInputRef} type="text" placeholder="Custom File URL" />
                <button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      url: urlFileInputRef?.current !== null ? urlFileInputRef.current.value : null,
                    }))
                  }
                >
                  Load
                </button>
              </td>
            </tr>
            <tr>
              <th>VTT File</th>
              <td>
                <input ref={urlVTTInputRef} type="text" placeholder="Custom Sprite VTT File URL" />
                <button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      url: urlVTTInputRef?.current !== null ? urlVTTInputRef.current.value : null,
                    }))
                  }
                >
                  Load
                </button>
              </td>
            </tr>
            <tr>
              <th>Poster</th>
              <td>
                <input ref={urlPosterInputRef} type="text" placeholder="Custom Poster URL" />
                <button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      poster: urlPosterInputRef?.current !== null ? urlPosterInputRef.current.value : null,
                    }))
                  }
                >
                  Load
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2>State</h2>

        <table>
          <tbody>
            <tr>
              <th>url</th>
              <td className={!state.urlFile ? 'faded' : ''}>{state.urlFile}</td>
            </tr>
            <tr>
              <th>playing</th>
              <td>{state.playing ? 'true' : 'false'}</td>
            </tr>
            <tr>
              <th>volume</th>
              <td>{state.volume.toFixed(3)}</td>
            </tr>
            <tr>
              <th>speed</th>
              <td>{state.playbackRate}</td>
            </tr>
            <tr>
              <th>played</th>
              <td>{state.played.toFixed(3)}</td>
            </tr>
            <tr>
              <th>loaded</th>
              <td>{state.loaded.toFixed(3)}</td>
            </tr>
            <tr>
              <th>duration</th>
              <td>
                <Duration seconds={state.duration} />
              </td>
            </tr>
            <tr>
              <th>elapsed</th>
              <td>
                <Duration seconds={state.duration * state.played} />
              </td>
            </tr>
            <tr>
              <th>remaining</th>
              <td>
                <Duration seconds={state.duration * (1 - state.played)} />
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <footer className="footer">
        Version <strong>{version}</strong>
        {SEPARATOR}
        <a href="https://github.com/playerstack/reactjs-video">GitHub</a>
        {SEPARATOR}
        <a href="https://www.npmjs.com/package/@playerstack/reactjs-video">npm</a>
      </footer>
    </div>
  );
};

export default App;
