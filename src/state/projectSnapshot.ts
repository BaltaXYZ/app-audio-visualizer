import type {
  AudioTrackAsset,
  BackgroundImageAsset,
} from "../types/assets";
import type {
  ProjectAssetReference,
  ProjectSnapshot,
  VisualizationInstance,
} from "../types/project";
import type { AppState } from "./appReducer";
import { defaultPosition } from "./appReducer";

export function createProjectSnapshot(
  state: AppState,
  createdAt = new Date().toISOString(),
): ProjectSnapshot {
  const selectedSettings =
    state.visualizationSettings[state.selectedVisualizationId] ?? {};
  const selectedPosition =
    state.visualizationPositions[state.selectedVisualizationId] ??
    defaultPosition;
  const activeInstance: VisualizationInstance = {
    instanceId: "active-visualization",
    visualizationId: state.selectedVisualizationId,
    label: "Active visual",
    settings: { ...selectedSettings },
    position: { ...selectedPosition },
    zIndex: 0,
  };

  return {
    schemaVersion: 1,
    createdAt,
    selectedVisualizationId: state.selectedVisualizationId,
    videoFormatId: state.videoFormatId,
    assets: {
      backgroundImage: state.backgroundImage
        ? toBackgroundReference(state.backgroundImage)
        : null,
      audioTrack: state.audioTrack ? toAudioReference(state.audioTrack) : null,
    },
    backgroundMotion: { ...state.backgroundMotion },
    visualizationInstances: [activeInstance],
    visualizationSettings: cloneRecord(state.visualizationSettings),
    visualizationPositions: cloneRecord(state.visualizationPositions),
  };
}

function toBackgroundReference(
  asset: BackgroundImageAsset,
): ProjectAssetReference {
  return {
    name: asset.name,
    type: asset.type,
    size: asset.size,
    width: asset.width,
    height: asset.height,
  };
}

function toAudioReference(asset: AudioTrackAsset): ProjectAssetReference {
  return {
    name: asset.name,
    type: asset.type,
    size: asset.size,
    duration: asset.duration,
  };
}

function cloneRecord<TValue extends object>(
  record: Record<string, TValue>,
): Record<string, TValue> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, { ...value }]),
  );
}
