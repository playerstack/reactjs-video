import PropTypes from 'prop-types';

import { previousTrackIcon, nextTrackIcon } from '@playerstack/web-core/icons';

import {
  PlayerstackPlayButton,
  PlayerstackVolume,
  PlayerstackPlayTime,
  PlayerstackTitle,
  PlayerstackChapters,
  PlayerstackIcon,
} from '@adapter/elements';
import LiveIndicatorSlot from '@PlayerSkin/components/LiveIndicatorSlot';

// Stable empty-set default so `keepVisibleParts` is always a Set (no per-render allocation).
const EMPTY_SET = new Set();

/**
 * `ControlBarLeft` is the desktop left control cluster (parity with the monolith's
 * `.playerstack-controls-left`): transport + volume + time read-out, pinned to the left,
 * matching the previous skin's ControlBar layout.
 *
 * - The prev/next nav cluster shows when `PrevButton` or `NextButton` ∈ composition AND `showNav`
 *   is set (the orchestrator supplies the parity gating `showNavButtons || onPrevious || onNext`).
 * - `PlayButton`, `Volume` and `PlayTime` render IF their part ∈ composition (all three are in
 *   `DEFAULT_COMPOSITION`, so a default `<Player>` keeps them).
 * - The media `Title` read-out (`playerstack-title`, canonical order 90) renders right after
 *   `PlayTime` IF `Title` ∈ composition AND the collected title text is non-empty (Req 10.4).
 *   `Title` is opt-in (NOT in `DEFAULT_COMPOSITION`), so a default `<Player>` shows no title. An
 *   empty/absent title is omitted gracefully without disturbing the rest of the cluster (Req 10.5);
 *   because the wrapper renders a custom-element tag, an unregistered `playerstack-title` is just an
 *   inert unknown element — the layout never assumes registration and never throws (Req 10.6).
 * - The active chapter title read-out is rendered INLINE after the time (parity with the
 *   original StyledChapterIndicator ` · {title}`), gated by `showChapters` (the orchestrator
 *   supplies the parity gating `!(adPresent && !paused) && chapters?.length`): hidden once the
 *   ad is actually PLAYING (ad present AND not paused), but still shown while the ad is present
 *   but PAUSED. Chapters/Heatmap ride on the timeline data, so they are NOT separate slots.
 *
 * Presence gating (Req 8.3/8.4): each `playerstack-*` element renders IF AND ONLY IF its
 * composable part ∈ `composition.parts` (O(1) `Set.has`). DOM order follows the canonical
 * `COMPOSABLE_SLOTS` order for the `control-bar-left` region — PrevButton(50)/NextButton(55) →
 * PlayButton(60) → Volume(70) → PlayTime(80) → Title(90) — which the fixed JSX below already matches (Req
 * 8.5/1.8). The LIVE badge and chapter read-out are feature-driven riders (not composable slots),
 * so they keep their own gating.
 *
 * Presentational only: no state, no effects, no callbacks.
 */
const ControlBarLeft = ({
  parts,
  keepVisibleParts = EMPTY_SET,
  volumeOrientation = 'horizontal',
  title,
  showPrev,
  showNext,
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
}) => {
  const has = (name) => parts.has(name);
  // Req 17: per-element `data-keep-visible` value (`''` to opt out of auto-hide, else undefined).
  const keep = (name) => (keepVisibleParts.has(name) ? '' : undefined);

  return (
    <div className="playerstack-controls-left">
      {/* Prev button — canonical order 50. Renders only when `PrevButton` ∈ composition AND it
          has an `onClick` handler (`showPrev`): a nav button with no action is not shown. */}
      {has('PrevButton') && showPrev && (
        <button
          type="button"
          className="playerstack-prev-button"
          part="prev-button"
          aria-label="Previous"
          data-keep-visible={keep('PrevButton')}
          onClick={onPrevRequest}
        >
          <PlayerstackIcon icon={previousTrackIcon} width={36} height={36} />
        </button>
      )}
      {has('PlayButton') && (
        <PlayerstackPlayButton
          onPlayRequest={onPlayRequest}
          onPauseRequest={onPauseRequest}
          data-keep-visible={keep('PlayButton')}
        />
      )}
      {/* Next button — canonical order 65 (after PlayButton 60). Renders only when `NextButton`
          ∈ composition AND it has an `onClick` handler (`showNext`). */}
      {has('NextButton') && showNext && (
        <button
          type="button"
          className="playerstack-next-button"
          part="next-button"
          aria-label="Next"
          data-keep-visible={keep('NextButton')}
          onClick={onNextRequest}
        >
          <PlayerstackIcon icon={nextTrackIcon} width={36} height={36} />
        </button>
      )}
      {has('Volume') && (
        <PlayerstackVolume
          orientation={volumeOrientation === 'vertical' ? 'vertical' : undefined}
          onMuteRequest={onMuteRequest}
          onUnmuteRequest={onUnmuteRequest}
          onVolumeRequest={onVolumeRequest}
          data-keep-visible={keep('Volume')}
        />
      )}
      {/* Live read-out (parity with the monolith PlayTime `live` branch), gated on the UNIFIED live
        flag (`liveIndicator` = live || liveDVR): on ANY live stream at the edge it shows NOTHING
        (no `00:00` next to the LIVE badge, like YouTube); behind the edge in DVR it shows the
        negative offset and hides `/ duration`. The LIVE badge itself is the separate
        live-indicator rendered next. */}
      {has('PlayTime') && (
        <PlayerstackPlayTime live={!!liveIndicator} liveDVR={!!liveDVR} data-keep-visible={keep('PlayTime')} />
      )}
      {/* Media title read-out (canonical order 90) — renders right after PlayTime (80) and before
        the timeline region. Gated on BOTH `Title` ∈ composition AND a non-empty title text: the
        text arrives pre-normalized as `skin.composition.config.title` (collectConfig only sets it
        for non-empty content, per Req 10.4), so `title` is either a non-empty string or absent.
        When it is empty/absent the element is omitted with no effect on the rest of the cluster
        (Req 10.5). The `title` value maps to the element's `title` attribute via the binding. */}
      {has('Title') && title && <PlayerstackTitle title={title} data-keep-visible={keep('Title')} />}
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
};

ControlBarLeft.propTypes = {
  // Composition presence set from the manifest (`skin.composition.parts`); O(1) `Set.has` gating.
  parts: PropTypes.instanceOf(Set).isRequired,
  // Req 17: parts explicitly marked `keepVisible` — reflected as `data-keep-visible` per element.
  keepVisibleParts: PropTypes.instanceOf(Set),
  // Media title text from `skin.composition.config.title` (collected by `collectConfig` from
  // `<Title>text</Title>`; only present when non-empty). Rendered via `playerstack-title` when
  // `Title` ∈ composition. A number is accepted too (collectConfig keeps non-string nodes as-is).
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  // Per-button nav visibility: each is true only when the button ∈ composition, has an
  // `onClick`, and no ad is actively playing. A nav button without an action is not shown.
  showPrev: PropTypes.bool,
  showNext: PropTypes.bool,
  onPrevRequest: PropTypes.func,
  onNextRequest: PropTypes.func,
  onPlayRequest: PropTypes.func,
  onPauseRequest: PropTypes.func,
  onMuteRequest: PropTypes.func,
  onUnmuteRequest: PropTypes.func,
  onVolumeRequest: PropTypes.func,
  // Volume slider axis: `vertical` forces the open-upward slider (from `<Volume orientation>`).
  volumeOrientation: PropTypes.oneOf(['horizontal', 'vertical']),
  showChapters: PropTypes.bool,
  chapters: PropTypes.array,
  liveIndicator: PropTypes.bool,
  liveDVR: PropTypes.bool,
  dvrState: PropTypes.object,
  language: PropTypes.string,
  onLiveEdgeRequest: PropTypes.func,
};

export default ControlBarLeft;
