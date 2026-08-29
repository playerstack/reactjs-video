import PropTypes from 'prop-types';

import { previousTrackIcon, nextTrackIcon } from '@playerstack/web-core/icons';

import { PlayerstackPlayState, PlayerstackIcon } from '@adapter/elements';

/**
 * `MobileCenterControls` is the mobile centered transport cluster (parity with the monolith's
 * `.playerstack-mobile-center-controls`): Prev · Play/Pause · Next.
 *
 * Each nav button is rendered individually so `PrevButton` and `NextButton` can be composed
 * independently. The canonical order is: Prev(50) · Play(center) · Next(65).
 *
 * Presentational only: no state, no effects, no callbacks of its own.
 */
export default function MobileCenterControls({
  parts,
  showPrev,
  showNext,
  onPrevRequest,
  onNextRequest,
  onPlayRequest,
  onPauseRequest,
}) {
  return (
    <div className="playerstack-mobile-center-controls" part="mobile-center-controls">
      {parts.has('PrevButton') && showPrev && (
        <button type="button" part="nav-prev" aria-label="Previous" onClick={onPrevRequest}>
          <PlayerstackIcon icon={previousTrackIcon} width={48} height={48} />
        </button>
      )}
      <PlayerstackPlayState onPlayRequest={onPlayRequest} onPauseRequest={onPauseRequest} />
      {parts.has('NextButton') && showNext && (
        <button type="button" part="nav-next" aria-label="Next" onClick={onNextRequest}>
          <PlayerstackIcon icon={nextTrackIcon} width={48} height={48} />
        </button>
      )}
    </div>
  );
}

MobileCenterControls.propTypes = {
  // Composition presence set from the manifest (`skin.composition.parts`); O(1) `Set.has` gating.
  parts: PropTypes.instanceOf(Set).isRequired,
  // Per-button nav visibility: true only when the button ∈ composition, has an `onClick`, and no
  // ad is actively playing.
  showPrev: PropTypes.bool,
  showNext: PropTypes.bool,
  onPrevRequest: PropTypes.func,
  onNextRequest: PropTypes.func,
  onPlayRequest: PropTypes.func,
  onPauseRequest: PropTypes.func,
};
