import PropTypes from 'prop-types';

import { castIcon, captionsIcon, captionsActiveIcon } from '@playerstack/web-core/icons';

import { PlayerstackSettings, PlayerstackFullscreenButton, PlayerstackIcon } from '@adapter/elements';

// Stable empty-set default so `keepVisibleParts` is always a Set (no per-render allocation).
const EMPTY_SET = new Set();

/**
 * `ControlsExtra` is the desktop right control cluster (parity with the monolith's
 * `controlsExtra`: Captions → Settings → Cast → Fullscreen). The captions CC button is a QUICK
 * TOGGLE (not a menu): it turns captions on/off and highlights when active. Cast shows when
 * supported and not during an ad (gated by `showCast`). The caption OVERLAY (cues) is rendered
 * separately over the stage, not here.
 *
 * Presence gating (Req 8.3/8.4): each affordance renders IF AND ONLY IF its composable part ∈
 * `composition.parts` (O(1) `Set.has`) — `CaptionsToggle`/`Settings`/`Cast`/`Fullscreen`, all in
 * `DEFAULT_COMPOSITION`. Composition presence is combined with the existing runtime conditions
 * (caption tracks exist, casting supported) so a composed part still self-hides when its feature
 * is unavailable. DOM order follows the canonical `control-bar-right` order —
 * CaptionsToggle(110) → Settings(120) → Cast(130) → Fullscreen(140) — which the fixed JSX below
 * already matches (Req 8.5/1.8). `Cast`/`CaptionsToggle` remain skin `<button>`s (A2 promotion
 * candidates: `playerstack-cast-button` / `playerstack-captions-toggle`).
 *
 * Presentational only: no state, no effects, no callbacks. All gating flags, options and
 * handlers are supplied by the orchestrator.
 */
const ControlsExtra = ({
  parts,
  keepVisibleParts = EMPTY_SET,
  captions,
  activeCaption,
  fullscreen,
  onCaptionToggle,
  qualityOptions,
  captionStyle,
  language,
  adMode,
  live,
  showCast,
  castState,
  onCastClick,
  onRateRequest,
  onQualityRequest,
  onCaptionRequest,
  onCaptionStyleRequest,
  onEnterFullscreenRequest,
  onExitFullscreenRequest,
}) => {
  const has = (name) => parts.has(name);
  // Req 17: per-element `data-keep-visible` value (`''` to opt out of auto-hide, else undefined).
  const keep = (name) => (keepVisibleParts.has(name) ? '' : undefined);

  return (
    <>
      {has('CaptionsToggle') && captions && captions.length > 0 && (
        <button
          type="button"
          className="playerstack-captions-button"
          part="captions-button"
          aria-label="Captions"
          aria-pressed={activeCaption ? 'true' : 'false'}
          data-active={activeCaption ? 'true' : 'false'}
          data-keep-visible={keep('CaptionsToggle')}
          onClick={onCaptionToggle}
        >
          {/* CC glyph matches the other desktop control icons (parity with the original
            `CaptionsButton` -> `buildIconProps(fullscreen)`): 36x36 normally, 54x54 fullscreen. */}
          <PlayerstackIcon
            icon={activeCaption ? captionsActiveIcon : captionsIcon}
            width={fullscreen ? 54 : 36}
            height={fullscreen ? 54 : 36}
          />
        </button>
      )}
      {has('Settings') && (
        <PlayerstackSettings
          qualityOptions={qualityOptions}
          captions={captions && captions.length > 0 ? captions : null}
          activeCaption={activeCaption ?? null}
          captionStyle={captionStyle}
          i18n={language ? { language } : null}
          adMode={adMode}
          live={live}
          data-keep-visible={keep('Settings')}
          onRateRequest={onRateRequest}
          onQualityRequest={onQualityRequest}
          onCaptionRequest={onCaptionRequest}
          onCaptionStyleRequest={onCaptionStyleRequest}
        />
      )}
      {has('Cast') && showCast && (
        <button
          type="button"
          className="playerstack-cast-button"
          part="cast-button"
          aria-label="Google Cast"
          data-keep-visible={keep('Cast')}
          data-cast-state={castState}
          onClick={onCastClick}
        >
          <PlayerstackIcon icon={castIcon} width="20" height="20" />
        </button>
      )}
      {has('Fullscreen') && (
        <PlayerstackFullscreenButton
          onEnterFullscreenRequest={onEnterFullscreenRequest}
          onExitFullscreenRequest={onExitFullscreenRequest}
          data-keep-visible={keep('Fullscreen')}
        />
      )}
    </>
  );
};

ControlsExtra.propTypes = {
  // Composition presence set from the manifest (`skin.composition.parts`); O(1) `Set.has` gating.
  parts: PropTypes.instanceOf(Set).isRequired,
  // Req 17: parts explicitly marked `keepVisible` — reflected as `data-keep-visible` per element.
  keepVisibleParts: PropTypes.instanceOf(Set),
  captions: PropTypes.array,
  activeCaption: PropTypes.string,
  fullscreen: PropTypes.bool,
  onCaptionToggle: PropTypes.func,
  qualityOptions: PropTypes.array,
  captionStyle: PropTypes.object,
  language: PropTypes.string,
  adMode: PropTypes.bool,
  live: PropTypes.bool,
  showCast: PropTypes.bool,
  castState: PropTypes.string,
  onCastClick: PropTypes.func,
  onRateRequest: PropTypes.func,
  onQualityRequest: PropTypes.func,
  onCaptionRequest: PropTypes.func,
  onCaptionStyleRequest: PropTypes.func,
  onEnterFullscreenRequest: PropTypes.func,
  onExitFullscreenRequest: PropTypes.func,
};

export default ControlsExtra;
