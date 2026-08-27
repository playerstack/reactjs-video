import PropTypes from 'prop-types';

import { PlayerstackTimeSlider } from '@adapter/elements';

/**
 * `ProgressSlider` renders Core's `playerstack-time-slider` element (Timelens + chapter
 * segments + heatmap + tooltip), gated on `showTimeSlider` (parity with the monolith's
 * `{showTimeSlider && <PlayerstackTimeSlider ... />}` in both layouts). Presentational only:
 * no state, effects, or callbacks of its own.
 *
 * `variant` selects the desktop vs mobile slider parity from the original skins:
 *   - `desktop` passes the `sprite-vtt-file` attribute + the sprite `adapter` (the hover
 *     timelens uses the adapter's `fetchVtt`);
 *   - `mobile` OMITS both (the mobile full-area sprite preview is a separate element), exactly
 *     as the original MobileProgressBar did.
 *
 * The chapter SEGMENT dividers and heatmap are suppressed whenever an ad is present
 * (`!adPresent`), matching the monolith. `adMode`, the seek request and the scrubbing request
 * are forwarded verbatim.
 */
export default function ProgressSlider({
  variant,
  showTimeSlider,
  spriteVTTFile,
  adapter,
  chapters,
  heatmapData,
  adPresent,
  live,
  bufferMode,
  onSeekRequest,
  onScrubbingRequest,
  onPlayRequest,
}) {
  if (!showTimeSlider) {
    return null;
  }

  // In live-DVR the timeline maps the seekable WINDOW and shows the negative live offset; chapters
  // + heatmap are suppressed there (parity with the original live-DVR TimeSlider `chapters={[]}`
  // `heatmapData={[]}`), as they are during an ad.
  const suppressExtras = adPresent || live;
  const chaptersProp = !suppressExtras && chapters && chapters.length > 0 ? chapters : null;
  const heatmapProp = !suppressExtras && heatmapData && heatmapData.length > 0 ? heatmapData : null;
  // Ad-mode (yellow disabled bar) must NOT engage over a LIVE stream (parity with the original
  // `isAdActive && false === live` guard on the ad TimeSlider): a live ad break keeps the live
  // timeline. So ad-mode only applies to non-live streams.
  const adModeProp = adPresent && !live;

  // Desktop feeds the hover timelens the sprite VTT + adapter; mobile omits them (the mobile
  // scrub preview is a separate `playerstack-sprite-preview` element).
  if (variant === 'desktop') {
    return (
      <PlayerstackTimeSlider
        sprite-vtt-file={spriteVTTFile}
        adapter={adapter}
        chapters={chaptersProp}
        heatmapData={heatmapProp}
        adMode={adModeProp}
        live={!!live}
        buffer-mode={bufferMode || 'fragmented'}
        onSeekRequest={onSeekRequest}
        onScrubbingRequest={onScrubbingRequest}
        onPlayRequest={onPlayRequest}
      />
    );
  }

  return (
    <PlayerstackTimeSlider
      chapters={chaptersProp}
      heatmapData={heatmapProp}
      adMode={adModeProp}
      live={!!live}
      buffer-mode={bufferMode || 'fragmented'}
      onSeekRequest={onSeekRequest}
      onScrubbingRequest={onScrubbingRequest}
      onPlayRequest={onPlayRequest}
    />
  );
}

ProgressSlider.propTypes = {
  variant: PropTypes.oneOf(['desktop', 'mobile']).isRequired,
  showTimeSlider: PropTypes.bool,
  spriteVTTFile: PropTypes.string,
  adapter: PropTypes.object,
  chapters: PropTypes.array,
  heatmapData: PropTypes.array,
  adPresent: PropTypes.bool,
  live: PropTypes.bool,
  bufferMode: PropTypes.oneOf(['fragmented', 'current', 'classic']),
  onSeekRequest: PropTypes.func,
  onScrubbingRequest: PropTypes.func,
  onPlayRequest: PropTypes.func,
};
