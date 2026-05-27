import { useEffect, useRef, useState } from "react";
import type { AudioTrackAsset, BackgroundImageAsset } from "../types/assets";
import type { BackgroundMotionSettings } from "../types/backgroundMotion";
import type { LyricLine, LyricsSettings } from "../types/lyrics";
import type {
  AnyVisualizationDefinition,
  NormalizedPoint,
  VisualizationSettings,
} from "../types/visualization";
import {
  defaultVideoExportFormatId,
  getSupportedVideoExportProfile,
  getVideoExportFormat,
  type VideoExportFormatId,
  type VideoExportProfile,
  videoExportFormats,
} from "../types/videoExport";
import { getVideoFormat, type VideoFormatId } from "../types/videoFormat";
import { formatBytes, formatDuration } from "../utils/formatters";
import {
  createVideoFileName,
  renderProjectVideo,
  type VideoExportProgress,
} from "../utils/videoExport";

type ExportPanelProps = {
  audioElement: HTMLAudioElement | null;
  backgroundImage: BackgroundImageAsset | null;
  audioTrack: AudioTrackAsset | null;
  visualization: AnyVisualizationDefinition;
  settings: VisualizationSettings;
  position: NormalizedPoint;
  videoFormatId: VideoFormatId;
  backgroundMotion: BackgroundMotionSettings;
  lyricLines: LyricLine[];
  lyricsSettings: LyricsSettings;
};

type ExportStatus = "idle" | "rendering" | "complete" | "error";

type PreparedExport = {
  objectUrl: string;
  fileName: string;
};

type FormatSupport = Record<VideoExportFormatId, VideoExportProfile | null>;

const emptyFormatSupport = createEmptyFormatSupport();

export function ExportPanel({
  audioElement,
  backgroundImage,
  audioTrack,
  visualization,
  settings,
  position,
  videoFormatId,
  backgroundMotion,
  lyricLines,
  lyricsSettings,
}: ExportPanelProps) {
  const [selectedFormatId, setSelectedFormatId] =
    useState<VideoExportFormatId>(defaultVideoExportFormatId);
  const [formatSupport, setFormatSupport] =
    useState<FormatSupport>(emptyFormatSupport);
  const [isCheckingSupport, setIsCheckingSupport] = useState(true);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState<VideoExportProgress>({
    framesRendered: 0,
    totalFrames: 0,
    elapsedSeconds: 0,
    durationSeconds: audioTrack?.duration ?? 0,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [preparedExport, setPreparedExport] = useState<PreparedExport | null>(
    null,
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const exportInputKeyRef = useRef("");
  const selectedExportFormat = getVideoExportFormat(selectedFormatId);
  const selectedVideoFormat = getVideoFormat(videoFormatId);
  const selectedProfile = formatSupport[selectedFormatId];
  const isRendering = status === "rendering";
  const allFormatsUnsupported =
    !isCheckingSupport &&
    videoExportFormats.every((format) => !formatSupport[format.id]);
  const mp4Unsupported = !isCheckingSupport && !formatSupport.mp4;
  const exportInputKey = [
    selectedFormatId,
    videoFormatId,
    backgroundImage?.objectUrl ?? "",
    audioTrack?.objectUrl ?? "",
    visualization.id,
    JSON.stringify(settings),
    JSON.stringify(position),
    JSON.stringify(backgroundMotion),
    JSON.stringify(lyricLines),
    JSON.stringify(lyricsSettings),
  ].join("|");
  const missingReason = getMissingReason({
    backgroundImage,
    audioTrack,
    selectedProfile,
    selectedFormatLabel: selectedExportFormat.label,
    isCheckingSupport,
    allFormatsUnsupported,
  });

  useEffect(() => {
    let active = true;
    setIsCheckingSupport(true);
    setFormatSupport(emptyFormatSupport);

    readFormatSupport(
      selectedVideoFormat.exportWidth,
      selectedVideoFormat.exportHeight,
    ).then((nextSupport) => {
      if (!active) {
        return;
      }

      setFormatSupport(nextSupport);
      setIsCheckingSupport(false);

      if (!nextSupport[selectedFormatId]) {
        const firstSupported = videoExportFormats.find(
          (format) => nextSupport[format.id],
        );

        if (firstSupported) {
          setSelectedFormatId(firstSupported.id);
        }
      }
    });

    return () => {
      active = false;
    };
  }, [
    selectedFormatId,
    selectedVideoFormat.exportHeight,
    selectedVideoFormat.exportWidth,
  ]);

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
    if (!backgroundImage || !audioTrack || !selectedProfile) {
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    audioElement?.pause();
    setPreparedExport(null);
    setStatus("rendering");
    setMessage(null);
    setProgress({
      framesRendered: 0,
      totalFrames: 0,
      elapsedSeconds: 0,
      durationSeconds: audioTrack.duration ?? 0,
    });

    try {
      const blob = await renderProjectVideo({
        backgroundImage,
        audioTrack,
        visualization,
        settings,
        position,
        videoFormatId,
        backgroundMotion,
        lyricLines,
        lyricsSettings,
        outputWidth: selectedVideoFormat.exportWidth,
        outputHeight: selectedVideoFormat.exportHeight,
        profile: selectedProfile,
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
          disabled={isRendering || isCheckingSupport}
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
        {selectedVideoFormat.exportHeight} · 30 fps
      </p>

      <div className="export-actions">
        {preparedExport && !isRendering ? (
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
            disabled={Boolean(missingReason) || isRendering}
            data-testid="export-video-button"
            onClick={startExport}
          >
            {isRendering ? "Rendering..." : "Download video"}
          </button>
        )}
        {isRendering ? (
          <button
            type="button"
            className="secondary-button"
            data-testid="cancel-export"
            onClick={cancelExport}
          >
            Cancel
          </button>
        ) : null}
        {preparedExport && !isRendering ? (
          <button
            type="button"
            className="secondary-button"
            data-testid="render-again"
            onClick={startExport}
          >
            Render again
          </button>
        ) : null}
      </div>

      {isRendering ? (
        <p className="export-meta" data-testid="export-progress">
          Rendering video · {formatProgress(progress)}
        </p>
      ) : null}

      {missingReason && !isRendering ? (
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

function createEmptyFormatSupport(): FormatSupport {
  return Object.fromEntries(
    videoExportFormats.map((format) => [format.id, null]),
  ) as FormatSupport;
}

async function readFormatSupport(width: number, height: number) {
  const entries = await Promise.all(
    videoExportFormats.map(async (format) => [
      format.id,
      await getSupportedVideoExportProfile(format.id, {
        width,
        height,
      }),
    ]),
  );

  return Object.fromEntries(entries) as FormatSupport;
}

function getMissingReason({
  backgroundImage,
  audioTrack,
  selectedProfile,
  selectedFormatLabel,
  isCheckingSupport,
  allFormatsUnsupported,
}: {
  backgroundImage: BackgroundImageAsset | null;
  audioTrack: AudioTrackAsset | null;
  selectedProfile: VideoExportProfile | null;
  selectedFormatLabel: string;
  isCheckingSupport: boolean;
  allFormatsUnsupported: boolean;
}) {
  if (!backgroundImage) {
    return "Add a background image before exporting.";
  }

  if (!audioTrack) {
    return "Add an audio track before exporting.";
  }

  if (isCheckingSupport) {
    return "Checking browser export support.";
  }

  if (allFormatsUnsupported) {
    return "This browser cannot render MP4 or WebM with WebCodecs.";
  }

  if (!selectedProfile) {
    return `${selectedFormatLabel} export is not supported in this browser.`;
  }

  return null;
}

function formatProgress(progress: VideoExportProgress) {
  if (!progress.totalFrames) {
    return "Preparing frames";
  }

  return `${progress.framesRendered} / ${
    progress.totalFrames
  } frames · ${formatDuration(progress.elapsedSeconds)} / ${formatDuration(
    progress.durationSeconds,
  )}`;
}
