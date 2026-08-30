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

import { computeHideSettings, isAdActivePlaying } from '@PlayerSkin/helpers/gating';

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
  // Composition presence set (`manifest.parts`) — threaded to the mobile clusters so each renders
  // its `playerstack-*` element IF AND ONLY IF the part ∈ parts (Req 8.3/8.4). Mobile keeps its
  // own Style_Layer arrangement (design §10). The stage/system overlays below (poster, spinner,
  // prevented-tip, top-state, captions, ad, live-ad, context-menu, double-tap, sprite) stay driven
  // by ephemeral props and are NOT gated by composition (Req 9.6/15.11).
  const { parts, sharedParts = parts, keepVisibleParts = new Set() } = skin.composition;
  // Per-mode mobile branch (Req 15.10): when the author wraps a `<MobileUI>`, THIS layout maps
  // its containers to the mobile zones — `TopBar` → `[part='mobile-top-bar']`, `CenterControls` →
  // `[part='mobile-center-controls']`, `BottomBar` → `[part='mobile-bottom-bar']`. When absent
  // (null), the fixed mobile clusters gate on the SHARED `parts` exactly as before (Req 15.7).
  //
  // The mobile cluster components already gate each control by `parts.has(name)`, so the cleanest
  // wiring is to build a per-zone Set from `mob.containers` and hand THAT to each cluster as its
  // `parts` prop — no cluster changes needed. Absent a container list, the zone gets an empty Set,
  // so a zone the author left empty renders nothing (its cluster collapses).
  //
  // SHARED parts (placed OUTSIDE any mode wrapper) belong to BOTH modes (Req 15.11), so each zone
  // is the UNION of its `<MobileUI>` container list AND `sharedParts`. This is safe because each
  // mobile cluster renders ONLY the controls that belong to its fixed zone (top bar →
  // captions/cast/settings, center → prev/play/next, bottom → time/timeline/fullscreen) — a part
  // never lands in two zones — so a shared part surfaces in exactly its natural mobile zone.
  const mob = skin.composition.mobile;
  const topBarParts = mob ? new Set([...(mob.containers.TopBar || []), ...sharedParts]) : parts;
  const centerParts = mob ? new Set([...(mob.containers.CenterControls || []), ...sharedParts]) : parts;
  const bottomParts = mob ? new Set([...(mob.containers.BottomBar || []), ...sharedParts]) : parts;

  // Req 17 — keep-visible opt-out per mobile zone. `<MobileUI keepVisible>` keeps the whole mobile
  // chrome on screen; otherwise each zone opts out via its container `keepVisible` prop. The
  // per-part `keepVisibleParts` set is threaded to each cluster so individual controls can opt out.
  const mobileKeep = !!(mob && mob.keepVisible);
  const mcProps = (mob && mob.containerProps) || {};
  const keepTopBar = mobileKeep || !!mcProps.TopBar?.keepVisible;
  const keepCenter = mobileKeep || !!mcProps.CenterControls?.keepVisible;
  const keepBottom = mobileKeep || !!mcProps.BottomBar?.keepVisible;
  // The mobile settings PANEL (full-surface) opens from the gear; keep it mounted whenever
  // `Settings` is composed ANYWHERE in mobile OR in the shared zone (Req 15.10/15.11). Without a
  // branch, fall back to the shared `parts` gating the panel already used.
  const mobileSettingsParts = mob
    ? new Set(
        [].concat(
          mob.containers.TopBar || [],
          mob.containers.CenterControls || [],
          mob.containers.BottomBar || [],
          Array.from(sharedParts),
        ),
      )
    : parts;

  // Hide the nav buttons while an ad is actively playing (parity with the desktop layout and
  // the chapter read-out gating): only the ad affordances + essential transport stay.
  const adActive = isAdActivePlaying({ adPresent: derived.adPresent, paused: state.paused });

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
        parts={topBarParts}
        keepVisible={keepTopBar}
        keepVisibleParts={keepVisibleParts}
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
        parts={centerParts}
        keepVisible={keepCenter}
        keepVisibleParts={keepVisibleParts}
        showPrev={!adActive && !!state.onPrevious}
        showNext={!adActive && !!state.onNext}
        onPrevRequest={handlers.handlePrevRequest}
        onNextRequest={handlers.handleNextRequest}
        onPlayRequest={handlers.handlePlayRequest}
        onPauseRequest={handlers.handlePauseRequest}
      />

      <MobileBottomBar
        parts={bottomParts}
        keepVisible={keepBottom}
        keepVisibleParts={keepVisibleParts}
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
        parts={mobileSettingsParts}
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
