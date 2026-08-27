/**
 * Pure skin-selection predicate extracted from the `CorePlayerSkin` monolith.
 *
 * Decides whether the mobile skin layout should be used. `skinMode` is the
 * consumer-supplied override (`'auto' | 'mobile' | 'desktop'`) and `isMobile`
 * is the runtime device detection. Forcing `'mobile'` always wins; forcing
 * `'desktop'` always loses; otherwise (`'auto'`/undefined) it defers to
 * `isMobile`.
 *
 * No React, no DOM, no refs — a deterministic function of its inputs.
 *
 * @param {('auto'|'mobile'|'desktop'|undefined)} skinMode - Consumer skin-mode override.
 * @param {boolean} isMobile - Runtime mobile-device detection.
 * @returns {boolean} `true` when the mobile skin should render.
 */
export const selectMobileSkin = (skinMode, isMobile) => skinMode === 'mobile' || (skinMode !== 'desktop' && isMobile);
