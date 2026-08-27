import BasePlayerStack, {
  IBasePlayerStackCommons,
  IBasePlayerStackWithSources,
  IBasePlayerStackWithSourcesNever,
  IBasePlayerStackWithUrl,
  IBasePlayerStackWithUrlNever,
} from './base';
import { HlsConfig } from './hlsjs.js';

export interface ITrackProps {
  kind: string;
  src: string;
  srcLang: string;
  label: string;
  default?: boolean;
}

export interface IPlayerCoreConfig {
  attributes: HTMLVideoElement['attributes'];
  tracks?: ITrackProps[];
  forceVideo?: boolean;
  forceHLS?: boolean;
  forceSafariHLS?: boolean;
  forceDisableHls?: boolean;
  forceDASH?: boolean;
  forceFLV?: boolean;
  hlsOptions?: Partial<HlsConfig>;
  hlsVersion?: string;
  dashVersion?: string;
  flvVersion?: string;
  forceLoad: boolean;
  loopOnEnded: boolean;
}

export interface IPlayerCoreWithUrl extends IBasePlayerStackWithUrl {
  config?: IPlayerCoreConfig;
}

export interface IPlayerCoreWithSources extends IBasePlayerStackWithSources {
  config?: IPlayerCoreConfig;
}

export type TPlayerCoreProps =
  | (IPlayerCoreWithUrl & IBasePlayerStackCommons & IBasePlayerStackWithUrlNever)
  | (IPlayerCoreWithSources & IBasePlayerStackCommons & IBasePlayerStackWithSourcesNever);

export default class PlayerCore extends BasePlayerStack<TPlayerCoreProps> {
  seekTo(_amount: number, _type?: 'seconds' | 'fraction'): void;
  getCurrentTime(): number;
  getSecondsLoaded(): number;
  getDuration(): number;
  getInternalPlayer(key?: string): Record<string, any>;
}
