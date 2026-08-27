/**
 * Light-DOM styles for the reactjs player wrapper + container (task 14.4).
 *
 * WHY runtime injection instead of styled-components: task 14.4 removes
 * `styled-components` entirely. Core's `playerstack.css` is scoped to the shadow
 * roots of the `playerstack-*` Custom Elements (`:host`), so it CANNOT style the
 * reactjs-owned LIGHT-DOM scaffolding that positions the `<video>` and the
 * `playerstack-media-controller` (the outer wrapper + the flex container). These
 * rules are ported 1:1 from the former `StyledMediaPlayerWrapper`,
 * `scopedResetStyles` and `StyledPlayerContainer` so Visual_Parity is preserved.
 *
 * The stylesheet is injected once into `document.head` under a stable id, exactly
 * like Core's Style_Auto_Injection philosophy but for the light DOM — the consumer
 * still imports no CSS.
 */

const STYLE_ELEMENT_ID = 'playerstack-wrapper-styles';

/**
 * The wrapper/container CSS, ported from the removed styled-components rules.
 * `.playerstack-wrapper` == former StyledMediaPlayerWrapper (+ scopedResetStyles,
 * applied with `:where()` zero-specificity so component styles always win).
 * `.playerstack-container` == former StyledPlayerContainer.
 */
export const WRAPPER_CSS = `
.playerstack-wrapper {
  display: flex;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  color: #fff;
  background: #000;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    Segoe UI,
    PingFang SC,
    Hiragino Sans GB,
    Microsoft YaHei,
    Helvetica Neue,
    Helvetica,
    Arial,
    sans-serif,
    Apple Color Emoji,
    Segoe UI Emoji,
    Segoe UI Symbol;
  font-size: 14px;
  font-variant: tabular-nums;
  line-height: 1.5;
}

.playerstack-wrapper,
:where(.playerstack-wrapper) *,
:where(.playerstack-wrapper) *::before,
:where(.playerstack-wrapper) *::after {
  box-sizing: border-box;
}

:where(.playerstack-wrapper) button {
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  padding: 0;
  margin: 0;
  cursor: pointer;
  outline: none;
}

:where(.playerstack-wrapper) ul,
:where(.playerstack-wrapper) ol {
  list-style: none;
  margin: 0;
  padding: 0;
}

:where(.playerstack-wrapper) li {
  margin: 0;
  padding: 0;
}

:where(.playerstack-wrapper) a {
  color: inherit;
  text-decoration: none;
}

.playerstack-wrapper video::cue {
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 1.1em;
  line-height: 1.4;
}

.playerstack-container {
  display: flex;
  position: relative;
  width: 100%;
  height: 100%;
  margin: auto;
}

/*
 * The video fills the container/stage. Without an explicit size the <video> keeps
 * its intrinsic ratio and the flex container can collapse before metadata loads,
 * shrinking the whole player — pin it to the stage.
 */
:where(.playerstack-container) video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

/*
 * The Core root host (<playerstack-media-controller>) is a LIGHT-DOM sibling of the
 * video container inside the flex wrapper. It must OVERLAY the video (the controls,
 * overlays and progress bar sit on top of the frame), so it is absolutely positioned
 * to fill the wrapper rather than flowing as a second flex column beside the video.
 * Its own shadow [part="root"] then lays out media/controls within this box.
 */
.playerstack-wrapper > playerstack-media-controller {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
}
`;

/**
 * Inject the wrapper stylesheet into `document.head` exactly once. Idempotent:
 * repeated calls (multiple players on a page, re-mounts) are no-ops after the
 * first. Safe to call in SSR — it bails when `document` is unavailable.
 */
export function ensureWrapperStyles() {
  if (typeof document === 'undefined') {
    return;
  }
  if (document.getElementById(STYLE_ELEMENT_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = WRAPPER_CSS;
  document.head.appendChild(style);
}
