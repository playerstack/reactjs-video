import React from 'react';
import PropTypes from 'prop-types';

import { PlayerstackCaptions } from '@adapter/elements';

/**
 * Captions overlay: mounted whenever tracks exist so caption selection requests flow,
 * and it paints the active cue text (self-hides via `data-active` when no cue). Fed the
 * PARSED cues of the active track (null when captions are off).
 *
 * Presentational only: no state, no effects, no callbacks. Mounted only when
 * `captions?.length`; `captionCues`/`captionStyle`/`onCaptionRequest` are supplied by the
 * orchestrator.
 */
const CaptionsOverlay = ({ captions, activeCaption, captionCues, captionStyle, onCaptionRequest }) => {
  if (!(captions && captions.length > 0)) {
    return null;
  }

  return (
    <PlayerstackCaptions
      captionsSrc={activeCaption ? captionCues : null}
      captionStyle={captionStyle}
      onCaptionRequest={onCaptionRequest}
    />
  );
};

CaptionsOverlay.propTypes = {
  captions: PropTypes.array,
  activeCaption: PropTypes.string,
  captionCues: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  captionStyle: PropTypes.object,
  onCaptionRequest: PropTypes.func,
};

export default CaptionsOverlay;
