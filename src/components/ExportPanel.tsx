import { useEffect, useRef, useState } from "react";
import type { PreviewStageHandle } from "./PreviewStage";
import type { AudioTrackAsset } from "../types/assets";
import {
  defaultVideoExportFormatId,
  getSupportedExportMimeType,
  getVideoExportFormat,
  type VideoExportFormatId,
  videoExportFormats,
} from "../types/videoExport";
import { getVideoFormat, type VideoFormatId } from "../types/videoFormat";
import { formatBytes, formatDuration } from "../utils/formatters";
import {
  createVideoFileName,
  recordPreviewVideo,
  type VideoExportProgress,
} from "../utils/videoExport";

type ExportPanelProps = {
  previewHandle: PreviewStageHandle | null;
  audioElement: HTMLAudioElement | null;
  audioTrack: AudioTrackAsset | null;
  hasBackgroundImage: boolean;
  videoFormatId: VideoFormatId;
};

type ExportStatus = "idle" | "recording" | "complete" | "error";

type PreparedExport = {
  objectUrl: string;
  fileName: string;
};

export function ExportPanel({
  previewHandle,
  audioElement,
  audioTrack,
  hasBackgroundImage,
  videoFormatId,
}: ExportPanelProps) {
  const [selectedFormatId, setSelectedFormatId] =
    useState<VideoExportFormatId>(defaultVideoExportFormatId);
  const [formatSupport, setFormatSupport] = useState(readFormatSupport);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState<VideoExportProgress>({
    elapsedSeconds: 0,
    durationSeconds: null,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [preparedExport, setPreparedExport] = useState<PreparedExport | null>(
    null,
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const exportInputKeyRef = useRef("");
  const selectedExportFormat = getVideoExportFormat(selectedFormatId);
  const selectedVideoFormat = getVideoFormat(videoFormatId);
  const selectedMimeType = formatSupport[selectedFormatId];
  const isRecording = status === "recording";
  const exportInputKey = [
    selectedFormatId,
    videoFormatId,
    audioTrack?.objectUrl ?? "",
    hasBackgroundImage ? "image" : "no-image",
  ].join("|");
  const missingReason = getMissingReason({
    hasBackgroundImage,
    audioTrack,
    audioElement,
    previewHandle,
    selectedMimeType,
    selectedFormatLabel: selectedExportFormat.label,
  });
  const mp4Unsupported = !formatSupport.mp4;

  useEffect(() => {
    const nextSupport = readFormatSupport();
    setFormatSupport(nextSupport);

    if (!nextSupport[selectedFormatId]) {
      const firstSupported = videoExportFormats.find(
        (format) => nextSupport[format.id],
      );

      if (firstSupported) {
        setSelectedFormatId(firstSupported.id);
      }
    }
  }, [selectedFormatId]);

  useEffect(() => {
    return () => {
      if (preparedExport) {
        URL.revokeObjectURL(preparedExport.objectUrl);
      }
    };
  }, [preparedExport]);

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
      !previewHandle ||
      !audioElement ||
      !audioTrack ||
      !hasBackgroundImage ||
      !selectedMimeType
    ) {
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setPreparedExport(null);
    setStatus("recording");
    setMessage(null);
    setProgress({
      elapsedSeconds: 0,
      durationSeconds: audioTrack.duration ?? null,
    });

    try {
      const blob = await recordPreviewVideo({
        previewCanvas: previewHandle.canvas,
        getStage: previewHandle.getStage,
        audioElement,
        outputWidth: selectedVideoFormat.exportWidth,
        outputHeight: selectedVideoFormat.exportHeight,
        mimeType: selectedMimeType,
        signal: abortController.signal,
        onProgress: setProgress,
      });

      if (abortController.signal.aborted) {
        setStatus("idle");
        setMessage("Export cancelled.");
        return;
      }

      const fileName = createVideoFileName(selectedExportFormat.extension);
      const objectUrl = URL.createObjectURL(blob);

      setPreparedExport({
        objectUrl,
        fileName,
      });
      setStatus("complete");
      setMessage(
        `${selectedExportFormat.label} video ready (${formatBytes(
          blob.size,
        )}). Use Save video to download it.`,
      );
    } catch (error) {
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

  return (
    <section className="export-card" aria-label="Video export">
      <div>
        <p className="eyebrow">Export</p>
        <h2>Download video</h2>
      </div>

      <label className="control-field">
        <span className="control-label">Download format</span>
        <select
          value={selectedFormatId}
          disabled={isRecording}
          data-testid="export-format-select"
          onChange={(event) =>
            setSelectedFormatId(event.currentTarget.value as VideoExportFormatId)
          }
        >
          {videoExportFormats.map((format) => (
            <option
              key={format.id}
              value={format.id}
              disabled={!formatSupport[format.id]}
            >
              {format.label} (.{format.extension})
              {formatSupport[format.id] ? "" : " - not supported here"}
            </option>
          ))}
        </select>
      </label>

      <p className="export-meta">
        {selectedVideoFormat.label} · {selectedVideoFormat.exportWidth} x{" "}
        {selectedVideoFormat.exportHeight}
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
        {isRecording ? (
          <button
            type="button"
            className="secondary-button"
            data-testid="cancel-export"
            onClick={cancelExport}
          >
            Cancel
          </button>
        ) : null}
        {preparedExport && !isRecording ? (
          <button
            type="button"
            className="secondary-button"
            data-testid="record-again"
            onClick={startExport}
          >
            Record again
          </button>
        ) : null}
      </div>

      {isRecording ? (
        <p className="export-meta" data-testid="export-progress">
          Recording in real time · {formatProgress(progress)}
        </p>
      ) : null}

      {missingReason && !isRecording ? (
        <p className="export-meta">{missingReason}</p>
      ) : null}

      {mp4Unsupported ? (
        <p className="export-meta">
          MP4 export is not supported in this browser; WebM is available when
          supported.
        </p>
      ) : null}

      {message ? (
        <p
          className={`status-message ${status === "error" ? "error" : "info"}`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}

function readFormatSupport(): Record<VideoExportFormatId, string | null> {
  return Object.fromEntries(
    videoExportFormats.map((format) => [
      format.id,
      getSupportedExportMimeType(format.id),
    ]),
  ) as Record<VideoExportFormatId, string | null>;
}

function getMissingReason({
  hasBackgroundImage,
  audioTrack,
  audioElement,
  previewHandle,
  selectedMimeType,
  selectedFormatLabel,
}: {
  hasBackgroundImage: boolean;
  audioTrack: AudioTrackAsset | null;
  audioElement: HTMLAudioElement | null;
  previewHandle: PreviewStageHandle | null;
  selectedMimeType: string | null;
  selectedFormatLabel: string;
}) {
  if (!hasBackgroundImage) {
    return "Add a background image before exporting.";
  }

  if (!audioTrack) {
    return "Add an audio track before exporting.";
  }

  if (!previewHandle) {
    return "Preview is not ready yet.";
  }

  if (!audioElement) {
    return "Audio player is not ready yet.";
  }

  if (!selectedMimeType) {
    return `${selectedFormatLabel} export is not supported in this browser.`;
  }

  return null;
}

function formatProgress(progress: VideoExportProgress) {
  if (!progress.durationSeconds) {
    return formatDuration(progress.elapsedSeconds);
  }

  return `${formatDuration(progress.elapsedSeconds)} / ${formatDuration(
    progress.durationSeconds,
  )}`;
}
