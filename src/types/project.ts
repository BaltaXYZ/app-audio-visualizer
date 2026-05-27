import type { BackgroundMotionSettings } from "./backgroundMotion";
import type { ImageEffectSettings } from "./imageEffects";
import type { LyricLine, LyricsSettings } from "./lyrics";
import type { VideoFormatId } from "./videoFormat";
import type { NormalizedPoint, VisualizationSettings } from "./visualization";

export type ProjectAssetReference = {
  name: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
};

export type VisualizationInstance = {
  instanceId: string;
  visualizationId: string;
  label: string;
  settings: VisualizationSettings;
  position: NormalizedPoint;
  zIndex: number;
};

export type ProjectSnapshot = {
  schemaVersion: 1;
  createdAt: string;
  selectedVisualizationId: string;
  videoFormatId: VideoFormatId;
  assets: {
    backgroundImage: ProjectAssetReference | null;
    audioTrack: ProjectAssetReference | null;
  };
  backgroundMotion: BackgroundMotionSettings;
  imageEffects: ImageEffectSettings;
  lyrics: {
    lines: LyricLine[];
    settings: LyricsSettings;
  };
  visualizationInstances: VisualizationInstance[];
  visualizationSettings: Record<string, VisualizationSettings>;
  visualizationPositions: Record<string, NormalizedPoint>;
};
