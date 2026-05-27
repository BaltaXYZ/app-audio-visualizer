import { useCallback, useEffect, useReducer, useState } from "react";
import { AudioPlayer } from "./components/AudioPlayer";
import { ExportPanel } from "./components/ExportPanel";
import { LyricsPanel } from "./components/LyricsPanel";
import { MotionPanel } from "./components/MotionPanel";
import { PreviewStage } from "./components/PreviewStage";
import type { PreviewStageHandle } from "./components/PreviewStage";
import { UploadPanel } from "./components/UploadPanel";
import { VisualizationPicker } from "./components/VisualizationPicker";
import { WorkbenchTabs } from "./components/WorkbenchTabs";
import type { WorkbenchTabId } from "./components/WorkbenchTabs";
import { useAudioAnalyzer } from "./hooks/useAudioAnalyzer";
import { useAudioClock } from "./hooks/useAudioClock";
import { appReducer, initialAppState } from "./state/appReducer";
import type { LocalAsset } from "./types/assets";
import type { LyricsSettings } from "./types/lyrics";
import { createLocalAsset } from "./utils/fileUrls";
import { isAcceptedAudioFile, isAcceptedImageFile } from "./utils/fileValidation";
import { parseLyricsInput } from "./utils/lyrics";
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
  const [previewHandle, setPreviewHandle] =
    useState<PreviewStageHandle | null>(null);
  const [activeWorkbenchTab, setActiveWorkbenchTab] =
    useState<WorkbenchTabId>("files");
  const audioAnalyzer = useAudioAnalyzer(audioElement);
  const currentAudioTime = useAudioClock(audioElement);
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

  const applyLyricsText = useCallback((text: string, draftText?: string) => {
    const result = parseLyricsInput(text);

    if (result.error) {
      dispatch({ type: "setLyricsError", message: result.error });
      return;
    }

    dispatch({
      type: "applyLyricsDraftResult",
      lines: result.lines,
      warning: result.warning,
      draftText,
    });
  }, []);

  const applyLyricsDraft = useCallback(() => {
    applyLyricsText(state.lyricsDraftText);
  }, [applyLyricsText, state.lyricsDraftText]);

  const loadLyricsText = useCallback(
    (text: string) => {
      dispatch({ type: "setLyricsDraftText", text });
      applyLyricsText(text, text);
    },
    [applyLyricsText],
  );

  return (
    <main className="app-shell">
      <section className="workspace" aria-label="Audio Visualizer Studio">
        <WorkbenchTabs
          activeTab={activeWorkbenchTab}
          onTabChange={setActiveWorkbenchTab}
        >
          {activeWorkbenchTab === "files" ? (
            <UploadPanel
              backgroundImage={state.backgroundImage}
              audioTrack={state.audioTrack}
              backgroundStatus={state.backgroundStatus}
              audioStatus={state.audioStatus}
              backgroundError={state.backgroundError}
              audioError={state.audioError}
              onBackgroundSelected={loadBackgroundImage}
              onAudioSelected={loadAudioTrack}
              onClearBackground={() =>
                dispatch({ type: "clearBackgroundImage" })
              }
              onClearAudio={() => dispatch({ type: "clearAudioTrack" })}
            />
          ) : null}

          {activeWorkbenchTab === "lyrics" ? (
            <LyricsPanel
              lines={state.lyricLines}
              draftText={state.lyricsDraftText}
              draftDirty={state.lyricsDraftDirty}
              settings={state.lyricsSettings}
              activeLineId={state.activeLyricLineId}
              currentTime={currentAudioTime}
              error={state.lyricsError}
              warning={state.lyricsWarning}
              onDraftChange={(text) =>
                dispatch({ type: "setLyricsDraftText", text })
              }
              onApplyDraft={applyLyricsDraft}
              onLoadText={loadLyricsText}
              onClear={() => dispatch({ type: "clearLyrics" })}
              onSetLineTime={(lineId, startTime) =>
                dispatch({ type: "setLyricLineTime", lineId, startTime })
              }
              onSetLineTimeAndNext={(lineId, startTime) =>
                dispatch({
                  type: "setLyricLineTimeAndSelectNext",
                  lineId,
                  startTime,
                })
              }
              onClearTiming={() => dispatch({ type: "clearLyricTiming" })}
              onSettingChange={(settingId, value) =>
                dispatch({
                  type: "updateLyricsSetting",
                  settingId: settingId as keyof LyricsSettings,
                  value,
                })
              }
              onResetSettings={() => dispatch({ type: "resetLyricsSettings" })}
            />
          ) : null}

          {activeWorkbenchTab === "visual" ? (
            <VisualizationPicker
              visualizations={visualizationRegistry}
              selectedId={state.selectedVisualizationId}
              settings={selectedSettings}
              onSelect={(visualizationId) =>
                dispatch({ type: "setSelectedVisualization", visualizationId })
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
            />
          ) : null}

          {activeWorkbenchTab === "motion" ? (
            <MotionPanel
              videoFormatId={state.videoFormatId}
              backgroundMotion={state.backgroundMotion}
              onVideoFormatChange={(videoFormatId) =>
                dispatch({ type: "setVideoFormat", videoFormatId })
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
          ) : null}
        </WorkbenchTabs>

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
            lyricLines={state.lyricLines}
            lyricsSettings={state.lyricsSettings}
            audioTime={currentAudioTime}
            onPositionChange={(position) =>
              dispatch({
                type: "setVisualizationPosition",
                visualizationId: state.selectedVisualizationId,
                position,
              })
            }
            onPreviewReady={setPreviewHandle}
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

          <ExportPanel
            previewHandle={previewHandle}
            audioElement={audioElement}
            audioTrack={state.audioTrack}
            hasBackgroundImage={Boolean(state.backgroundImage)}
            videoFormatId={state.videoFormatId}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
