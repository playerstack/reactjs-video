import { canPlay } from '@playerstack/core';
import { lazy } from '@hooks/utils/lazy';
import { createMediaPlayer } from '@MediaPlayer';

const playerCore = {
  key: 'core',
  name: 'VideoElement',
  canPlay,
  lazyPlayer: lazy(() => import('@core/VideoElement')),
};

export default createMediaPlayer(playerCore);
