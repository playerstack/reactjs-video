import React from 'react';
import PropTypes from 'prop-types';

import { PlayerstackLiveAd } from '@adapter/elements';

/**
 * `LiveAdOverlay` renders the live-stream ad break overlay (plays over the muted live stream).
 * Markup + phase machine live in Core's `playerstack-live-ad` element; the skin supplies the
 * stream adapter + trigger config. Rendered only when `live`.
 *
 * Presentational only: no state, no effects, no callbacks.
 */
const LiveAdOverlay = ({ live, adapter, trigger, language }) => {
  if (!live) return null;

  return <PlayerstackLiveAd adapter={adapter} trigger={trigger} language={language} />;
};

LiveAdOverlay.propTypes = {
  live: PropTypes.bool,
  adapter: PropTypes.object,
  trigger: PropTypes.object,
  language: PropTypes.string,
};

export default LiveAdOverlay;
