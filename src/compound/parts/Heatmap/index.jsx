import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * Heatmap marker. Not a catalog slot on its own — its `heatmapData` content rides on the
 * Timeline (`playerstack-heatmap` + time-slider) — but it is exposed as a composable.
 * `collectConfig` normalizes `heatmapData` to `config.heatmapData`. Declarative marker:
 * returns null, no DOM, no state, no effects (A8b).
 */
export function Heatmap() {
  return null;
}

Heatmap[PART_NAME] = 'Heatmap';
Heatmap.displayName = 'Heatmap';
Heatmap.propTypes = {
  heatmapData: PropTypes.arrayOf(
    PropTypes.shape({
      startTime: PropTypes.number.isRequired,
      endTime: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired,
    }),
  ),
};
