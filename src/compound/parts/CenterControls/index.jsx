import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * CenterControls container marker (Req 15.2) — mobile-only. Groups which controls appear in the
 * centered prev·play·next cluster over the video (mobile has this zone; desktop has no
 * equivalent). Valid only inside `<MobileUI>`; the resolver descends one level into its children
 * and the mobile layout maps them to `[part='mobile-center-controls']`. Declarative marker:
 * returns null, no DOM, no state, no effects (A8b).
 */
export function CenterControls() {
  return null;
}

CenterControls[PART_NAME] = 'CenterControls';
// Container flag: the resolver treats this part as a container and descends one level into its
// children (mirrors `container: true` for 'CenterControls' in COMPOSABLE_SLOTS).
CenterControls.container = true;
CenterControls.displayName = 'CenterControls';
CenterControls.propTypes = {
  children: PropTypes.node,
};
