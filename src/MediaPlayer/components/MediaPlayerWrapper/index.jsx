import React from 'react';

import { ensureWrapperStyles } from '@MediaPlayer/components/MediaPlayerWrapper/wrapperStyles';

/**
 * MediaPlayerWrapper provides the light-DOM container for the video player.
 *
 * Styling is delivered via a single injected stylesheet (`ensureWrapperStyles`)
 * instead of styled-components (task 14.4). The rules were ported 1:1 from the
 * former `StyledMediaPlayerWrapper` so Visual_Parity is preserved. The inner
 * player UI is styled by Core's Style_Auto_Injection inside the
 * `playerstack-media-controller` shadow root — the consumer imports no CSS.
 */
// Inject once at module load so the styles exist before the first paint, mirroring
// Core's Style_Auto_Injection. Idempotent and SSR-safe.
ensureWrapperStyles();

const MediaPlayerWrapper = React.forwardRef(({ children, style, className, ...props }, ref) => {
  return (
    <div ref={ref} className={`playerstack-wrapper${className ? ` ${className}` : ''}`} style={style} {...props}>
      {children}
    </div>
  );
});

MediaPlayerWrapper.displayName = 'MediaPlayerWrapper';

export default MediaPlayerWrapper;
