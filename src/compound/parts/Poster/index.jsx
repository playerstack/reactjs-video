import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * Poster marker. Owns the poster image content prop; `collectConfig` normalizes it to
 * `config.poster` and the skin layout renders the `.playerstack-poster` div.
 * Declarative marker: returns null, no DOM, no state, no effects (A8b).
 */
export function Poster() {
  return null;
}

Poster[PART_NAME] = 'Poster';
Poster.displayName = 'Poster';
Poster.propTypes = {
  src: PropTypes.string,
  poster: PropTypes.string,
};
