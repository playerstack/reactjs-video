import React from 'react';
import PropTypes from 'prop-types';

import { PlayerstackSpritePreview } from '@adapter/elements';

/**
 * `SpritePreviewSlot` renders Core's full-area `playerstack-sprite-preview` element (the
 * scrub thumbnail preview driven by the sprite VTT). Markup + frame selection live in Core;
 * the skin only supplies the sprite `adapter`, the `spriteVttFile`, the `duration`, and the
 * pre-computed `seekTime`/`visible` (Inventory 4.3). Rendered only when `spriteVTTFile`.
 *
 * In the monolith the element was fed `seekTime={scrubbing ? scrubTime : currentTime}` and
 * `visible={scrubbing || seeking}`; here the orchestrator supplies those already computed, so
 * this component forwards `seekTime`/`visible` verbatim.
 *
 * Presentational only: no state, no effects, no callbacks. The `spritePreviewRef` is forwarded
 * to the element's `ref` (the shared timelens/preview adapter reads `ref.current`).
 */
const SpritePreviewSlot = ({ spriteVTTFile, spritePreviewRef, adapter, duration, seekTime, visible }) => {
  if (!spriteVTTFile) {
    return null;
  }

  return (
    <PlayerstackSpritePreview
      ref={spritePreviewRef}
      adapter={adapter}
      spriteVttFile={spriteVTTFile}
      duration={duration}
      seekTime={seekTime}
      visible={visible}
    />
  );
};

SpritePreviewSlot.propTypes = {
  spriteVTTFile: PropTypes.string,
  spritePreviewRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
  adapter: PropTypes.object,
  duration: PropTypes.number,
  seekTime: PropTypes.number,
  visible: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

export default SpritePreviewSlot;
