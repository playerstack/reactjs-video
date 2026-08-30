import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * MobileUI per-mode wrapper marker (Req 15.1). Groups the MOBILE composition: its container
 * children (`TopBar`/`BottomBar`/`CenterControls`) describe where controls sit in the mobile
 * layout. The resolver scans its subtree into `manifest.mobile` (an extra descent scoped to the
 * mode wrappers) and only `MobileLayout` consumes that branch. Declarative marker: returns null,
 * no DOM, no state, no effects (A8b).
 */
export function MobileUI() {
  return null;
}

MobileUI[PART_NAME] = 'MobileUI';
// Container flag: the resolver treats this part as a container. Mode wrappers get a dedicated
// nested scan (they are NOT added to the shared `containers`); mirrors `container: true` for
// 'MobileUI' in COMPOSABLE_SLOTS.
MobileUI.container = true;
MobileUI.displayName = 'MobileUI';
MobileUI.propTypes = {
  children: PropTypes.node,
};
