import PropTypes from 'prop-types';

import { PlayerstackMediaController } from '@adapter/elements';
import PosterOverlay from '@PlayerSkin/components/PosterOverlay';
import SkinOverlays from '@PlayerSkin/layouts/SkinOverlays';
import AdOverlay from '@PlayerSkin/components/AdOverlay';
import LiveAdOverlay from '@PlayerSkin/components/LiveAdOverlay';
import ContextMenuSlot from '@PlayerSkin/components/ContextMenuSlot';
import ProgressSlider from '@PlayerSkin/components/ProgressSlider';
import SpritePreviewSlot from '@PlayerSkin/components/SpritePreviewSlot';
import ControlBar from '@PlayerSkin/components/ControlBar';
import ControlBarLeft from '@PlayerSkin/components/ControlBarLeft';
import ControlsExtra from '@PlayerSkin/components/ControlsExtra';
import { showNavCluster, showChapterReadout } from '@PlayerSkin/helpers/gating';

/**
 * `DesktopLayout` is the presentational desktop arrangement (parity with the monolith's
 * `data-skin-mode="desktop"` branch, Area 3 of the Preserved Functionality Inventory). It
 * receives the fully-prepared `skin` bundle assembled by the orchestrator plus the
 * `controllerRef`, and composes Core's `playerstack-*` elements inside a single
 * `PlayerstackMediaController` in the EXACT current desktop order:
 *
 *   PosterOverlay → SkinOverlays (includePlayState) → AdOverlay → LiveAdOverlay →
 *   LiveIndicatorSlot → ContextMenuSlot → ProgressSlider (desktop) →
 *   ControlBar[ ControlBarLeft, ControlsExtra ]
 *
 * Presentational only: no state, no effects, no callbacks — every prop/handler is threaded
 * from the `skin` bundle. No element/attribute/part/data-* is added or removed relative to the
 * monolith.
 */
const DesktopLayout = ({ skin, controllerRef }) => {
  const { state, derived, refs, adapters, handlers } = skin;

  return (
    <PlayerstackMediaController ref={controllerRef} data-skin-mode="desktop">
      {/* Poster overlay (parity with the original StyledOverlayPoster): cover image before
          playback and after end; fades out during playback. */}
      <PosterOverlay poster={state.poster} visible={derived.isPosterVisible ? 'true' : 'false'} />

      {/* Overlays (Commons — Table 21-C). PlayState is a shared desktop overlay here. */}
      <SkinOverlays
        includePlayState
        language={state.language}
        hasResource={state.hasResource}
        prevented={state.prevented}
        paused={state.paused}
        muted={state.muted}
        currentTime={state.currentTime}
        onPreventedClick={state.onPreventedClick}
        onPlayRequest={handlers.handlePlayRequest}
        onPauseRequest={handlers.handlePauseRequest}
        captions={state.captions}
        activeCaption={state.activeCaption}
        captionCues={derived.captionCues}
        captionStyle={derived.captionStyle}
        onCaptionRequest={handlers.handleCaptionRequest}
      />

      {/* Full-area sprite preview on DRAG (same as mobile): covers the video with the thumbnail
          at the dragged position while scrubbing the timeline. The inline timelens (hover
          thumbnail above the track) remains independent and unaffected. */}
      <SpritePreviewSlot
        spriteVTTFile={state.spriteVTTFile}
        spritePreviewRef={refs.spritePreviewRef}
        adapter={adapters.spriteAdapter}
        duration={state.duration}
        seekTime={derived.scrubbing ? derived.scrubTime : state.currentTime}
        visible={derived.scrubbing || !!state.seeking}
      />

      <AdOverlay
        ads={state.ads}
        poster={state.poster}
        language={state.language}
        onAdSkip={handlers.handleAdSkip}
        onAdClick={skin.handleAdBannerClick}
      />

      {/* Live-stream ad break overlay (plays over the muted live stream). */}
      <LiveAdOverlay
        live={state.live}
        adapter={adapters.liveAdAdapter}
        trigger={derived.liveAdTrigger}
        language={state.language}
      />

      {/* Right-click context menu (loop / PiP / fullscreen) */}
      <ContextMenuSlot
        language={state.language}
        adMode={derived.adPresent}
        live={state.live}
        onLoopRequest={handlers.handleLoopRequest}
        onEnterPipRequest={handlers.handleEnterPipRequest}
        onExitPipRequest={handlers.handleExitPipRequest}
      />

      {/* Progress slider (Timelens + chapter segments + tooltip) — desktop variant feeds the
          hover timelens the sprite VTT + adapter. */}
      <ProgressSlider
        variant="desktop"
        showTimeSlider={derived.showTimeSlider}
        spriteVTTFile={state.spriteVTTFile}
        adapter={adapters.spriteAdapter}
        chapters={state.chapters}
        heatmapData={state.heatmapData}
        adPresent={derived.adPresent}
        live={state.liveDVR}
        bufferMode={state.bufferMode}
        onSeekRequest={handlers.handleSeekRequest}
        onScrubbingRequest={skin.handleScrubbingRequest}
        onPlayRequest={handlers.handlePlayRequest}
      />

      {/* Bottom control bar: left cluster (transport + volume + time + chapters) and right
          cluster (captions + settings + cast + fullscreen). */}
      <ControlBar>
        <ControlBarLeft
          showNav={showNavCluster(state.showNavButtons, state.onPrevious, state.onNext)}
          onPrevRequest={handlers.handlePrevRequest}
          onNextRequest={handlers.handleNextRequest}
          onPlayRequest={handlers.handlePlayRequest}
          onPauseRequest={handlers.handlePauseRequest}
          onMuteRequest={handlers.handleMuteRequest}
          onUnmuteRequest={handlers.handleUnmuteRequest}
          onVolumeRequest={handlers.handleVolumeRequest}
          showChapters={showChapterReadout({
            adPresent: derived.adPresent,
            paused: state.paused,
            chapters: state.chapters,
          })}
          chapters={state.chapters}
          liveIndicator={state.live}
          liveDVR={state.dvrActive}
          dvrState={derived.dvrState}
          language={state.language}
          onLiveEdgeRequest={handlers.handleLiveEdgeRequest}
        />
        <ControlsExtra
          captions={state.captions}
          activeCaption={state.activeCaption}
          fullscreen={state.fullscreen}
          onCaptionToggle={skin.captionToggle}
          qualityOptions={derived.qualityOptions}
          captionStyle={derived.captionStyle}
          language={state.language}
          adMode={derived.adPresent}
          live={state.live}
          showCast={derived.showCast}
          castState={derived.castState}
          onCastClick={skin.handleCastClick}
          onRateRequest={handlers.handleRateRequest}
          onQualityRequest={handlers.handleQualityRequest}
          onCaptionRequest={handlers.handleCaptionRequest}
          onCaptionStyleRequest={handlers.handleCaptionStyleRequest}
          onEnterFullscreenRequest={handlers.handleEnterFullscreenRequest}
          onExitFullscreenRequest={handlers.handleExitFullscreenRequest}
        />
      </ControlBar>
    </PlayerstackMediaController>
  );
};

DesktopLayout.propTypes = {
  skin: PropTypes.object.isRequired,
  controllerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};

export default DesktopLayout;
