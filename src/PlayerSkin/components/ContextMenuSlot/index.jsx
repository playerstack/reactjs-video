import React from 'react';
import PropTypes from 'prop-types';

import { PlayerstackContextMenu } from '@adapter/elements';

/**
 * `ContextMenuSlot` renders the right-click context menu (loop / PiP / fullscreen). Markup
 * lives in Core's `playerstack-context-menu` element; the skin supplies the i18n `language`
 * (mapped to the element's `i18n` prop), the `adMode`/`live` gating flags, and the
 * loop/pip request handlers.
 *
 * Presentational only: no state, no effects.
 */
const ContextMenuSlot = ({ language, adMode, live, onLoopRequest, onEnterPipRequest, onExitPipRequest }) => (
  <PlayerstackContextMenu
    i18n={language ? { language } : null}
    adMode={adMode}
    live={live}
    onLoopRequest={onLoopRequest}
    onEnterPipRequest={onEnterPipRequest}
    onExitPipRequest={onExitPipRequest}
  />
);

ContextMenuSlot.propTypes = {
  language: PropTypes.string,
  adMode: PropTypes.bool,
  live: PropTypes.bool,
  onLoopRequest: PropTypes.func,
  onEnterPipRequest: PropTypes.func,
  onExitPipRequest: PropTypes.func,
};

export default ContextMenuSlot;
