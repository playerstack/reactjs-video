import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * PrevButton marker — its presence (together with or without `NextButton`) drives
 * `showNavButtons` on the engine and renders `playerstack-nav-buttons` with the prev handler.
 * Declarative marker: returns null, no DOM, no state, no effects (A8b).
 */
function PrevButton() {
  return null;
}

PrevButton[PART_NAME] = 'PrevButton';
PrevButton.displayName = 'PrevButton';
PrevButton.propTypes = {
  onClick: PropTypes.func,
};

export { PrevButton };
