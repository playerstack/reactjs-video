import PropTypes from 'prop-types';

import {
  PlayerstackNavButtons,
  PlayerstackPlayButton,
  PlayerstackVolume,
  PlayerstackPlayTime,
  PlayerstackChapters,
} from '@adapter/elements';
import LiveIndicatorSlot from '@PlayerSkin/components/LiveIndicatorSlot';

/**
 * `ControlBarLeft` is the desktop left control cluster (parity with the monolith's
 * `.playerstack-controls-left`): transport + volume + time read-out, pinned to the left,
 * matching the previous skin's ControlBar layout.
 *
 * - The prev/next nav cluster shows when `showNav` is set (the orchestrator supplies the parity
 *   gating `showNavButtons || onPrevious || onNext`).
 * - `PlayerstackPlayButton`, `PlayerstackVolume` and `PlayerstackPlayTime` are always rendered.
 * - The active chapter title read-out is rendered INLINE after the time (parity with the
 *   original StyledChapterIndicator ` · {title}`), gated by `showChapters` (the orchestrator
 *   supplies the parity gating `!(adPresent && !paused) && chapters?.length`): hidden once the
 *   ad is actually PLAYING (ad present AND not paused), but still shown while the ad is present
 *   but PAUSED.
 *
 * Presentational only: no state, no effects, no callbacks.
 */
const ControlBarLeft = ({
  showNav,
  onPrevRequest,
  onNextRequest,
  onPlayRequest,
  onPauseRequest,
  onMuteRequest,
  onUnmuteRequest,
  onVolumeRequest,
  showChapters,
  chapters,
  liveIndicator,
  liveDVR,
  dvrState,
  language,
  onLiveEdgeRequest,
}) => (
  <div className="playerstack-controls-left">
    {/* Prev/next nav cluster — desktop control bar. Shows when a prev/next handler is
        provided OR `showNavButtons` is set (parity with the original nav gating). */}
    {showNav && <PlayerstackNavButtons onPrevRequest={onPrevRequest} onNextRequest={onNextRequest} />}
    <PlayerstackPlayButton onPlayRequest={onPlayRequest} onPauseRequest={onPauseRequest} />
    <PlayerstackVolume
      onMuteRequest={onMuteRequest}
      onUnmuteRequest={onUnmuteRequest}
      onVolumeRequest={onVolumeRequest}
    />
    {/* Live read-out (parity with the monolith PlayTime `live` branch), gated on the UNIFIED live
        flag (`liveIndicator` = live || liveDVR): on ANY live stream at the edge it shows NOTHING
        (no `00:00` next to the LIVE badge, like YouTube); behind the edge in DVR it shows the
        negative offset and hides `/ duration`. The LIVE badge itself is the separate
        live-indicator rendered next. */}
    <PlayerstackPlayTime live={!!liveIndicator} liveDVR={!!liveDVR} />
    {/* LIVE badge (dot + "Live" + offset, click-to-live). INLINE in the control bar right after
        the time read-out — parity with the monolith, where the LIVE badge lived inside PlayTime
        in the left control cluster (NOT an absolute stage corner). Gated on `liveIndicator` (the
        unified live flag). Its jump-to-live seek + DVR window come from the orchestrator. */}
    <LiveIndicatorSlot
      live={liveIndicator}
      pureLive={liveIndicator && !liveDVR}
      dvrState={dvrState}
      language={language}
      onSeekRequest={onLiveEdgeRequest}
    />
    {/* Active chapter title read-out — INLINE in the control bar after the time (parity
        with the original StyledChapterIndicator ` · {title}`), not an absolute corner.
        Hidden once the ad is actually PLAYING (ad present AND not paused): the original-video
        chapter title may still show on first load while the ad is present but PAUSED, but no
        original-video info is shown during ad PLAYBACK. `isAdActive` alone is unreliable here
        (it only flips after a paused->play transition the consumer may not drive), so gate on
        live playback state: `adPresent && !paused`. */}
    {showChapters && <PlayerstackChapters chapters={chapters} />}
  </div>
);

ControlBarLeft.propTypes = {
  showNav: PropTypes.bool,
  onPrevRequest: PropTypes.func,
  onNextRequest: PropTypes.func,
  onPlayRequest: PropTypes.func,
  onPauseRequest: PropTypes.func,
  onMuteRequest: PropTypes.func,
  onUnmuteRequest: PropTypes.func,
  onVolumeRequest: PropTypes.func,
  showChapters: PropTypes.bool,
  chapters: PropTypes.array,
  liveIndicator: PropTypes.bool,
  liveDVR: PropTypes.bool,
  dvrState: PropTypes.object,
  language: PropTypes.string,
  onLiveEdgeRequest: PropTypes.func,
};

export default ControlBarLeft;
