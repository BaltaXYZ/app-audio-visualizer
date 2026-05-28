import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { AudioTrackAsset, BackgroundImageAsset } from "../types/assets";
import type { BackgroundMotionSettings } from "../types/backgroundMotion";
import type { ImageEffectSettings } from "../types/imageEffects";
import type { LyricLine, LyricsSettings } from "../types/lyrics";
import type {
  AnyVisualizationDefinition,
  NormalizedPoint,
  VisualizationSettings,
} from "../types/visualization";
import { getVideoFormat, type VideoFormatId } from "../types/videoFormat";
import { formatBytes, formatDuration } from "../utils/formatters";
import { createVideoFileName } from "../utils/videoExport";
import {
  getSupportedRealtimeRecordingFormat,
  recordRealtimeProjectVideo,
  type RealtimeRecordingProgress,
} from "../utils/realtimeVideoExport";
import type { AudioFrame } from "../types/audio";

type ExportPanelProps = {
  audioElement: HTMLAudioElement | null;
  backgroundImage: BackgroundImageAsset | null;
  audioTrack: AudioTrackAsset | null;
  getAudioFrame: (time: number) => AudioFrame;
  startAudioAnalysis: () => Promise<void>;
  setAudioMonitorMuted: (muted: boolean) => void;
  getAudioRecordingStream: () => MediaStream | null;
  onRecordingStateChange: (isRecording: boolean) => void;
  onNewVideo: () => boolean;
  visualizationEnabled: boolean;
  visualization: AnyVisualizationDefinition;
  settings: VisualizationSettings;
  position: NormalizedPoint;
  videoFormatId: VideoFormatId;
  backgroundMotion: BackgroundMotionSettings;
  imageEffects: ImageEffectSettings;
  lyricLines: LyricLine[];
  lyricsSettings: LyricsSettings;
};

type ExportStatus = "idle" | "preparing" | "recording" | "complete" | "error";

type PreparedExport = {
  objectUrl: string;
  fileName: string;
};

const progressUpdateIntervalMs = 250;

export function ExportPanel({
  audioElement,
  backgroundImage,
  audioTrack,
  getAudioFrame,
  startAudioAnalysis,
  setAudioMonitorMuted,
  getAudioRecordingStream,
  onRecordingStateChange,
  onNewVideo,
  visualizationEnabled,
  visualization,
  settings,
  position,
  videoFormatId,
  backgroundMotion,
  imageEffects,
  lyricLines,
  lyricsSettings,
}: ExportPanelProps) {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState<RealtimeRecordingProgress>({
    elapsedSeconds: 0,
    durationSeconds: audioTrack?.duration ?? 0,
    wallClockSeconds: 0,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [preparedExport, setPreparedExport] = useState<PreparedExport | null>(
    null,
  );
  const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const exportInputKeyRef = useRef("");
  const lastProgressUpdateAtRef = useRef(0);
  const selectedVideoFormat = getVideoFormat(videoFormatId);
  const selectedRecordingFormat = getSupportedRealtimeRecordingFormat();
  const isRecording = status === "preparing" || status === "recording";
  const exportInputKey = [
    videoFormatId,
    backgroundImage?.objectUrl ?? "",
    audioTrack?.objectUrl ?? "",
    String(visualizationEnabled),
    visualization.id,
    JSON.stringify(settings),
    JSON.stringify(position),
    JSON.stringify(backgroundMotion),
    JSON.stringify(imageEffects),
    JSON.stringify(lyricLines),
    JSON.stringify(lyricsSettings),
  ].join("|");
  const missingReason = getMissingReason({
    backgroundImage,
    audioTrack,
    audioElement,
    selectedRecordingFormat,
  });

  useEffect(() => {
    return () => {
      if (preparedExport) {
        URL.revokeObjectURL(preparedExport.objectUrl);
      }
    };
  }, [preparedExport]);

  useEffect(() => {
    if (isRecording) {
      cancelButtonRef.current?.focus();
    }
  }, [isRecording]);

  useEffect(() => {
    onRecordingStateChange(isRecording);
    return () => onRecordingStateChange(false);
  }, [isRecording, onRecordingStateChange]);

  useEffect(() => {
    if (!exportInputKeyRef.current) {
      exportInputKeyRef.current = exportInputKey;
      return;
    }

    if (exportInputKeyRef.current === exportInputKey) {
      return;
    }

    exportInputKeyRef.current = exportInputKey;
    setPreparedExport(null);
    setMessage(null);
    setStatus((currentStatus) =>
      currentStatus === "complete" ? "idle" : currentStatus,
    );
  }, [exportInputKey]);

  const startExport = async () => {
    if (
      !backgroundImage ||
      !audioTrack ||
      !audioElement ||
      !selectedRecordingFormat
    ) {
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    audioElement?.pause();
    setPreparedExport(null);
    setStatus("preparing");
    setMessage(null);
    setProgress({
      elapsedSeconds: 0,
      durationSeconds: audioTrack.duration ?? 0,
      wallClockSeconds: 0,
    });
    lastProgressUpdateAtRef.current = 0;

    try {
      await waitForNextFrame();

      const canvas = recordingCanvasRef.current;

      if (!canvas) {
        throw new Error("The recording preview could not be created.");
      }

      const result = await recordRealtimeProjectVideo({
        canvas,
        audioElement,
        backgroundImage,
        visualizationEnabled,
        visualization,
        settings,
        position,
        videoFormatId,
        backgroundMotion,
        imageEffects,
        lyricLines,
        lyricsSettings,
        outputWidth: selectedVideoFormat.exportWidth,
        outputHeight: selectedVideoFormat.exportHeight,
        durationSeconds: audioTrack.duration,
        startAudioAnalysis,
        setAudioMonitorMuted,
        getAudioRecordingStream,
        getAudioFrame,
        signal: abortController.signal,
        onProgress: (nextProgress) => {
          const now = performance.now();
          const isFirstProgress = nextProgress.elapsedSeconds <= 0.05;
          const isFinalProgress =
            nextProgress.elapsedSeconds >= nextProgress.durationSeconds - 0.05;

          if (
            isFirstProgress ||
            isFinalProgress ||
            now - lastProgressUpdateAtRef.current >= progressUpdateIntervalMs
          ) {
            lastProgressUpdateAtRef.current = now;
            setStatus("recording");
            setProgress(nextProgress);
          }
        },
      });

      if (abortController.signal.aborted) {
        setStatus("idle");
        setMessage("Export cancelled.");
        return;
      }

      const fileName = createVideoFileName(result.format.extension);
      const objectUrl = URL.createObjectURL(result.blob);

      setPreparedExport({
        objectUrl,
        fileName,
      });
      setStatus("complete");
      setMessage(
        `${result.format.label} video ready (${formatBytes(
          result.blob.size,
        )}). Use Save video to download it.`,
      );
    } catch (error) {
      if (abortController.signal.aborted) {
        setStatus("idle");
        setMessage("Export cancelled.");
        return;
      }

      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "The video export could not be completed.",
      );
    } finally {
      abortControllerRef.current = null;
    }
  };

  const cancelExport = () => {
    abortControllerRef.current?.abort();
  };

  const startNewVideo = () => {
    const didReset = onNewVideo();

    if (!didReset) {
      return;
    }

    setPreparedExport(null);
    setMessage(null);
    setStatus("idle");
    setProgress({
      elapsedSeconds: 0,
      durationSeconds: 0,
      wallClockSeconds: 0,
    });
  };

  return (
    <section className="export-card" aria-label="Video export">
      <div>
        <p className="eyebrow">Export</p>
        <h2>Download video</h2>
      </div>

      <p className="export-meta">
        {selectedVideoFormat.label} · {selectedVideoFormat.exportWidth} x{" "}
        {selectedVideoFormat.exportHeight} · 30 fps · real-time recording
      </p>

      <div className="export-actions">
        {preparedExport && !isRecording ? (
          <a
            className="primary-button"
            href={preparedExport.objectUrl}
            download={preparedExport.fileName}
            data-testid="save-video-link"
          >
            Save video
          </a>
        ) : (
          <button
            type="button"
            className="primary-button"
            disabled={Boolean(missingReason) || isRecording}
            data-testid="export-video-button"
            onClick={startExport}
          >
            {isRecording ? "Recording..." : "Download video"}
          </button>
        )}
        {preparedExport && !isRecording ? (
          <button
            type="button"
            className="secondary-button"
            data-testid="render-again"
            onClick={startExport}
          >
            Render again
          </button>
        ) : null}
        {preparedExport && !isRecording ? (
          <button
            type="button"
            className="secondary-button"
            data-testid="new-video-after-export"
            onClick={startNewVideo}
          >
            New video
          </button>
        ) : null}
      </div>

      {missingReason && !isRecording ? (
        <p className="export-meta">{missingReason}</p>
      ) : null}

      {message ? (
        <p
          className={`status-message ${status === "error" ? "error" : "info"}`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}

      {isRecording ? (
        <div
          className="export-recording-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-recording-title"
          onKeyDown={trapRecordingDialogFocus}
        >
          <div className="export-recording-dialog">
            <div className="export-recording-header">
              <div>
                <p className="eyebrow">Export</p>
                <h2 id="export-recording-title">Recording video</h2>
              </div>
              <button
                type="button"
                className="secondary-button"
                data-testid="cancel-export"
                ref={cancelButtonRef}
                onClick={cancelExport}
              >
                Cancel
              </button>
            </div>
            <div className="export-recording-preview">
              <canvas
                ref={recordingCanvasRef}
                aria-label="Recorded video preview"
                data-testid="recording-canvas"
              />
            </div>
            <p className="export-meta" data-testid="export-progress">
              {status === "preparing"
                ? "Preparing silent recording."
                : `Recording video · ${formatProgress(progress)}`}
            </p>
            <p className="status-message info" role="status">
              Sound is captured silently.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getMissingReason({
  backgroundImage,
  audioTrack,
  audioElement,
  selectedRecordingFormat,
}: {
  backgroundImage: BackgroundImageAsset | null;
  audioTrack: AudioTrackAsset | null;
  audioElement: HTMLAudioElement | null;
  selectedRecordingFormat: ReturnType<typeof getSupportedRealtimeRecordingFormat>;
}) {
  if (!backgroundImage) {
    return "Add a background image before exporting.";
  }

  if (!audioTrack) {
    return "Add an audio track before exporting.";
  }

  if (!audioElement) {
    return "The audio player is still loading.";
  }

  if (!selectedRecordingFormat) {
    return "This browser cannot record MP4 or WebM video.";
  }

  return null;
}

function formatProgress(progress: RealtimeRecordingProgress) {
  return `${formatDuration(progress.elapsedSeconds)} / ${formatDuration(
    progress.durationSeconds,
  )}`;
}

function trapRecordingDialogFocus(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== "Tab") {
    return;
  }

  event.preventDefault();
  const cancelButton = event.currentTarget.querySelector<HTMLButtonElement>(
    "[data-testid='cancel-export']",
  );
  cancelButton?.focus();
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}
