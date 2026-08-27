import PropTypes from 'prop-types';

/**
 * `ControlBar` is the desktop bottom control bar container (parity with the monolith's
 * `.playerstack-controls` wrapper). In the light-DOM model the controls that form the
 * horizontal bottom bar are wrapped in a single `.playerstack-controls` container so Core's
 * Style_Layer can pin + lay them out as one row (the overlays, time-slider, chapters, heatmap,
 * captions-overlay, context-menu, play-state, spinner, prevented-tip, top-state, ad-overlay and
 * double-tap stay direct children of the controller so they overlay the stage).
 *
 * It renders the left cluster (`.playerstack-controls-left`, pinned to the left) and the right
 * cluster (`.playerstack-controls-right`, pinned to the right) wrappers. The caller supplies the
 * left cluster and the right cluster content as the two `children`, in order:
 * `[<ControlBarLeft />, <ControlsExtra />]`.
 *
 * Presentational only: no state, no effects, no callbacks.
 */
const ControlBar = ({ children }) => {
  const [left, right] = Array.isArray(children) ? children : [children, null];

  return (
    <div className="playerstack-controls">
      {/* Left cluster: transport + volume + time read-out (pinned to the left, matching
          the previous skin's ControlBar layout). */}
      {left}
      {/* Right cluster: captions + settings + fullscreen (pinned to the right). */}
      <div className="playerstack-controls-right">{right}</div>
    </div>
  );
};

ControlBar.propTypes = {
  children: PropTypes.node,
};

export default ControlBar;
