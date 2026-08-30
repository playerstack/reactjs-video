import PropTypes from 'prop-types';

import { PlayerstackPlayTime, PlayerstackFullscreenButton } from '@adapter/elements';

import LiveIndicatorSlot from '@PlayerSkin/components/LiveIndicatorSlot';
import ProgressSlider from '@PlayerSkin/components/ProgressSlider';

// Stable empty-set default so `keepVisibleParts` is always a Set.
const EMPTY_SET = new Set();

/**
 * `MobileBottomBar` is the mobile single-row bottom bar (parity with the monolith's
 * `.playerstack-mobile-bottom-bar`): time · (live badge | progress) · fullscreen.
 *
 * In LIVE mode the live badge (`LiveIndicatorSlot`, gated on `live`) leads the row; with DVR the
 * time-slider still shows (mapping the seekable WINDOW) and the badge jumps to the live edge. In
 * pure live (no DVR) only the badge shows (no scrubbable timeline) — this is driven by
 * `showTimeSlider`, which the orchestrator computes as `!live || liveDVR`.
 *
 * The mobile progress slider is rendered via `ProgressSlider variant="mobile"` (parity with the
 * original MobileProgressBar: it OMITS the sprite VTT + adapter that the desktop hover timelens
 * uses). The DVR window (currentTime/duration/loaded) is mapped verbatim by the orchestrator's
 * Core media bridge (`bridgeCurrentTime`/`bridgeDuration`/`bridgeLoaded`), so the slider itself
 * only receives `chapters`/`heatmapData`/`adPresent` and the seek/scrubbing requests — the DVR
 * window position/duration reaches it through the shared store, exactly as in the monolith.
 *
 * Presence gating (Req 8.3/8.4): `PlayTime`, `Timeline` (via the nested `ProgressSlider`) and
 * `Fullscreen` each render IF AND ONLY IF their composable part ∈ `composition.parts` (O(1)
 * `Set.has`); all three are in `DEFAULT_COMPOSITION`. The LIVE badge is a feature-driven rider
 * (not a composable slot), so it keeps its own `live` gating.
 *
 * Presentational only: no state, no effects, no callbacks of its own.
 */
export default function MobileBottomBar({
  parts,
  keepVisible,
  keepVisibleParts = EMPTY_SET,
  live,
  liveDVR,
  dvrActive,
  showTimeSlider,
  dvrState,
  language,
  onLiveEdgeRequest,
  chapters,
  heatmapData,
  adPresent,
  bufferMode,
  onSeekRequest,
  onScrubbingRequest,
  onPlayRequest,
  onEnterFullscreenRequest,
  onExitFullscreenRequest,
}) {
  const has = (name) => parts.has(name);
  // Req 17: per-element `data-keep-visible` value (`''` opts out of auto-hide, else undefined).
  const keep = (name) => (keepVisibleParts.has(name) ? '' : undefined);

  return (
    <div
      className="playerstack-mobile-bottom-bar"
      part="mobile-bottom-bar"
      data-keep-visible={keepVisible ? '' : undefined}
    >
      {/* Read-out + LIVE badge gate on the UNIFIED `live`: on ANY live stream at the edge the
          read-out shows NOTHING (no `00:00`, like YouTube). The negative offset + grey badge gate
          on `dvrActive` (a SYNCED DVR window), NOT the raw `liveDVR` — so no bogus offset flashes
          from the pre-ready transient on first load. The DVR-window slider uses raw `liveDVR`. */}
      {has('PlayTime') && (
        <PlayerstackPlayTime live={!!live} liveDVR={!!dvrActive} data-keep-visible={keep('PlayTime')} />
      )}
      <LiveIndicatorSlot
        live={live}
        pureLive={live && !dvrActive}
        dvrState={dvrState}
        language={language}
        onSeekRequest={onLiveEdgeRequest}
      />
      <ProgressSlider
        parts={parts}
        variant="mobile"
        showTimeSlider={showTimeSlider}
        keepVisible={keepVisibleParts.has('Timeline')}
        chapters={chapters}
        heatmapData={heatmapData}
        adPresent={adPresent}
        live={liveDVR}
        bufferMode={bufferMode}
        onSeekRequest={onSeekRequest}
        onScrubbingRequest={onScrubbingRequest}
        onPlayRequest={onPlayRequest}
      />
      {has('Fullscreen') && (
        <PlayerstackFullscreenButton
          onEnterFullscreenRequest={onEnterFullscreenRequest}
          onExitFullscreenRequest={onExitFullscreenRequest}
          data-keep-visible={keep('Fullscreen')}
        />
      )}
    </div>
  );
}

MobileBottomBar.propTypes = {
  // Composition presence set from the manifest (`skin.composition.parts`); O(1) `Set.has` gating.
  parts: PropTypes.instanceOf(Set).isRequired,
  // Req 17: keep the whole bottom bar visible while playing.
  keepVisible: PropTypes.bool,
  // Req 17: parts opted out of auto-hide — reflected per element.
  keepVisibleParts: PropTypes.instanceOf(Set),
  live: PropTypes.bool,
  liveDVR: PropTypes.bool,
  dvrActive: PropTypes.bool,
  showTimeSlider: PropTypes.bool,
  dvrState: PropTypes.object,
  language: PropTypes.string,
  onLiveEdgeRequest: PropTypes.func,
  chapters: PropTypes.array,
  heatmapData: PropTypes.array,
  adPresent: PropTypes.bool,
  bufferMode: PropTypes.oneOf(['fragmented', 'current', 'classic']),
  onSeekRequest: PropTypes.func,
  onScrubbingRequest: PropTypes.func,
  onPlayRequest: PropTypes.func,
  onEnterFullscreenRequest: PropTypes.func,
  onExitFullscreenRequest: PropTypes.func,
};
