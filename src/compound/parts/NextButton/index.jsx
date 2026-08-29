import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * NextButton marker — its presence (together with or without `PrevButton`) drives
 * `showNavButtons` on the engine and renders `playerstack-nav-buttons` with the next handler.
 * Declarative marker: returns null, no DOM, no state, no effects (A8b).
 */
function NextButton() {
  return null;
}

NextButton[PART_NAME] = 'NextButton';
NextButton.displayName = 'NextButton';
NextButton.propTypes = {
  onClick: PropTypes.func,
};

export { NextButton };
