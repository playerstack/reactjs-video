import PropTypes from 'prop-types';

import {
  previousTrackIcon,
  nextTrackIcon,
  castIcon,
  captionsIcon,
  captionsActiveIcon,
} from '@playerstack/web-core/icons';

import {
  PlayerstackPlayButton,
  PlayerstackVolume,
  PlayerstackPlayTime,
  PlayerstackTitle,
  PlayerstackSettings,
  PlayerstackFullscreenButton,
  PlayerstackIcon,
} from '@adapter/elements';

// Stable empty-set default so `keepVisibleParts` is always a Set (no per-render allocation).
const EMPTY_SET = new Set();

/**
 * `FlexibleControls` renders any subset of composable controls in their canonical order.
 * Used by TopBar, SidebarLeft, and SidebarRight containers — each receives a `containerParts`
 * Set specifying which controls to render. Only parts present in BOTH the composition
 * (`skin.composition.parts`) and the container's declared children render.
 *
 * Each control is gated by `containerParts.has(name)` and renders its corresponding element.
 * The canonical order follows `COMPOSABLE_SLOTS.order` for the `control-bar-left` and
 * `control-bar-right` regions:
 *   PrevButton(50) → PlayButton(60) → NextButton(65) → Volume(70) → PlayTime(80) →
 *   Title(90) → CaptionsToggle(110) → Settings(120) → Cast(130) → Fullscreen(140)
 *
 * Presentational only: no state, no effects, no callbacks.
 */
const FlexibleControls = ({
  containerParts,
  // Req 17: parts explicitly marked `keepVisible` — reflected as `data-keep-visible` per element.
  keepVisibleParts = EMPTY_SET,
  // Volume slider axis for THIS container: `vertical` in sidebars (native vertical drag),
  // `horizontal` (default) in the top bar. Passed straight to `playerstack-volume`'s `orientation`.
  volumeOrientation = 'horizontal',
  // Handlers and state from the skin bundle (same as ControlBarLeft + ControlsExtra):
  title,
  showPrev,
  showNext,
  onPrevRequest,
  onNextRequest,
  onPlayRequest,
  onPauseRequest,
  onMuteRequest,
  onUnmuteRequest,
  onVolumeRequest,
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
  const has = (name) => containerParts.has(name);
  // Req 17: per-element `data-keep-visible` value (`''` to opt out of auto-hide, else undefined).
  const keep = (name) => (keepVisibleParts.has(name) ? '' : undefined);

  return (
    <>
      {has('PrevButton') && showPrev && (
        <button
          type="button"
          className="playerstack-prev-button"
          part="prev-button"
          aria-label="Previous"
          data-keep-visible={keep('PrevButton')}
          onClick={onPrevRequest}
        >
          <PlayerstackIcon icon={previousTrackIcon} width={36} height={36} />
        </button>
      )}
      {has('PlayButton') && (
        <PlayerstackPlayButton
          onPlayRequest={onPlayRequest}
          onPauseRequest={onPauseRequest}
          data-keep-visible={keep('PlayButton')}
        />
      )}
      {has('NextButton') && showNext && (
        <button
          type="button"
          className="playerstack-next-button"
          part="next-button"
          aria-label="Next"
          data-keep-visible={keep('NextButton')}
          onClick={onNextRequest}
        >
          <PlayerstackIcon icon={nextTrackIcon} width={36} height={36} />
        </button>
      )}
      {has('Volume') && (
        <PlayerstackVolume
          orientation={volumeOrientation}
          onMuteRequest={onMuteRequest}
          onUnmuteRequest={onUnmuteRequest}
          onVolumeRequest={onVolumeRequest}
          data-keep-visible={keep('Volume')}
        />
      )}
      {has('PlayTime') && <PlayerstackPlayTime live={!!live} liveDVR={false} data-keep-visible={keep('PlayTime')} />}
      {has('Title') && title && <PlayerstackTitle title={title} data-keep-visible={keep('Title')} />}
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
          onClick={onCastClick}
          style={{ opacity: castState === 'connected' ? 1 : 0.8 }}
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

FlexibleControls.propTypes = {
  containerParts: PropTypes.instanceOf(Set).isRequired,
  keepVisibleParts: PropTypes.instanceOf(Set),
  volumeOrientation: PropTypes.oneOf(['horizontal', 'vertical']),
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  showPrev: PropTypes.bool,
  showNext: PropTypes.bool,
  onPrevRequest: PropTypes.func,
  onNextRequest: PropTypes.func,
  onPlayRequest: PropTypes.func,
  onPauseRequest: PropTypes.func,
  onMuteRequest: PropTypes.func,
  onUnmuteRequest: PropTypes.func,
  onVolumeRequest: PropTypes.func,
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

export default FlexibleControls;
