<h1 align='center'>
  Player Stack
</h1>

<p align='center'>
  <a href='https://www.npmjs.com/package/@playerstack/reactjs'><img src='https://img.shields.io/npm/v/@playerstack/reactjs.svg' alt='Latest npm version'></a>
  <a href='https://codecov.io/gh/playerstack/reactjs'><img src='https://img.shields.io/codecov/c/github/playerstack/reactjs.svg' alt='Test Coverage'></a>
  <a href='LICENSE.md'><img src='https://img.shields.io/badge/license-PolyForm%20Shield%201.0.0-blue.svg' alt='License'></a>
  <a href='https://www.patreon.com/soyvillareal'><img src='https://img.shields.io/badge/sponsor-patreon-fa6854.svg' alt='Become a sponsor on Patreon'></a>
</p>

<p align='center'>
  A React component for playing HLS, FLV, DASH and native media files.
</p>

> **Note:** This package was previously published as [`reactjs-media-player`](https://www.npmjs.com/package/reactjs-media-player). That package is now deprecated — please use `@playerstack/reactjs` instead.

---

### ✨ The future of Player Stack
Player Stack is maintained [by me](https://soyvillareal.com). I'm committed to improving video tools for developers, but anyone who wants to contribute is welcome.

Player Stack is and will remain **source-available** under the [PolyForm Shield](LICENSE.md) license — free to use, including commercially, and open to contributions, but not for building competing products. Thanks to all community members for their continued support.

### Usage

```bash
npm install @playerstack/reactjs # or yarn add @playerstack/reactjs
```

```jsx
import React from 'react';
import PlayerStack from '@playerstack/reactjs';

// Render a HLS video player
<PlayerStack url="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" />;
```

If your build system supports `import()` statements, use `@playerstack/reactjs/lazy` to lazy load the appropriate player for the `url` you pass in. This adds several `Player Stack` chunks to your output, but reduces your main bundle size.

```jsx
import React from 'react';
import PlayerStackLazy from '@playerstack/reactjs/lazy';

// Lazy load the player
<PlayerStackLazy url="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" />;
```

Demo page: [`https://playerstack.github.io/reactjs`](https://playerstack.github.io/reactjs)

The component parses a URL and loads in the appropriate markup and external SDKs to play media from [various sources](#supported-media). [Props](#props) can be passed in to control playback and react to events such as buffering or media ending. See [the demo source](https://github.com/playerstack/reactjs/blob/master/examples/react/src/App.jsx) for a full example.

For platforms without direct use of `npm` modules, a minified version of `Player Stack` is located in `dist` after installing. To generate this file yourself, checkout the repo and run `npm run build:dist`.

#### Autoplay

As of Chrome 66, [videos must be `muted` in order to play automatically](https://www.theverge.com/2018/3/22/17150870/google-chrome-autoplay-videos-sound-mute-update). Some players, like Facebook, cannot be unmuted until the user interacts with the video, so you may want to enable `controls` to allow users to unmute videos themselves. Please set `muted={true}`.

### Props

Prop | Description | Default
---- | ----------- | -------
`url` | The url of a video to play<br/>&nbsp; ◦ &nbsp;Can be an [file](#supported-media) or [`MediaStream`](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) object
`playing` | Set to `true` or `false` to pause or play the media | `false`
`loop` | Set to `true` or `false` to loop the media | `false`
`volume` | Set the volume of the player, between `0` and `1`<br/>&nbsp; ◦ &nbsp;`null` uses default volume on all players | `null`
`muted` | Mutes the player<br/>&nbsp; ◦ &nbsp;Only works if `volume` is set | `false`
`playbackRate` | Set the playback rate of the player | `1`
`width` | Set the width of the player | `640px`
`height` | Set the height of the player | `360px`
`style` | Add [inline styles](https://facebook.github.io/react/tips/inline-styles.html) to the root element | `{}`
`progressInterval` | The time between `onProgress` callbacks, in milliseconds | `1000`
`playsinline` | Applies the `playsinline` attribute where supported | `false`
`pip` | Set to `true` or `false` to enable or disable [picture-in-picture mode](https://developers.google.com/web/updates/2018/10/watch-video-using-picture-in-picture)<br/>&nbsp; ◦ &nbsp;Only available when playing file URLs in [certain browsers](https://caniuse.com/#feat=picture-in-picture) | `false`
`stopOnUnmount` | If you are using `pip` you may want to use `stopOnUnmount={false}` to continue playing in picture-in-picture mode even after PlayerStack unmounts | `true`
`fallback` | Element or component to use as a fallback if you are using lazy loading | `null`
`wrapper` | Element or component to use as the container element | `div`
`config` | Override options for the various players, see [config prop](#config-prop)
`sources` | Set array of objects with information about the files to play
`spriteVTTFile` | Set the sprite file to display images on a timeline
`chapters` | Array of `{ title, startTime }` objects to segment the timeline into chapters
`fullHDQualityBreak` | Set the resolution to start from to indicate that a resolution is HD

#### Callback props

Callback props take a function that gets fired on various player events:

Prop | Description
---- | -----------
`onReady` | Called when media is loaded and ready to play. If `playing` is set to `true`, media will play immediately
`onStart` | Called when media starts playing
`onPlay` | Called when media starts or resumes playing after pausing or buffering
`onProgress` | Callback containing `played` and `loaded` progress as a fraction, and `playedSeconds` and `loadedSeconds` in seconds<br />&nbsp; ◦ &nbsp;eg `{ played: 0.12, playedSeconds: 11.3, loaded: 0.34, loadedSeconds: 16.7 }`
`onDuration` | Callback containing duration of the media, in seconds
`onPause` | Called when media is paused
`onBuffer` | Called when media starts buffering
`onBufferEnd` | Called when media has finished buffering
`onSeek` | Called when media seeks with `seconds` parameter
`onPlayBackRateChange` | Called when playback rate of the player changed
`onPlayBackQualityChange` | Called when playback quality of the player changed
`onEnded` | Called when media finishes playing<br />&nbsp; ◦ &nbsp;Does not fire when `loop` is set to `true`
`onError` | Called when an error occurs whilst attempting to play media
`onEnablePIP` | Called when picture-in-picture mode is enabled
`onDisablePIP` | Called when picture-in-picture mode is disabled

#### Config prop

There is a single `config` prop to override settings of player:

```jsx
<PlayerStack
  url={url}
  config={{
    forceHLS: true,
    hlsOptions: {
      enableWorker: true,
    },
  }}
/>
```

### Methods

#### Static Methods

Method | Description
------ | -----------
`PlayerStack.canPlay(url)` | Determine if a URL can be played.
`PlayerStack.canEnablePiP(url)` | Determine if a URL can be played in picture-in-picture mode

#### Instance Methods

Use [`ref`](https://facebook.github.io/react/docs/refs-and-the-dom.html) to call instance methods on the player.

Method | Description
------ | -----------
`seekTo(amount, type)` | Seek to the given number of seconds, or fraction if `amount` is between `0` and `1`
`getCurrentTime()` | Returns the number of seconds that have been played
`getSecondsLoaded()` | Returns the number of seconds that have been loaded
`getDuration()` | Returns the duration (in seconds) of the currently playing media
`getInternalPlayer()` | Returns the internal player of whatever is currently playing

### Advanced Usage

#### Responsive player

```jsx
<div className="player-wrapper">
  <PlayerStack
    className="playerstack"
    url="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    width="100%"
    height="100%"
  />
</div>
```

```css
.player-wrapper {
  position: relative;
  padding-top: 56.25%;
}

.playerstack {
  position: absolute;
  top: 0;
  left: 0;
}
```

#### Multiple Sources and Tracks

```jsx
<PlayerStack
  playing
  fullHDQualityBreak={720}
  spriteVTTFile="foo.vtt"
  chapters={[
    { title: 'Intro', startTime: 0 },
    { title: 'Main Content', startTime: 60 },
    { title: 'Credits', startTime: 300 },
  ]}
  sources={[
    { src: 'foo_1080.m3u8', resolution: 1080 },
    { src: 'foo_720.m3u8', resolution: 720 },
    { src: 'foo_480.m3u8', resolution: 480 },
    { src: 'foo_360.m3u8', resolution: 360 },
  ]}
/>
```

### Supported media

[Supported file types](https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats) are playing using [`<video>`](https://developer.mozilla.org/en/docs/Web/HTML/Element/video) elements

- HLS streams are played using [`hls.js`](https://github.com/video-dev/hls.js)
- DASH streams are played using [`dash.js`](https://github.com/Dash-Industry-Forum/dash.js)
- FLV streams are played using [`flv.js`](https://github.com/bilibili/flv.js)

### Contributing

See the [contribution guidelines](https://github.com/playerstack/reactjs/blob/master/CONTRIBUTING.md) before creating a pull request.

### Thanks

- Thanks to anyone who has [contributed](https://github.com/playerstack/reactjs/graphs/contributors).
- Big thanks to my [Patreon](https://patreon.com/soyvillareal) supporters!

### License

[PolyForm Shield 1.0.0](LICENSE.md) © 2026 Oscar Garcés (PlayerStack)

Player Stack is **source-available**, not open source. You are free to use it — including commercially — and to fork, modify, and contribute. You may **not** use it to build or provide a product that competes with Player Stack. See [LICENSE.md](LICENSE.md) for the full terms.
