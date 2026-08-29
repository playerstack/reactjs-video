import { PART_NAME } from '@compound/parts/partName';

/**
 * Cast marker. Maps to the skin's existing <button> in the ControlsExtra cluster
 * (A2 promotion candidate: playerstack-cast-button), gated by `showCast`.
 * Declarative marker: returns null, no DOM, no state, no effects (A8b).
 */
export function Cast() {
  return null;
}

Cast[PART_NAME] = 'Cast';
Cast.displayName = 'Cast';
Cast.propTypes = {};
