import { PART_NAME } from '@compound/parts/partName';

/**
 * Fullscreen marker -> `playerstack-fullscreen-button`. Declarative marker:
 * returns null, no DOM, no state, no effects, no business hooks (A8b).
 */
export function Fullscreen() {
  return null;
}

Fullscreen[PART_NAME] = 'Fullscreen';
Fullscreen.displayName = 'Fullscreen';
Fullscreen.propTypes = {};
