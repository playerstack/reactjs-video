import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * Title marker -> `playerstack-title` (A2, added later). The title text is read from
 * `props.children` by `collectConfig` and normalized to `config.title`. Declarative
 * marker: returns null, no DOM, no state, no effects (A8b).
 */
export function Title() {
  return null;
}

Title[PART_NAME] = 'Title';
Title.displayName = 'Title';
Title.propTypes = {
  children: PropTypes.node,
};
