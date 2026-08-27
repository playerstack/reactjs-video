var createMediaPlayer = require('./lib/MediaPlayer').createMediaPlayer;
var Player = require('./lib/core/PlayerCore').default;
module.exports = createMediaPlayer([
  {
    key: 'core',
    canPlay: Player.canPlay,
    lazyPlayer: Player,
  },
]);
