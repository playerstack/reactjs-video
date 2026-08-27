import React from 'react';
import PropTypes from 'prop-types';

/**
 * Poster overlay (parity with the original StyledOverlayPoster): the cover image shown
 * before playback starts and after the video ends; fades out during playback.
 *
 * Presentational only — no hooks, no state. The `visible` flag is supplied by
 * `isPosterVisible` from the orchestrator; the `.playerstack-poster` div is rendered
 * only when a `poster` URL is provided.
 */
const PosterOverlay = ({ poster, visible }) => {
  if (!poster) {
    return null;
  }

  return <div className="playerstack-poster" data-visible={visible} style={{ backgroundImage: `url(${poster})` }} />;
};

PosterOverlay.propTypes = {
  poster: PropTypes.string,
  visible: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

export default PosterOverlay;
