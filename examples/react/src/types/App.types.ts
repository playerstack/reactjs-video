export interface IState {
  urlFile: string | null;
  spriteVTTFile: string | null;
  pip: boolean;
  playing: boolean;
  volume: number;
  muted: boolean;
  played: number;
  loaded: number;
  duration: number;
  playbackRate: number;
  loop: boolean;
  seeking: boolean;
  poster: string | null;
}
