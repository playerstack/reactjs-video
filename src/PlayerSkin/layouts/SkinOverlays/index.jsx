import PropTypes from 'prop-types';

import {
  PlayerstackPreventedTip,
  PlayerstackSpinner,
  PlayerstackPlayState,
  PlayerstackTopState,
} from '@adapter/elements';
import CaptionsOverlay from '@PlayerSkin/components/CaptionsOverlay';

/**
 * `SkinOverlays` groups the stage overlays shared by both the desktop and mobile layouts
 * (parity with the monolith's shared-overlay region): `PlayerstackPreventedTip`,
 * `PlayerstackSpinner`, `PlayerstackTopState`, and the `CaptionsOverlay` — plus
 * `PlayerstackPlayState`, which is emitted here ONLY on desktop.
 *
 * `includePlayState` preserves the exact PlayState placement parity between the two layouts:
 * on DESKTOP the play-state overlay is a shared stage overlay sitting right after the spinner
 * (`includePlayState = true`), whereas on MOBILE the play-state lives inside
 * `MobileCenterControls` instead, so it is NOT rendered here (`includePlayState = false`). The
 * flag is a render-arrangement switch, not logic.
 *
 * Element order matches the monolith exactly: PreventedTip → Spinner → [PlayState] → TopState →
 * CaptionsOverlay.
 *
 * Presentational only: no state, no effects, no callbacks of its own — every prop is supplied
 * by the orchestrator through the layouts.
 */
const SkinOverlays = ({
  includePlayState,
  language,
  hasResource,
  prevented,
  paused,
  muted,
  currentTime,
  onPreventedClick,
  onPlayRequest,
  onPauseRequest,
  captions,
  activeCaption,
  captionCues,
  captionStyle,
  onCaptionRequest,
}) => (
  <>
    <PlayerstackPreventedTip
      language={language}
      hasResource={!!hasResource}
      prevented={!!prevented}
      paused={!!paused}
      muted={!!muted}
      currentTime={currentTime ?? 0}
      onPreventedClick={onPreventedClick}
    />
    <PlayerstackSpinner />
    {includePlayState && <PlayerstackPlayState onPlayRequest={onPlayRequest} onPauseRequest={onPauseRequest} />}
    <PlayerstackTopState language={language} />
    <CaptionsOverlay
      captions={captions}
      activeCaption={activeCaption}
      captionCues={captionCues}
      captionStyle={captionStyle}
      onCaptionRequest={onCaptionRequest}
    />
  </>
);

SkinOverlays.propTypes = {
  includePlayState: PropTypes.bool,
  language: PropTypes.string,
  hasResource: PropTypes.bool,
  prevented: PropTypes.bool,
  paused: PropTypes.bool,
  muted: PropTypes.bool,
  currentTime: PropTypes.number,
  onPreventedClick: PropTypes.func,
  onPlayRequest: PropTypes.func,
  onPauseRequest: PropTypes.func,
  captions: PropTypes.array,
  activeCaption: PropTypes.string,
  captionCues: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  captionStyle: PropTypes.object,
  onCaptionRequest: PropTypes.func,
};

export default SkinOverlays;
