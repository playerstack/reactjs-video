import PropTypes from 'prop-types';

import { mobileSettingsGearIcon } from '@playerstack/core/icons/mobile';
import { castIcon, captionsIcon, captionsActiveIcon } from '@playerstack/core/icons';

import { PlayerstackIcon } from '@adapter/elements';

/**
 * `MobileTopBar` is the mobile top-right cluster (parity with the monolith's
 * `.playerstack-mobile-top-bar`): a captions quick-toggle + a cast (transmit) button + a
 * settings gear that opens the full-surface panel.
 *
 * The gear is hidden when there is nothing to configure (parity: original `hideSettings` when
 * no qualities/captions during ad/live) — the orchestrator supplies the computed `hideSettings`.
 * The cast button shows whenever casting is supported and not during an ad (parity with the
 * original `showCast`, supplied by the orchestrator). The captions toggle shows whenever tracks
 * exist (`hasCaptions`).
 *
 * The WHOLE bar renders only when ANY of its buttons will show (captions toggle, cast, or gear):
 * when the gear is hidden AND cast is not shown AND there are no captions, the bar is `null`
 * (parity with the monolith's whole-bar visibility rule, preserved verbatim).
 *
 * Presentational only: no state, no effects, no callbacks of its own.
 */
export default function MobileTopBar({
  hasCaptions,
  showCast,
  hideSettings,
  activeCaption,
  castState,
  onCaptionToggle,
  onCastClick,
  onOpenSettings,
}) {
  // The bar renders when ANY of its buttons will show (captions toggle, cast, or gear).
  if (hideSettings && !showCast && !hasCaptions) {
    return null;
  }

  return (
    <div className="playerstack-mobile-top-bar" part="mobile-top-bar">
      {hasCaptions && (
        <button type="button" aria-label="Captions" onClick={onCaptionToggle}>
          <PlayerstackIcon icon={activeCaption ? captionsActiveIcon : captionsIcon} width="24" height="24" />
        </button>
      )}
      {showCast && (
        <button
          type="button"
          aria-label="Google Cast"
          onClick={onCastClick}
          style={{ opacity: castState === 'connected' ? 1 : 0.7 }}
        >
          <PlayerstackIcon icon={castIcon} width="22" height="22" />
        </button>
      )}
      {!hideSettings && (
        <button type="button" aria-label="Settings" onClick={onOpenSettings}>
          <PlayerstackIcon icon={mobileSettingsGearIcon} width="24" height="24" />
        </button>
      )}
    </div>
  );
}

MobileTopBar.propTypes = {
  hasCaptions: PropTypes.bool,
  showCast: PropTypes.bool,
  hideSettings: PropTypes.bool,
  activeCaption: PropTypes.string,
  castState: PropTypes.string,
  onCaptionToggle: PropTypes.func,
  onCastClick: PropTypes.func,
  onOpenSettings: PropTypes.func,
};
