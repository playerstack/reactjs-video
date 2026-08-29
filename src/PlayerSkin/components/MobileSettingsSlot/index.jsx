import PropTypes from 'prop-types';

import { PlayerstackMobileSettings } from '@adapter/elements';

/**
 * `MobileSettingsSlot` renders Core's `playerstack-mobile-settings` full-surface panel
 * (quality / speed / captions), opened by the mobile top-bar gear (parity with the monolith's
 * mobile `PlayerstackMobileSettings`).
 *
 * The panel is mounted so its imperative `open_()` handle is available to the gear; the
 * orchestrator supplies `mobileSettingsRef` (from `useMobileSettings`) as its `ref`. Every prop
 * is forwarded verbatim: `qualityOptions`, `captions` (null when no tracks), the `i18n`
 * `{ language }` object, `adMode`, and the rate/quality/caption request handlers.
 *
 * Presence gating (Req 8.3/8.4): the panel is the mobile home of the `Settings` composable, so it
 * mounts IF AND ONLY IF `Settings` ∈ `composition.parts` (O(1) `Set.has`). `Settings` is in
 * `DEFAULT_COMPOSITION`; when it is omitted the top-bar gear is gated off too, so no opener needs
 * the panel.
 *
 * Presentational only: no state, no effects, no callbacks of its own.
 */
export default function MobileSettingsSlot({
  parts,
  mobileSettingsRef,
  qualityOptions,
  captions,
  language,
  adMode,
  live,
  onRateRequest,
  onQualityRequest,
  onCaptionRequest,
}) {
  if (!parts.has('Settings')) {
    return null;
  }

  return (
    <PlayerstackMobileSettings
      ref={mobileSettingsRef}
      qualityOptions={qualityOptions}
      captions={captions && captions.length > 0 ? captions : null}
      i18n={language ? { language } : null}
      adMode={adMode}
      live={live}
      onRateRequest={onRateRequest}
      onQualityRequest={onQualityRequest}
      onCaptionRequest={onCaptionRequest}
    />
  );
}

MobileSettingsSlot.propTypes = {
  // Composition presence set from the manifest (`skin.composition.parts`); O(1) `Set.has` gating.
  parts: PropTypes.instanceOf(Set).isRequired,
  mobileSettingsRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
  qualityOptions: PropTypes.array,
  captions: PropTypes.array,
  language: PropTypes.string,
  adMode: PropTypes.bool,
  live: PropTypes.bool,
  onRateRequest: PropTypes.func,
  onQualityRequest: PropTypes.func,
  onCaptionRequest: PropTypes.func,
};
