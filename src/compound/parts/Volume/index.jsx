import PropTypes from 'prop-types';

import { PART_NAME } from '@compound/parts/partName';

/**
 * Volume marker -> `playerstack-volume`. Its presence as a child of <ControlBar>
 * adds the 'Volume' part to the manifest; the skin layout renders the real element
 * with the skin-bundle wiring (state/handlers come from the bundle, not from here).
 * Declarative marker: returns null, no DOM, no state, no effects (A8b).
 */
export function Volume() {
  return null;
}

Volume[PART_NAME] = 'Volume';
Volume.displayName = 'Volume';
Volume.propTypes = {
  // `vertical` forces the open-upward vertical slider anywhere (default: horizontal in the bottom
  // bar, vertical in sidebars). Maps to the `playerstack-volume` element's `orientation` attribute.
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
};
