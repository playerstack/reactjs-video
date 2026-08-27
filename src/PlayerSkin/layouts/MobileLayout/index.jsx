import PropTypes from 'prop-types';

import { PlayerstackMediaController } from '@adapter/elements';

import PosterOverlay from '@PlayerSkin/components/PosterOverlay';
import SkinOverlays from '@PlayerSkin/layouts/SkinOverlays';
import SpritePreviewSlot from '@PlayerSkin/components/SpritePreviewSlot';
import AdOverlay from '@PlayerSkin/components/AdOverlay';
import LiveAdOverlay from '@PlayerSkin/components/LiveAdOverlay';
import ContextMenuSlot from '@PlayerSkin/components/ContextMenuSlot';
import DoubleTapSlot from '@PlayerSkin/components/DoubleTapSlot';
import MobileTopBar from '@PlayerSkin/components/MobileTopBar';
import MobileCenterControls from '@PlayerSkin/components/MobileCenterControls';
import MobileBottomBar from '@PlayerSkin/components/MobileBottomBar';
import MobileSettingsSlot from '@PlayerSkin/components/MobileSettingsSlot';

import { computeHideSettings } from '@PlayerSkin/helpers/gating';

/**
 * `MobileLayout` is the presentational mobile arrangement (parity with the monolith's mobile
 * branch — the `data-skin-mode="mobile"` subtree). It receives a fully-prepared `skin` bundle
 * plus the shared `controllerRef` from the orchestrator and arranges the clusters/overlays into
 * the exact current mobile DOM structure: a dark scrim, a top-right settings/captions cluster,
 * centered prev·play·next controls, and a bottom bar with time + inline progress + fullscreen.
 * It reuses the SAME Core elements as desktop but arranges them in the mobile `[part='mobile-*']`
 * wrappers the Style_Layer positions; overlays (spinner, prevented tip, captions, ad, top-state,
 * context menu) stay shared.
 *
 * Element order matches the monolith exactly: PosterOverlay → SkinOverlays (PlayState rendered
 * inside MobileCenterControls, so `includePlayState={false}` here) → SpritePreviewSlot →
 * AdOverlay → LiveAdOverlay → ContextMenuSlot → DoubleTapSlot → the `.playerstack-mobile-overlay`
 * scrim → MobileTopBar → MobileCenterControls → MobileBottomBar → MobileSettingsSlot.
 *
 * The whole-bar visibility rule for the top bar is preserved verbatim: `hideSettings` is computed
 * here via `computeHideSettings` (the same OR-clause the monolith used inline), and `MobileTopBar`
 * renders `null` when the gear is hidden AND cast is not shown AND there are no captions.
 *
 * Presentational only: no state, no effects, no callbacks of its own — every value/handler comes
 * from the `skin` bundle.
 */
const MobileLayout = ({ skin, controllerRef }) => {
  const { state, derived, refs, adapters, handlers } = skin;

  const hasCaptions = !!(state.captions && state.captions.length > 0);
  const hideSettings = computeHideSettings({
    adPresent: derived.adPresent,
    live: state.live,
    qualityOptionsLength: derived.qualityOptions.length,
    hasCaptions,
  });

  return (
    <PlayerstackMediaController ref={controllerRef} data-skin-mode="mobile">
      <PosterOverlay poster={state.poster} visible={derived.isPosterVisible} />

      <SkinOverlays
        includePlayState={false}
        language={state.language}
        hasResource={state.hasResource}
        prevented={state.prevented}
        paused={state.paused}
        muted={state.muted}
        currentTime={state.currentTime}
        onPreventedClick={state.onPreventedClick}
        captions={state.captions}
        activeCaption={state.activeCaption}
        captionCues={derived.captionCues}
        captionStyle={derived.captionStyle}
        onCaptionRequest={handlers.handleCaptionRequest}
      />

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

      <LiveAdOverlay
        live={state.live}
        adapter={adapters.liveAdAdapter}
        trigger={derived.liveAdTrigger}
        language={state.language}
      />

      <ContextMenuSlot
        language={state.language}
        adMode={derived.adPresent}
        live={state.live}
        onLoopRequest={handlers.handleLoopRequest}
        onEnterPipRequest={handlers.handleEnterPipRequest}
        onExitPipRequest={handlers.handleExitPipRequest}
      />

      <DoubleTapSlot
        adPresent={derived.adPresent}
        language={state.language}
        onSeekRequest={handlers.handleSeekRequest}
      />

      {/* Dark scrim shown while controls are visible. */}
      <div className="playerstack-mobile-overlay" part="mobile-overlay" />

      <MobileTopBar
        hasCaptions={hasCaptions}
        showCast={derived.showCast}
        hideSettings={hideSettings}
        activeCaption={state.activeCaption}
        castState={derived.castState}
        onCaptionToggle={skin.captionToggle}
        onCastClick={skin.handleCastClick}
        onOpenSettings={skin.openMobileSettings}
      />

      <MobileCenterControls
        showNav={!!(state.showNavButtons || state.onPrevious || state.onNext)}
        onPrevRequest={handlers.handlePrevRequest}
        onNextRequest={handlers.handleNextRequest}
        onPlayRequest={handlers.handlePlayRequest}
        onPauseRequest={handlers.handlePauseRequest}
      />

      <MobileBottomBar
        live={state.live}
        liveDVR={state.liveDVR}
        dvrActive={state.dvrActive}
        showTimeSlider={derived.showTimeSlider}
        dvrState={derived.dvrState}
        language={state.language}
        onLiveEdgeRequest={handlers.handleLiveEdgeRequest}
        chapters={state.chapters}
        heatmapData={state.heatmapData}
        adPresent={derived.adPresent}
        bufferMode={state.bufferMode}
        onSeekRequest={handlers.handleSeekRequest}
        onScrubbingRequest={skin.handleScrubbingRequest}
        onPlayRequest={handlers.handlePlayRequest}
        onEnterFullscreenRequest={handlers.handleEnterFullscreenRequest}
        onExitFullscreenRequest={handlers.handleExitFullscreenRequest}
      />

      <MobileSettingsSlot
        mobileSettingsRef={refs.mobileSettingsRef}
        qualityOptions={derived.qualityOptions}
        captions={state.captions}
        language={state.language}
        adMode={derived.adPresent}
        live={state.live}
        onRateRequest={handlers.handleRateRequest}
        onQualityRequest={handlers.handleQualityRequest}
        onCaptionRequest={handlers.handleCaptionRequest}
      />
    </PlayerstackMediaController>
  );
};

MobileLayout.propTypes = {
  skin: PropTypes.shape({
    state: PropTypes.object.isRequired,
    derived: PropTypes.object.isRequired,
    refs: PropTypes.object.isRequired,
    adapters: PropTypes.object.isRequired,
    handlers: PropTypes.object.isRequired,
    captionToggle: PropTypes.func,
    openMobileSettings: PropTypes.func,
    handleScrubbingRequest: PropTypes.func,
    handleCastClick: PropTypes.func,
    handleAdBannerClick: PropTypes.func,
  }).isRequired,
  controllerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
};

export default MobileLayout;
