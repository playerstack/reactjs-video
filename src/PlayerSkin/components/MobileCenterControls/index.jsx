import PropTypes from 'prop-types';

import { PlayerstackNavButtons, PlayerstackPlayState } from '@adapter/elements';

/**
 * `MobileCenterControls` is the mobile centered transport cluster (parity with the monolith's
 * `.playerstack-mobile-center-controls`): Prev · Play/Pause · Next.
 *
 * The nav cluster shows when EITHER a prev/next handler is provided OR `showNavButtons` is set
 * (parity with the original MobileCenterControls `showPrevious = hasPrevious || showNavButtons`);
 * the orchestrator supplies the computed `showNav` (`showNavButtons || onPrevious || onNext`).
 *
 * `PlayerstackPlayState` sits in the mobile-center placement (parity with the monolith, where
 * the play-state overlay is nested inside the center controls on mobile rather than as a shared
 * stage overlay like on desktop).
 *
 * Presentational only: no state, no effects, no callbacks of its own.
 */
export default function MobileCenterControls({ showNav, onPrevRequest, onNextRequest, onPlayRequest, onPauseRequest }) {
  return (
    <div className="playerstack-mobile-center-controls" part="mobile-center-controls">
      {showNav && <PlayerstackNavButtons onPrevRequest={onPrevRequest} onNextRequest={onNextRequest} />}
      <PlayerstackPlayState onPlayRequest={onPlayRequest} onPauseRequest={onPauseRequest} />
    </div>
  );
}

MobileCenterControls.propTypes = {
  showNav: PropTypes.bool,
  onPrevRequest: PropTypes.func,
  onNextRequest: PropTypes.func,
  onPlayRequest: PropTypes.func,
  onPauseRequest: PropTypes.func,
};
