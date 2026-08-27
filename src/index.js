import { canPlay } from '@playerstack/web-core';
import { lazy } from '@hooks/utils/lazy';
import { createMediaPlayer } from '@MediaPlayer';

const playerCore = {
  key: 'web-core',
  name: 'VideoElement',
  canPlay,
  lazyPlayer: lazy(() => import('@web-core/VideoElement')),
};

export default createMediaPlayer(playerCore);
