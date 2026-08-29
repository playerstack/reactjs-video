import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * Timeline marker -> `playerstack-time-slider`. Owns the scrub-preview sprite file and
 * the buffer-render mode; chapters/heatmap content ride alongside it on the timeline.
 * `collectConfig` normalizes these to `config.spriteVTTFile`/`config.bufferMode`.
 * Declarative marker: returns null, no DOM, no state, no effects (A8b).
 */
export function Timeline() {
  return null;
}

Timeline[PART_NAME] = 'Timeline';
Timeline.displayName = 'Timeline';
Timeline.propTypes = {
  spriteVTTFile: PropTypes.string,
  bufferMode: PropTypes.oneOf(['fragmented', 'current', 'classic']),
};
