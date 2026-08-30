import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * DesktopUI per-mode wrapper marker (Req 15.1). Groups the DESKTOP composition: its container
 * children (`TopBar`/`BottomBar`/`SidebarLeft`/`SidebarRight`) describe where controls sit in the
 * desktop layout. The resolver scans its subtree into `manifest.desktop` (an extra descent scoped
 * to the mode wrappers) and only `DesktopLayout` consumes that branch. Declarative marker: returns
 * null, no DOM, no state, no effects (A8b).
 */
export function DesktopUI() {
  return null;
}

DesktopUI[PART_NAME] = 'DesktopUI';
// Container flag: the resolver treats this part as a container. Mode wrappers get a dedicated
// nested scan (they are NOT added to the shared `containers`); mirrors `container: true` for
// 'DesktopUI' in COMPOSABLE_SLOTS.
DesktopUI.container = true;
DesktopUI.displayName = 'DesktopUI';
DesktopUI.propTypes = {
  children: PropTypes.node,
};
