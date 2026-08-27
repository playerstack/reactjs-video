import React from 'react';
import PropTypes from 'prop-types';

import { PlayerstackAdOverlay } from '@adapter/elements';

/**
 * `AdOverlay` renders the ad overlay (banner/skip) over the stage. Markup lives in Core's
 * `playerstack-ad-overlay` element; the skin supplies the `ads` config, `poster`, i18n
 * `language`, and the skip/click handlers. Rendered only when `ads`.
 *
 * Presentational only: no state, no effects, no callbacks.
 */
const AdOverlay = ({ ads, poster, language, onAdSkip, onAdClick }) => {
  if (!ads) return null;

  return (
    <PlayerstackAdOverlay
      ads={ads}
      poster={poster || null}
      language={language}
      onAdSkip={onAdSkip}
      onAdClick={onAdClick}
    />
  );
};

AdOverlay.propTypes = {
  ads: PropTypes.object,
  poster: PropTypes.string,
  language: PropTypes.string,
  onAdSkip: PropTypes.func,
  onAdClick: PropTypes.func,
};

export default AdOverlay;
