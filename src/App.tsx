import { useCallback, useEffect, useReducer, useState } from "react";
import { AudioPlayer } from "./components/AudioPlayer";
import { PreviewStage } from "./components/PreviewStage";
import { UploadPanel } from "./components/UploadPanel";
import { VisualizationPicker } from "./components/VisualizationPicker";
import { useAudioAnalyzer } from "./hooks/useAudioAnalyzer";
import { appReducer, initialAppState } from "./state/appReducer";
import type { LocalAsset } from "./types/assets";
import { createLocalAsset } from "./utils/fileUrls";
import { isAcceptedAudioFile, isAcceptedImageFile } from "./utils/fileValidation";
import {
  getVisualizationById,
  visualizationRegistry,
} from "./visualizations/registry";

const imageError =
  "The image could not be read. Choose a standard image file such as JPG, PNG, SVG or WebP.";
const imageKeptError =
  "That file is not a supported image. The current background was kept.";
const audioError =
  "The audio file could not be read. Choose a standard audio file such as MP3, WAV, M4A or OGG.";
const audioKeptError =
  "That file is not a supported audio file. The current track was kept.";

function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const audioAnalyzer = useAudioAnalyzer(audioElement);
  const selectedVisualization = getVisualizationById(
    state.selectedVisualizationId,
  );
  const selectedSettings =
    state.visualizationSettings[state.selectedVisualizationId] ??
    selectedVisualization.defaultSettings;
  const selectedPosition =
    state.visualizationPositions[state.selectedVisualizationId] ?? {
      x: 0.5,
      y: 0.5,
    };

  useEffect(() => {
    const objectUrl = state.backgroundImage?.objectUrl;
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [state.backgroundImage?.objectUrl]);

  useEffect(() => {
    const objectUrl = state.audioTrack?.objectUrl;
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [state.audioTrack?.objectUrl]);

  const loadBackgroundImage = useCallback(
    (file: File | null) => {
      if (!file) {
        return;
      }

      if (!isAcceptedImageFile(file)) {
        const hasCurrentImage = Boolean(state.backgroundImage);
        dispatch({
          type: "setBackgroundError",
          message: hasCurrentImage ? imageKeptError : imageError,
          preserveCurrent: hasCurrentImage,
        });
        return;
      }

      const asset: LocalAsset = createLocalAsset(file);
      dispatch({ type: "setBackgroundImage", asset });

      const image = new Image();
      image.onload = () => {
        dispatch({
          type: "setBackgroundMetadata",
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      };
      image.onerror = () => {
        dispatch({ type: "setBackgroundError", message: imageError });
      };
      image.src = asset.objectUrl;
    },
    [state.backgroundImage],
  );

  const loadAudioTrack = useCallback(
    (file: File | null) => {
      if (!file) {
        return;
      }

      if (!isAcceptedAudioFile(file)) {
        dispatch({
          type: "setAudioError",
          message: state.audioTrack ? audioKeptError : audioError,
        });
        return;
      }

      dispatch({ type: "setAudioTrack", asset: createLocalAsset(file) });
    },
    [state.audioTrack],
  );

  return (
    <main className="app-shell">
      <section className="workspace" aria-label="Audio Visualizer Studio">
        <UploadPanel
          backgroundImage={state.backgroundImage}
          audioTrack={state.audioTrack}
          backgroundStatus={state.backgroundStatus}
          audioStatus={state.audioStatus}
          backgroundError={state.backgroundError}
          audioError={state.audioError}
          onBackgroundSelected={loadBackgroundImage}
          onAudioSelected={loadAudioTrack}
          onClearBackground={() => dispatch({ type: "clearBackgroundImage" })}
          onClearAudio={() => dispatch({ type: "clearAudioTrack" })}
        />

        <VisualizationPicker
          visualizations={visualizationRegistry}
          selectedId={state.selectedVisualizationId}
          settings={selectedSettings}
          videoFormatId={state.videoFormatId}
          backgroundMotion={state.backgroundMotion}
          onSelect={(visualizationId) =>
            dispatch({ type: "setSelectedVisualization", visualizationId })
          }
          onVideoFormatChange={(videoFormatId) =>
            dispatch({ type: "setVideoFormat", videoFormatId })
          }
          onSettingChange={(settingId, value) =>
            dispatch({
              type: "updateVisualizationSetting",
              visualizationId: state.selectedVisualizationId,
              settingId,
              value,
            })
          }
          onResetSettings={() =>
            dispatch({
              type: "resetVisualizationSettings",
              visualizationId: state.selectedVisualizationId,
            })
          }
          onResetPosition={() =>
            dispatch({
              type: "resetVisualizationPosition",
              visualizationId: state.selectedVisualizationId,
            })
          }
          onBackgroundMotionChange={(settingId, value) =>
            dispatch({
              type: "updateBackgroundMotion",
              settingId,
              value,
            })
          }
          onResetBackgroundMotion={() =>
            dispatch({ type: "resetBackgroundMotion" })
          }
        />

        <div className="studio-surface">
          <PreviewStage
            backgroundImage={state.backgroundImage}
            status={state.backgroundStatus}
            error={state.backgroundError}
            visualization={selectedVisualization}
            settings={selectedSettings}
            position={selectedPosition}
            videoFormatId={state.videoFormatId}
            backgroundMotion={state.backgroundMotion}
            onPositionChange={(position) =>
              dispatch({
                type: "setVisualizationPosition",
                visualizationId: state.selectedVisualizationId,
                position,
              })
            }
            getAudioFrame={audioAnalyzer.getAudioFrame}
          />

          <AudioPlayer
            audioTrack={state.audioTrack}
            status={state.audioStatus}
            error={state.audioError}
            analyzerStatus={audioAnalyzer.status}
            analyzerError={audioAnalyzer.error}
            onAudioElementChange={setAudioElement}
            onMetadata={(duration) =>
              dispatch({ type: "setAudioMetadata", duration })
            }
            onPlaybackError={() =>
              dispatch({
                type: "setAudioError",
                message:
                  "The audio file could not be played. Choose another audio file.",
              })
            }
          />
        </div>
      </section>
    </main>
  );
}

export default App;
