import PropTypes from 'prop-types';
import { PART_NAME } from '@compound/parts/partName';

/**
 * Caption track list shape. Mirrors the `captions` prop in
 * `src/MediaPlayer/props.types.js` so the composable declares the same content shape.
 */
const captionTracks = PropTypes.arrayOf(
  PropTypes.shape({
    src: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    language: PropTypes.string.isRequired,
    kind: PropTypes.string,
  }),
);

/**
 * Captions marker (overlay + track config owner) -> `playerstack-captions`. The tracks
 * feed the engine `<track>` list and the captions overlay/settings; `collectConfig`
 * normalizes them to `config.captions`. Declarative marker: returns null, no DOM,
 * no state, no effects (A8b).
 */
export function Captions() {
  return null;
}

Captions[PART_NAME] = 'Captions';
Captions.displayName = 'Captions';
Captions.propTypes = {
  tracks: captionTracks,
  captions: captionTracks,
};

/**
 * Captions.Toggle marker (the CC quick-toggle). Owned by `Captions` and exposed as a
 * static sub-composable. Maps to the skin's existing <button> in ControlsExtra
 * (A2 promotion candidate: playerstack-captions-toggle). Its catalog slot name is
 * `CaptionsToggle`. Declarative marker: returns null, no DOM, no state, no effects (A8b).
 */
function CaptionsToggle() {
  return null;
}

CaptionsToggle[PART_NAME] = 'CaptionsToggle';
CaptionsToggle.displayName = 'CaptionsToggle';
CaptionsToggle.propTypes = {};

// Attach as a static sub-composable: consumers use <Captions.Toggle />.
Captions.Toggle = CaptionsToggle;
