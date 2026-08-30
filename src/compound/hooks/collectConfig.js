/**
 * collectConfig — pure content-prop collector for the compound API.
 *
 * Extracts the "content" props of a single composable part and writes them into the
 * shared `config` accumulator under the EXACT prop names the internal engine expects
 * (see `src/MediaPlayer/props.types.js`): `sources`, `fullHDQualityBreak`, `spriteVTTFile`,
 * `bufferMode`, `chapters`, `heatmapData`, `captions`, `poster`, `title`, `onPrevious`
 * and `onNext`. Normalizing to those names lets `deriveEngineProps` overlay `config` onto
 * the engine props with no further renaming.
 *
 * Contract: this is a pure, deterministic transformation. Its ONLY documented side effect
 * is writing into the passed `config` accumulator (an out-param, like a reduce accumulator);
 * it never mutates `props`, never touches the DOM, and never imports React. The resolver
 * calls it as `collectConfig(name, child.props, config)`.
 */

/**
 * Write a normalized key only when the resolved value is actually provided.
 *
 * We skip both `undefined` and `null` (via `!= null`) so that an absent content prop never
 * clobbers a real engine value downstream: `deriveEngineProps` overlays every key present in
 * `config`, so writing an `undefined`/`null` here would erase the engine's own default.
 */
function assignIfPresent(config, key, value) {
  if (value != null) {
    config[key] = value;
  }
}

export function collectConfig(name, props, config) {
  // A part with no props contributes nothing. Valid React elements always carry a props
  // object, but guarding keeps this helper safe to call directly (e.g. from its spec).
  if (props == null) {
    return config;
  }

  switch (name) {
    case 'Title': {
      // Title's content is its `children` text. Per Req 10.4/10.5 a title is meaningful only
      // when it is non-empty text: skip null/undefined and, for strings, whitespace-only
      // content. Non-string nodes (e.g. a number) count as present. The author's raw value is
      // kept as-is — trim is used only to decide emptiness, never to rewrite the content.
      const text = props.children;
      const isEmptyString = typeof text === 'string' && text.trim() === '';
      if (text != null && !isEmptyString) {
        config.title = text;
      }
      break;
    }
    case 'Poster':
      // `<Poster src>` is the idiomatic spelling; also accept the downstream `poster` name.
      assignIfPresent(config, 'poster', props.src ?? props.poster);
      break;
    case 'Captions':
      // `<Captions tracks>` is idiomatic; also accept the downstream `captions` name.
      assignIfPresent(config, 'captions', props.tracks ?? props.captions);
      break;
    case 'Source':
      assignIfPresent(config, 'sources', props.sources);
      assignIfPresent(config, 'fullHDQualityBreak', props.fullHDQualityBreak);
      break;
    case 'Timeline':
      assignIfPresent(config, 'spriteVTTFile', props.spriteVTTFile);
      assignIfPresent(config, 'bufferMode', props.bufferMode);
      break;
    case 'Chapters':
      assignIfPresent(config, 'chapters', props.chapters);
      break;
    case 'Heatmap':
      assignIfPresent(config, 'heatmapData', props.heatmapData);
      break;
    case 'PrevButton':
      assignIfPresent(config, 'onPrevious', props.onClick);
      break;
    case 'NextButton':
      assignIfPresent(config, 'onNext', props.onClick);
      break;
    case 'Volume':
      // `<Volume orientation="vertical">` forces the vertical (open-upward) slider anywhere it is
      // placed — not just inside a sidebar. Collected so the layout can hand it to the element's
      // `orientation` attribute; absent → the layout's per-container default applies.
      assignIfPresent(config, 'volumeOrientation', props.orientation);
      break;
    default:
      // Parts without content props (PlayButton, PlayOverlay, Fullscreen, Settings, Cast,
      // ControlBar, Captions.Toggle, …) contribute nothing to `config`.
      break;
  }

  return config;
}
