import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * Source marker (engine-only input, renders no UI). Owns the multi-quality `sources`
 * and the `fullHDQualityBreak` threshold; Player lifts them to the media engine via
 * `collectConfig`/`deriveEngineProps`. Declarative marker: returns null, no DOM,
 * no state, no effects (A8b).
 */
export function Source() {
  return null;
}

Source[PART_NAME] = 'Source';
Source.displayName = 'Source';
Source.propTypes = {
  sources: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      resolution: PropTypes.number.isRequired,
    }).isRequired,
  ),
  fullHDQualityBreak: PropTypes.number,
};
