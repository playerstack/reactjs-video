import BasePlayerStack, {
  IBasePlayerStackCommons,
  IBasePlayerStackWithSources,
  IBasePlayerStackWithSourcesNever,
  IBasePlayerStackWithUrl,
  IBasePlayerStackWithUrlNever,
} from '../base';

import { IPlayerCoreConfig } from '../core';

export interface IPlayerStackLibWithUrl extends IBasePlayerStackWithUrl {
  config?: IPlayerCoreConfig;
}

export interface IPlayerStackLibWithSources extends IBasePlayerStackWithSources {
  config?: IPlayerCoreConfig;
}

export type TPlayerStackProps =
  | (IPlayerStackLibWithUrl & IBasePlayerStackCommons & IBasePlayerStackWithUrlNever)
  | (IPlayerStackLibWithSources & IBasePlayerStackCommons & IBasePlayerStackWithSourcesNever);

export default class PlayerStack extends BasePlayerStack<TPlayerStackProps> {
  seekTo(amount: number, type?: 'seconds' | 'fraction'): void;
  getCurrentTime(): number;
  getSecondsLoaded(): number;
  getDuration(): number;
  getInternalPlayer(key?: string): Record<string, any>;
}
