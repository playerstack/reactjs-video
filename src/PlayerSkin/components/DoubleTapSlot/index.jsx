import React from 'react';
import PropTypes from 'prop-types';

import { PlayerstackDoubleTap } from '@adapter/elements';

/**
 * `DoubleTapSlot` renders the double-tap skip zones over the stage. Markup lives in Core's
 * `playerstack-double-tap` element; the skin supplies i18n `language` and the seek handler.
 * Rendered only when `!adPresent` — the skip zones are disabled whenever an ad is present so
 * its banner/skip stay clickable even while paused, before the ad starts playing.
 *
 * Presentational only: no state, no effects, no callbacks.
 */
const DoubleTapSlot = ({ adPresent, language, onSeekRequest }) => {
  if (adPresent) return null;

  return <PlayerstackDoubleTap language={language} onSeekRequest={onSeekRequest} />;
};

DoubleTapSlot.propTypes = {
  adPresent: PropTypes.bool,
  language: PropTypes.string,
  onSeekRequest: PropTypes.func,
};

export default DoubleTapSlot;
