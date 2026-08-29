/**
 * deriveEngineProps — pure translator from the composition manifest to the internal
 * engine's prop contract.
 *
 * `<Player>` keeps the "ephemeral" playback props (url, playing, ads, live flags, callbacks,
 * container attributes, …) while the "content" props migrate to their owning composable
 * (`<Source sources>`, `<Captions tracks>`, `<Title>…</Title>`, …). `collectConfig` already
 * normalized those content props into `manifest.config` under the EXACT names the engine
 * expects, so this function only has to:
 *   1. take the ephemeral props as the base (Req 6.4),
 *   2. overlay the content keys that `manifest.config` actually carries (Req 6.5/6.6), and
 *   3. derive `showNavButtons` from the presence of `PrevButton`/`NextButton` parts (Req 6.3).
 *
 * Contract: pure and deterministic. It clones before writing, so it never mutates `ephemeral`
 * nor `manifest`; it imports no React, touches no DOM, and reads nothing outside its inputs.
 * Feature-activation props (`ads`, `live`, `liveDVR`, `liveAd`, `prevented`, `pip`, callbacks)
 * are part of `ephemeral`, so cloning propagates them to the engine untouched (Req 9.3) — this
 * function never strips them.
 */

/**
 * The exact set of content keys a composable may migrate into `manifest.config`, expressed
 * with the downstream (engine) names produced by `collectConfig`. Keep this list in lockstep
 * with `collectConfig.js`. It is defined locally on purpose: this is skin-side normalization
 * data (which config keys overlay the engine props), NOT agnostic composition logic, so it
 * does not belong in — nor is it duplicated from — `@playerstack/web-core`.
 */
const CONTENT_KEYS = [
  'sources',
  'fullHDQualityBreak',
  'captions',
  'poster',
  'chapters',
  'heatmapData',
  'spriteVTTFile',
  'bufferMode',
  'title',
  'onPrevious',
  'onNext',
];

export function deriveEngineProps(ephemeral, manifest) {
  // Req 6.4: the ephemeral props received by <Player> are the base of the result. A shallow
  // clone is enough (we only add/replace top-level keys, never mutate nested values) and it
  // guarantees `ephemeral` is left untouched, keeping this function pure.
  const engineProps = { ...ephemeral };

  const { config, parts } = manifest;

  // Req 6.5 + 6.6: overlay ONLY content keys, and only those actually present in
  // `manifest.config`. Iterating CONTENT_KEYS (instead of Object.keys(config)) bounds the
  // overlay to the known content surface, so a stray non-content key in `config` can never
  // leak into the engine props. Because this overlay runs AFTER cloning `ephemeral`, a
  // migrated key that exists in both places resolves to the config value (config wins, 6.6).
  CONTENT_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      engineProps[key] = config[key];
    }
  });

  // Req 6.3: `showNavButtons` is ALWAYS derived from the presence of PrevButton/NextButton —
  // the old boolean prop is replaced by the composable's presence, never read from `ephemeral`.
  //
  // Reconciling Req 6.3 with Req 6.7 ("config empty ⇒ engine props identical to ephemeral"):
  // Req 6.7 constrains only the CONTENT-KEY OVERLAY above — when `manifest.config` is empty
  // that loop is a no-op, so no content key changes. Deriving `showNavButtons` is a separate,
  // orthogonal step from `manifest.parts` and always runs. This does not contradict 6.7 on the
  // default / no-children path: `DEFAULT_COMPOSITION` marks PrevButton/NextButton `inDefault: false`,
  // so neither is present there and `showNavButtons` resolves to the same harmless `false` default.
  // It only becomes `true` when the author explicitly composes `<PrevButton/>` or `<NextButton/>`,
  // which is necessarily a non-empty (custom) composition. Task 5.6's spec pins both readings.
  engineProps.showNavButtons = parts.has('PrevButton') || parts.has('NextButton');

  return engineProps;
}
