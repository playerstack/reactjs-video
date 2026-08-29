import { PART_NAME } from '@compound/parts/partName';

/**
 * PlayButton marker -> `playerstack-play-button`. Its presence as a child of
 * <ControlBar> adds the 'PlayButton' part to the manifest; the skin layout renders
 * the real element with the skin-bundle wiring. Declarative marker: returns null,
 * no DOM, no state, no effects, no business hooks (A8b).
 */
export function PlayButton() {
  return null;
}

PlayButton[PART_NAME] = 'PlayButton';
PlayButton.displayName = 'PlayButton';
PlayButton.propTypes = {};
