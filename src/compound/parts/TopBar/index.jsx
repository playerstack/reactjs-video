import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * TopBar container marker. Groups which controls appear in the horizontal top bar of the
 * player. The resolver descends exactly one level into its children. The layout renders a
 * `.playerstack-top-bar` div for these controls. Declarative marker: returns null, no DOM,
 * no state, no effects (A8b).
 */
export function TopBar() {
  return null;
}

TopBar[PART_NAME] = 'TopBar';
TopBar.container = true;
TopBar.displayName = 'TopBar';
TopBar.propTypes = {
  children: PropTypes.node,
};
