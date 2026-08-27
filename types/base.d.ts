import { Component, ReactElement, CSSProperties } from 'react';

import PlayerStack from './lib';
import dashjs from './dashjs';
import hlsjs from './hlsjs';
import flvJs from './flvjs';

export type TActionErrorEventPlayer = (
  error: hlsjs.Events.ERROR | Event,
  data?: hlsjs.ErrorData | null,
  hls?: hlsjs.Hls | flvJs.Player | dashjs.MediaPlayerClass,
  Hls?: typeof hlsjs.Hls | typeof flvJs | typeof dashjs,
) => void;

export interface ISourceProps {
  src: string;
  resolution: number;
}

export interface IChapterProps {
  title: string;
  startTime: number;
}

export interface IHeatmapDataPoint {
  startTime: number;
  endTime: number;
  value: number;
}

export interface ICaptionProps {
  src: string;
  label: string;
  language: string;
  kind?: string;
}

export interface IOnProgressProps {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

export type TLanguage = 'es' | 'en';
export type TSkinMode = 'auto' | 'mobile' | 'desktop';

// ─── Common props for the video player ──────────────────────────────────────

export interface IPlayerStackCommonProps {
  playing?: boolean;
  loop?: boolean;
  volume?: number;
  muted?: boolean;
  playbackRate?: number;
  width?: string | number;
  height?: string | number;
  style?: CSSProperties;
  progressInterval?: number;
  playsinline?: boolean;
  stopOnUnmount?: boolean;
  fallback?: ReactElement;
  language: TLanguage;
  prevented?: boolean;
  waiting?: boolean;
  wrapper?: string | React.ComponentType | { render: Function };
  skinMode?: TSkinMode;
  onReady?: (player: PlayerStack) => void;
  onStart?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBuffer?: () => void;
  onBufferEnd?: () => void;
  onEnded?: () => void;
  onError?: TActionErrorEventPlayer;
  onDuration?: (duration: number) => void;
  onSeek?: (seconds: number) => void;
  onProgress?: (state: IOnProgressProps) => void;
  onPlayBackRateChange?: (rate: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  showNavButtons?: boolean;
}

// ─── Video-specific props ───────────────────────────────────────────────────

export interface IVideoPlayerProps extends IPlayerStackCommonProps {
  live?: boolean;
  poster?: string;
  pip?: boolean;
  spriteVTTFile?: string;
  chapters?: IChapterProps[];
  captions?: ICaptionProps[];
  heatmapData?: IHeatmapDataPoint[];
  fullHDQualityBreak?: number;
  onPlayBackQualityChange?: (quality: number | null) => void;
  onEnablePIP?: () => void;
  onDisablePIP?: () => void;
  config?: {
    attributes?: Record<string, string | boolean>;
    tracks?: Array<Record<string, unknown>>;
    forceHLS?: boolean;
    forceSafariHLS?: boolean;
    forceDisableHls?: boolean;
    forceDASH?: boolean;
    forceFLV?: boolean;
    hlsOptions?: Record<string, unknown>;
    hlsVersion?: string;
    dashVersion?: string;
    flvVersion?: string;
  };
}

// ─── Source discrimination (url vs sources) ─────────────────────────────────

export interface IWithUrl {
  url: string;
  sources?: never;
}

export interface IWithSources {
  url?: never;
  sources: ISourceProps[];
}

// ─── Final props type ────────────────────────────────────────────────────────

type TVideoWithUrl = IVideoPlayerProps & IWithUrl;
type TVideoWithSources = IVideoPlayerProps & IWithSources;

export type TPlayerStackProps = TVideoWithUrl | TVideoWithSources;

// ─── Legacy compatibility: IBasePlayerStackCommons ──────────────────────────

/** @deprecated Use TPlayerStackProps instead */
export interface IBasePlayerStackCommons extends IPlayerStackCommonProps {
  pip?: boolean;
  live?: boolean;
  poster?: string;
  spriteVTTFile?: string;
  chapters?: IChapterProps[];
  heatmapData?: IHeatmapDataPoint[];
  onPlayBackQualityChange?: (quality: number | null) => void;
  onEnablePIP?: () => void;
  onDisablePIP?: () => void;
}

/** @deprecated */
export interface IBasePlayerStackWithUrlNever {
  sources?: never;
}

/** @deprecated */
export interface IBasePlayerStackWithSourcesNever {
  url?: never;
}

/** @deprecated */
export interface IBasePlayerStackWithUrl {
  url: string;
}

/** @deprecated */
export interface IBasePlayerStackWithSources {
  sources: ISourceProps[];
  fullHDQualityBreak?: number;
}

/** @deprecated Use TPlayerStackProps */
type TBasePlayerStackProps =
  | (IBasePlayerStackWithUrl & IBasePlayerStackCommons & IBasePlayerStackWithUrlNever)
  | (IBasePlayerStackWithSources & IBasePlayerStackCommons & IBasePlayerStackWithSourcesNever);

export default abstract class BasePlayerStack<P extends TPlayerStackProps = TPlayerStackProps> extends Component<P, any> {
  static canPlay(url: string): boolean;
  static canEnablePIP(url: string): boolean;

  seekTo(amount: number, type?: 'seconds' | 'fraction'): void;
  getCurrentTime(): number;
  getSecondsLoaded(): number;
  getDuration(): number;
  getInternalPlayer(key?: string): Record<string, any>;
}
