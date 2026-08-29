import { PART_NAME } from '@compound/parts/partName';

/**
 * PlayTime marker -> `playerstack-play-time` (the `00:00 / 10:29` read-out).
 * Declarative marker: returns null, no DOM, no state, no effects (A8b).
 */
export function PlayTime() {
  return null;
}

PlayTime[PART_NAME] = 'PlayTime';
PlayTime.displayName = 'PlayTime';
PlayTime.propTypes = {};
