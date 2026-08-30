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
const EMPTY_SET = new Set();

export default function MobileCenterControls({
  parts,
  keepVisible,
  keepVisibleParts = EMPTY_SET,
  showPrev,
  showNext,
  onPrevRequest,
  onNextRequest,
  onPlayRequest,
  onPauseRequest,
}) {
  // Req 17: per-element `data-keep-visible` value (`''` opts out of auto-hide, else undefined).
  const keep = (name) => (keepVisibleParts.has(name) ? '' : undefined);
  return (
    <div
      className="playerstack-mobile-center-controls"
      part="mobile-center-controls"
      data-keep-visible={keepVisible ? '' : undefined}
    >
      {parts.has('PrevButton') && showPrev && (
        <button
          type="button"
          part="nav-prev"
          aria-label="Previous"
          data-keep-visible={keep('PrevButton')}
          onClick={onPrevRequest}
        >
          <PlayerstackIcon icon={previousTrackIcon} width={48} height={48} />
        </button>
      )}
      <PlayerstackPlayState
        onPlayRequest={onPlayRequest}
        onPauseRequest={onPauseRequest}
        data-keep-visible={keep('PlayButton')}
      />
      {parts.has('NextButton') && showNext && (
        <button
          type="button"
          part="nav-next"
          aria-label="Next"
          data-keep-visible={keep('NextButton')}
          onClick={onNextRequest}
        >
          <PlayerstackIcon icon={nextTrackIcon} width={48} height={48} />
        </button>
      )}
    </div>
  );
}

MobileCenterControls.propTypes = {
  // Composition presence set from the manifest (`skin.composition.parts`); O(1) `Set.has` gating.
  parts: PropTypes.instanceOf(Set).isRequired,
  // Req 17: keep the whole center cluster visible while playing.
  keepVisible: PropTypes.bool,
  // Req 17: parts opted out of auto-hide — reflected per element.
  keepVisibleParts: PropTypes.instanceOf(Set),
  // Per-button nav visibility: true only when the button ∈ composition, has an `onClick`, and no
  // ad is actively playing.
  showPrev: PropTypes.bool,
  showNext: PropTypes.bool,
  onPrevRequest: PropTypes.func,
  onNextRequest: PropTypes.func,
  onPlayRequest: PropTypes.func,
  onPauseRequest: PropTypes.func,
};
