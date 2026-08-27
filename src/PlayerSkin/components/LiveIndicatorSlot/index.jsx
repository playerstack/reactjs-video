import PropTypes from 'prop-types';

import { PlayerstackLiveIndicator } from '@adapter/elements';

/**
 * `LiveIndicatorSlot` renders Core's `playerstack-live-indicator` element, gated on `live`
 * (parity with the monolith's `{live && <PlayerstackLiveIndicator ... />}` in both the desktop
 * and mobile layouts). Presentational only: no state, effects, or callbacks of its own.
 *
 * The live badge "jump to live edge" seek-request is forwarded verbatim through `onSeekRequest`
 * (the orchestrator supplies the DVR-aware `handleLiveEdgeRequest`), and the DVR window is fed
 * through `dvrState`. Both props are passed through unchanged.
 */
export default function LiveIndicatorSlot({ live, pureLive, dvrState, language, onSeekRequest }) {
  if (!live) {
    return null;
  }

  return (
    <PlayerstackLiveIndicator
      pureLive={pureLive}
      dvrState={dvrState}
      language={language}
      onSeekRequest={onSeekRequest}
    />
  );
}

LiveIndicatorSlot.propTypes = {
  live: PropTypes.bool,
  pureLive: PropTypes.bool,
  dvrState: PropTypes.object,
  language: PropTypes.string,
  onSeekRequest: PropTypes.func,
};
