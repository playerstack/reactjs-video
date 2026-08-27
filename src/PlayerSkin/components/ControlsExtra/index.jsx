import PropTypes from 'prop-types';

import { castIcon, captionsIcon, captionsActiveIcon } from '@playerstack/core/icons';

import { PlayerstackSettings, PlayerstackFullscreenButton, PlayerstackIcon } from '@adapter/elements';

/**
 * `ControlsExtra` is the desktop right control cluster (parity with the monolith's
 * `controlsExtra`: Captions → Settings → Cast → Fullscreen). The captions CC button is a QUICK
 * TOGGLE (not a menu): it turns captions on/off and highlights when active. Cast shows when
 * supported and not during an ad (gated by `showCast`). The caption OVERLAY (cues) is rendered
 * separately over the stage, not here.
 *
 * Presentational only: no state, no effects, no callbacks. All gating flags, options and
 * handlers are supplied by the orchestrator.
 */
const ControlsExtra = ({
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
}) => (
  <>
    {captions && captions.length > 0 && (
      <button
        type="button"
        className="playerstack-captions-button"
        part="captions-button"
        aria-label="Captions"
        aria-pressed={activeCaption ? 'true' : 'false'}
        data-active={activeCaption ? 'true' : 'false'}
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
    <PlayerstackSettings
      qualityOptions={qualityOptions}
      captions={captions && captions.length > 0 ? captions : null}
      activeCaption={activeCaption ?? null}
      captionStyle={captionStyle}
      i18n={language ? { language } : null}
      adMode={adMode}
      live={live}
      onRateRequest={onRateRequest}
      onQualityRequest={onQualityRequest}
      onCaptionRequest={onCaptionRequest}
      onCaptionStyleRequest={onCaptionStyleRequest}
    />
    {showCast && (
      <button
        type="button"
        className="playerstack-cast-button"
        part="cast-button"
        aria-label="Google Cast"
        onClick={onCastClick}
        style={{ opacity: castState === 'connected' ? 1 : 0.8 }}
      >
        <PlayerstackIcon icon={castIcon} width="20" height="20" />
      </button>
    )}
    <PlayerstackFullscreenButton
      onEnterFullscreenRequest={onEnterFullscreenRequest}
      onExitFullscreenRequest={onExitFullscreenRequest}
    />
  </>
);

ControlsExtra.propTypes = {
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
