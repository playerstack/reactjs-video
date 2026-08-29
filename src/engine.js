import { canPlay } from '@playerstack/web-core';
import { lazy } from '@hooks/utils/lazy';
import { createMediaPlayer } from '@MediaPlayer';

// Internal playback engine factory. This is an implementation detail of the composed
// `Player` root (see src/compound/Player), NOT part of the public API: it is reachable
// internally as `@root/engine` and MUST NOT be re-exported as `createMediaPlayer` or
// `Engine` from the package entry point (requirements 2.4, 2.5).
const playerCore = {
  key: 'core',
  name: 'VideoElement',
  canPlay,
  lazyPlayer: lazy(() => import('@core/VideoElement')),
};

export default createMediaPlayer(playerCore);
