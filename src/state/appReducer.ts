import type {
  AudioTrackAsset,
  BackgroundImageAsset,
  LoadStatus,
  LocalAsset,
} from "../types/assets";
import type {
  BackgroundMotionSettings,
  BackgroundMotionValue,
} from "../types/backgroundMotion";
import type {
  ControlValue,
  NormalizedPoint,
  VisualizationSettings,
} from "../types/visualization";
import type { VideoFormatId } from "../types/videoFormat";
import { defaultVideoFormatId } from "../types/videoFormat";
import { visualizationRegistry } from "../visualizations/registry";

export type AppState = {
  backgroundImage: BackgroundImageAsset | null;
  audioTrack: AudioTrackAsset | null;
  backgroundStatus: LoadStatus;
  audioStatus: LoadStatus;
  backgroundError: string | null;
  audioError: string | null;
  videoFormatId: VideoFormatId;
  backgroundMotion: BackgroundMotionSettings;
  selectedVisualizationId: string;
  visualizationSettings: Record<string, VisualizationSettings>;
  visualizationPositions: Record<string, NormalizedPoint>;
};

export type AppAction =
  | { type: "setBackgroundImage"; asset: LocalAsset }
  | { type: "setBackgroundMetadata"; width: number; height: number }
  | { type: "setBackgroundError"; message: string; preserveCurrent?: boolean }
  | { type: "clearBackgroundImage" }
  | { type: "setAudioTrack"; asset: LocalAsset }
  | { type: "setAudioMetadata"; duration: number }
  | { type: "setAudioError"; message: string }
  | { type: "clearAudioTrack" }
  | { type: "setSelectedVisualization"; visualizationId: string }
  | {
      type: "updateVisualizationSetting";
      visualizationId: string;
      settingId: string;
      value: ControlValue;
    }
  | {
      type: "setVisualizationPosition";
      visualizationId: string;
      position: NormalizedPoint;
    }
  | { type: "resetVisualizationSettings"; visualizationId: string }
  | { type: "resetVisualizationPosition"; visualizationId: string }
  | {
      type: "updateBackgroundMotion";
      settingId: keyof BackgroundMotionSettings;
      value: BackgroundMotionValue;
    }
  | { type: "resetBackgroundMotion" }
  | { type: "setVideoFormat"; videoFormatId: VideoFormatId };

export const defaultPosition: NormalizedPoint = { x: 0.5, y: 0.5 };
export const defaultBackgroundMotion: BackgroundMotionSettings = {
  enabled: false,
  direction: "right",
  speed: 0.65,
  zoom: 12,
};

export function createInitialVisualizationSettings() {
  return Object.fromEntries(
    visualizationRegistry.map((visualization) => [
      visualization.id,
      { ...visualization.defaultSettings },
    ]),
  );
}

export function createInitialVisualizationPositions() {
  return Object.fromEntries(
    visualizationRegistry.map((visualization) => [
      visualization.id,
      { ...defaultPosition },
    ]),
  );
}

function getDefaultVisualizationSettings(visualizationId: string) {
  const visualization = visualizationRegistry.find(
    (item) => item.id === visualizationId,
  );

  return visualization ? { ...visualization.defaultSettings } : {};
}

export const initialAppState: AppState = {
  backgroundImage: null,
  audioTrack: null,
  backgroundStatus: "idle",
  audioStatus: "idle",
  backgroundError: null,
  audioError: null,
  videoFormatId: defaultVideoFormatId,
  backgroundMotion: { ...defaultBackgroundMotion },
  selectedVisualizationId: visualizationRegistry[0].id,
  visualizationSettings: createInitialVisualizationSettings(),
  visualizationPositions: createInitialVisualizationPositions(),
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "setBackgroundImage":
      return {
        ...state,
        backgroundImage: action.asset,
        backgroundStatus: "loading",
        backgroundError: null,
      };
    case "setBackgroundMetadata":
      if (!state.backgroundImage) {
        return state;
      }

      return {
        ...state,
        backgroundImage: {
          ...state.backgroundImage,
          width: action.width,
          height: action.height,
        },
        backgroundStatus: "ready",
        backgroundError: null,
      };
    case "setBackgroundError":
      if (action.preserveCurrent && state.backgroundImage) {
        return {
          ...state,
          backgroundStatus: state.backgroundStatus,
          backgroundError: action.message,
        };
      }

      return {
        ...state,
        backgroundImage: null,
        backgroundStatus: "error",
        backgroundError: action.message,
      };
    case "clearBackgroundImage":
      return {
        ...state,
        backgroundImage: null,
        backgroundStatus: "idle",
        backgroundError: null,
      };
    case "setAudioTrack":
      return {
        ...state,
        audioTrack: action.asset,
        audioStatus: "loading",
        audioError: null,
      };
    case "setAudioMetadata":
      if (!state.audioTrack) {
        return state;
      }

      return {
        ...state,
        audioTrack: {
          ...state.audioTrack,
          duration: action.duration,
        },
        audioStatus: "ready",
        audioError: null,
      };
    case "setAudioError":
      return {
        ...state,
        audioStatus: "error",
        audioError: action.message,
      };
    case "clearAudioTrack":
      return {
        ...state,
        audioTrack: null,
        audioStatus: "idle",
        audioError: null,
      };
    case "setSelectedVisualization":
      return {
        ...state,
        selectedVisualizationId: action.visualizationId,
      };
    case "updateVisualizationSetting":
      return {
        ...state,
        visualizationSettings: {
          ...state.visualizationSettings,
          [action.visualizationId]: {
            ...getDefaultVisualizationSettings(action.visualizationId),
            ...state.visualizationSettings[action.visualizationId],
            [action.settingId]: action.value,
          },
        },
      };
    case "resetVisualizationSettings":
      return {
        ...state,
        visualizationSettings: {
          ...state.visualizationSettings,
          [action.visualizationId]: getDefaultVisualizationSettings(
            action.visualizationId,
          ),
        },
      };
    case "setVisualizationPosition":
      return {
        ...state,
        visualizationPositions: {
          ...state.visualizationPositions,
          [action.visualizationId]: action.position,
        },
      };
    case "resetVisualizationPosition":
      return {
        ...state,
        visualizationPositions: {
          ...state.visualizationPositions,
          [action.visualizationId]: { ...defaultPosition },
        },
      };
    case "updateBackgroundMotion":
      return {
        ...state,
        backgroundMotion: {
          ...state.backgroundMotion,
          [action.settingId]: action.value,
        },
      };
    case "resetBackgroundMotion":
      return {
        ...state,
        backgroundMotion: { ...defaultBackgroundMotion },
      };
    case "setVideoFormat":
      return {
        ...state,
        videoFormatId: action.videoFormatId,
      };
    default:
      return state;
  }
}
