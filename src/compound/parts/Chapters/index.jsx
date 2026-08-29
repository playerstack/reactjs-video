import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * Chapters marker. Not a catalog slot on its own — its `chapters` content rides on the
 * Timeline (`playerstack-chapters` + time-slider) — but it is exposed as a composable so
 * authors can declare chapter segments. `collectConfig` normalizes `chapters` to
 * `config.chapters`. Declarative marker: returns null, no DOM, no state, no effects (A8b).
 */
export function Chapters() {
  return null;
}

Chapters[PART_NAME] = 'Chapters';
Chapters.displayName = 'Chapters';
Chapters.propTypes = {
  chapters: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      startTime: PropTypes.number.isRequired,
    }),
  ),
};
