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
 * Presence gating (Req 8.3/8.4): the whole bar is the `BottomBar` composable part. It renders
 * IF AND ONLY IF `BottomBar` ∈ `composition.parts` (O(1) `Set.has`). `BottomBar` is part of
 * `DEFAULT_COMPOSITION`, so a default `<Player>` still shows the bar; a composition that omits
 * `<BottomBar>` drops the entire row.
 *
 * Presentational only: no state, no effects, no callbacks.
 */
const ControlBar = ({ parts, keepVisible, children }) => {
  if (!parts.has('BottomBar')) {
    return null;
  }

  const [left, right] = Array.isArray(children) ? children : [children, null];

  return (
    // Req 17: `data-keep-visible` opts this bar out of the auto-hide fade (Style_Layer override).
    <div className="playerstack-controls" data-keep-visible={keepVisible ? '' : undefined}>
      {/* Left cluster: transport + volume + time read-out (pinned to the left, matching
          the previous skin's ControlBar layout). */}
      {left}
      {/* Right cluster: captions + settings + fullscreen (pinned to the right). */}
      <div className="playerstack-controls-right">{right}</div>
    </div>
  );
};

ControlBar.propTypes = {
  // Composition presence set from the manifest (`skin.composition.parts`); O(1) `Set.has` gating.
  parts: PropTypes.instanceOf(Set).isRequired,
  // Req 17: keep the whole bar visible while playing (opt out of auto-hide).
  keepVisible: PropTypes.bool,
  children: PropTypes.node,
};

export default ControlBar;
