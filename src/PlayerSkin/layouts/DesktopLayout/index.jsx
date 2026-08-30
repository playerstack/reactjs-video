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
import FlexibleControls from '@PlayerSkin/components/FlexibleControls';
import { showChapterReadout, isAdActivePlaying } from '@PlayerSkin/helpers/gating';

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
  // Composition presence set (`manifest.parts`) — threaded to the gated clusters so each renders
  // its `playerstack-*` element IF AND ONLY IF the part ∈ parts (Req 8.3/8.4). DOM order stays the
  // canonical `COMPOSABLE_SLOTS` order per region (Req 8.5/1.8). The stage/system overlays below
  // (poster, play-state, spinner, prevented-tip, top-state, ad, live-ad, context-menu, sprite)
  // stay driven by ephemeral props and are NOT gated by composition (Req 9.6/15.11). `config`
  // carries the content collected from composables (e.g. the `<Title>` text at `config.title`).
  const {
    parts,
    sharedParts = parts,
    keepVisibleParts = new Set(),
    config,
    containers: sharedContainers = {},
    containerProps: sharedContainerProps = {},
  } = skin.composition;
  // Per-mode desktop branch (Req 15.7/15.9): when the author wraps a `<DesktopUI>`, THIS layout
  // consumes ONLY that branch's containers/parts for placement + bottom-bar gating; when absent
  // (null), it falls back to the SHARED composition (current behavior). `desktop.parts` here is a
  // PLACEMENT set (which controls sit where in desktop), not feature activation — feature
  // activation still flows through the shared `parts` in the orchestrator/engine.
  const desktopBranch = skin.composition.desktop;
  const containers = desktopBranch ? desktopBranch.containers : sharedContainers;
  const cProps = desktopBranch ? desktopBranch.containerProps || {} : sharedContainerProps;

  // Req 17 — keep-visible opt-out. When `<DesktopUI keepVisible>` is set, the WHOLE desktop chrome
  // stays on screen. Otherwise each container opts out individually via its `keepVisible` prop
  // (`cProps.X.keepVisible`). `keepAttr` returns the `data-keep-visible` value (`''` to set the
  // attribute, `undefined` to omit it) for a given container — the Style_Layer keys off it to
  // skip the auto-hide fade for that wrapper.
  const modeKeepVisible = !!(desktopBranch && desktopBranch.keepVisible);
  const keepAttr = (containerName) => (modeKeepVisible || cProps[containerName]?.keepVisible ? '' : undefined);

  // Full desktop gating set. When a desktop branch exists, desktop renders the UNION of:
  //   1. `desktopBranch.parts` — what the author placed inside `<DesktopUI>`, PLUS
  //   2. `sharedParts` — parts placed OUTSIDE any mode wrapper (the shared zone), which by
  //      definition belong to BOTH modes (Req 15.11).
  // A part placed ONLY inside `<MobileUI>` is in neither set, so it stays mobile-exclusive. When
  // no desktop branch exists, use the shared `parts` (current monolithic behavior).
  const allDesktopParts = desktopBranch ? new Set([...desktopBranch.parts, ...sharedParts]) : parts;

  // Bottom-bar gating set. With a desktop branch, ONLY the controls the author placed in
  // `desktop.containers.BottomBar` render — and `BottomBar` is added iff that container was
  // declared, so an author who put nothing in the bottom bar gets an empty bar (Req 15.7 edge).
  // Without a branch, the shared `parts` drives the bar exactly as before.
  const bottomBarList = desktopBranch ? containers.BottomBar || null : null;
  const dparts = desktopBranch ? new Set(bottomBarList ? [...bottomBarList, 'BottomBar'] : []) : parts;

  // While an ad is actively playing, hide the original-video context controls (nav buttons +
  // title) exactly like the chapter read-out is hidden. `showNav` is forced false and the title
  // is blanked so PrevButton/NextButton/Title do not render over the ad (parity with the
  // pre-composition ad-mode behavior).
  const adActive = isAdActivePlaying({ adPresent: derived.adPresent, paused: state.paused });
  // Per-button nav visibility: a nav button shows only when it has its OWN action wired
  // (`onPrevious`/`onNext` — i.e. the composable was given an `onClick`) and no ad is playing.
  // A `<PrevButton />` / `<NextButton />` without `onClick` renders nothing.
  const showPrev = !adActive && !!state.onPrevious;
  const showNext = !adActive && !!state.onNext;
  const titleText = adActive ? undefined : config.title;

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
          hover timelens the sprite VTT + adapter. Gated on the `Timeline` part. */}
      <ProgressSlider
        parts={allDesktopParts}
        variant="desktop"
        showTimeSlider={derived.showTimeSlider}
        keepVisible={modeKeepVisible || keepVisibleParts.has('Timeline') || !!cProps.BottomBar?.keepVisible}
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
          cluster (captions + settings + cast + fullscreen). The bar (the `ControlBar` part) and
          each inner control are presence-gated via `parts`. */}
      <ControlBar parts={dparts} keepVisible={modeKeepVisible || !!cProps.BottomBar?.keepVisible}>
        <ControlBarLeft
          parts={dparts}
          keepVisibleParts={keepVisibleParts}
          title={titleText}
          showPrev={showPrev}
          showNext={showNext}
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
          parts={dparts}
          keepVisibleParts={keepVisibleParts}
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

      {/* TopBar — horizontal bar at the top. Only renders if the composition declares a TopBar
          container with children. Uses FlexibleControls to render whichever controls are placed
          in this container. */}
      {containers.TopBar && containers.TopBar.length > 0 && (
        <div className="playerstack-top-bar" data-keep-visible={keepAttr('TopBar')}>
          <FlexibleControls
            containerParts={new Set(containers.TopBar)}
            keepVisibleParts={keepVisibleParts}
            title={titleText}
            showPrev={showPrev}
            showNext={showNext}
            onPrevRequest={handlers.handlePrevRequest}
            onNextRequest={handlers.handleNextRequest}
            onPlayRequest={handlers.handlePlayRequest}
            onPauseRequest={handlers.handlePauseRequest}
            onMuteRequest={handlers.handleMuteRequest}
            onUnmuteRequest={handlers.handleUnmuteRequest}
            onVolumeRequest={handlers.handleVolumeRequest}
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
        </div>
      )}

      {/* SidebarLeft — vertical bar on the left edge. */}
      {containers.SidebarLeft && containers.SidebarLeft.length > 0 && (
        <div
          className="playerstack-sidebar-left"
          data-align={cProps.SidebarLeft?.align || 'center'}
          data-keep-visible={keepAttr('SidebarLeft')}
        >
          <FlexibleControls
            containerParts={new Set(containers.SidebarLeft)}
            keepVisibleParts={keepVisibleParts}
            volumeOrientation="vertical"
            title={titleText}
            showPrev={showPrev}
            showNext={showNext}
            onPrevRequest={handlers.handlePrevRequest}
            onNextRequest={handlers.handleNextRequest}
            onPlayRequest={handlers.handlePlayRequest}
            onPauseRequest={handlers.handlePauseRequest}
            onMuteRequest={handlers.handleMuteRequest}
            onUnmuteRequest={handlers.handleUnmuteRequest}
            onVolumeRequest={handlers.handleVolumeRequest}
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
        </div>
      )}

      {/* SidebarRight — vertical bar on the right edge. */}
      {containers.SidebarRight && containers.SidebarRight.length > 0 && (
        <div
          className="playerstack-sidebar-right"
          data-align={cProps.SidebarRight?.align || 'center'}
          data-keep-visible={keepAttr('SidebarRight')}
        >
          <FlexibleControls
            containerParts={new Set(containers.SidebarRight)}
            keepVisibleParts={keepVisibleParts}
            volumeOrientation="vertical"
            title={titleText}
            showPrev={showPrev}
            showNext={showNext}
            onPrevRequest={handlers.handlePrevRequest}
            onNextRequest={handlers.handleNextRequest}
            onPlayRequest={handlers.handlePlayRequest}
            onPauseRequest={handlers.handlePauseRequest}
            onMuteRequest={handlers.handleMuteRequest}
            onUnmuteRequest={handlers.handleUnmuteRequest}
            onVolumeRequest={handlers.handleVolumeRequest}
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
        </div>
      )}
    </PlayerstackMediaController>
  );
};

DesktopLayout.propTypes = {
  skin: PropTypes.object.isRequired,
  controllerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};

export default DesktopLayout;
