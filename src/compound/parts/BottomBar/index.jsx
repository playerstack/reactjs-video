import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * BottomBar container marker (replaces the former ControlBar). Groups which controls appear
 * in the horizontal bottom bar; the resolver descends exactly one level into its children to
 * register 'PlayButton', 'Volume', etc. The real `.playerstack-controls` bar (with its
 * left/right clusters) is rendered by the skin layout. Declarative marker: returns null,
 * no DOM, no state, no effects (A8b).
 */
export function BottomBar() {
  return null;
}

BottomBar[PART_NAME] = 'BottomBar';
// Container flag: the resolver treats this part as a container and descends one level
// into its children (mirrors `container: true` for 'BottomBar' in COMPOSABLE_SLOTS).
BottomBar.container = true;
BottomBar.displayName = 'BottomBar';
BottomBar.propTypes = {
  children: PropTypes.node,
};
