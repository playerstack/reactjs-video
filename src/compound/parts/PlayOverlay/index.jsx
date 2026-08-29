import { PART_NAME } from '@compound/parts/partName';

/**
 * Center Play overlay marker (the central red box) -> `playerstack-play-state`.
 * Its presence as a child of <Player> adds the 'PlayOverlay' part to the manifest;
 * the skin layout renders the real element. Declarative marker: returns null, no DOM,
 * no state, no effects, no business hooks (A8b).
 */
export function PlayOverlay() {
  return null;
}

PlayOverlay[PART_NAME] = 'PlayOverlay';
PlayOverlay.displayName = 'PlayOverlay';
PlayOverlay.propTypes = {};
