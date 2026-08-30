import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * SidebarLeft container marker. Groups which controls appear in the vertical left sidebar
 * of the player. Accepts an `align` prop ('top' | 'center' | 'bottom', default 'center') to
 * control the vertical alignment of its children. The resolver descends exactly one level into
 * its children. Declarative marker: returns null, no DOM, no state, no effects (A8b).
 */
export function SidebarLeft() {
  return null;
}

SidebarLeft[PART_NAME] = 'SidebarLeft';
SidebarLeft.container = true;
SidebarLeft.displayName = 'SidebarLeft';
SidebarLeft.propTypes = {
  children: PropTypes.node,
  align: PropTypes.oneOf(['top', 'center', 'bottom']),
};
