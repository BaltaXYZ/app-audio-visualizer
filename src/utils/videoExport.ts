import type { StageRect } from "../components/PreviewStage";

type CaptureCanvas = HTMLCanvasElement & {
  captureStream?: (frameRate?: number) => MediaStream;
};

type CaptureAudioElement = HTMLAudioElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
};

export type VideoExportProgress = {
  elapsedSeconds: number;
  durationSeconds: number | null;
};

export type RecordPreviewVideoOptions = {
  previewCanvas: HTMLCanvasElement;
  getStage: () => StageRect;
  audioElement: HTMLAudioElement;
  outputWidth: number;
  outputHeight: number;
  mimeType: string;
  frameRate?: number;
  signal?: AbortSignal;
  onProgress?: (progress: VideoExportProgress) => void;
};

export async function recordPreviewVideo({
  previewCanvas,
  getStage,
  audioElement,
  outputWidth,
  outputHeight,
  mimeType,
  frameRate = 30,
  signal,
  onProgress,
}: RecordPreviewVideoOptions) {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Video export is not supported in this browser.");
  }

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = outputWidth;
  exportCanvas.height = outputHeight;

  const exportContext = exportCanvas.getContext("2d");
  if (!exportContext) {
    throw new Error("The export canvas could not be created.");
  }

  const canvasStream = (exportCanvas as CaptureCanvas).captureStream?.(
    frameRate,
  );
  if (!canvasStream) {
    throw new Error("Canvas video capture is not supported in this browser.");
  }

  let audioStream: MediaStream | null = null;
  let combinedStream: MediaStream | null = null;
  let recorder: MediaRecorder;

  try {
    audioStream = captureAudioStream(audioElement);
    const audioTracks = audioStream.getAudioTracks();

    if (audioTracks.length === 0) {
      throw new Error("The audio track could not be captured for export.");
    }

    combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioTracks,
    ]);
    recorder = new MediaRecorder(combinedStream, { mimeType });
  } catch (error) {
    stopTracks(canvasStream);
    if (audioStream) {
      stopTracks(audioStream);
    }
    if (combinedStream) {
      stopTracks(combinedStream);
    }
    throw error;
  }

  if (!audioStream || !combinedStream) {
    stopTracks(canvasStream);
    throw new Error("The export media stream could not be created.");
  }
  const chunks: Blob[] = [];
  const durationSeconds =
    Number.isFinite(audioElement.duration) && audioElement.duration > 0
      ? audioElement.duration
      : null;
  let animationFrame = 0;
  let progressTimer = 0;
  let settled = false;
  let rejectRecording: ((error: Error) => void) | null = null;

  const drawFrame = () => {
    copyPreviewStageToExport(
      previewCanvas,
      getStage(),
      exportContext,
      outputWidth,
      outputHeight,
    );
    animationFrame = window.requestAnimationFrame(drawFrame);
  };

  const stopRecording = () => {
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const failRecording = (error: Error) => {
    if (!settled) {
      settled = true;
      rejectRecording?.(error);
    }

    stopRecording();
  };

  const handleAudioError = () => {
    failRecording(new Error("The audio playback failed during export."));
  };

  const cleanup = () => {
    window.cancelAnimationFrame(animationFrame);
    window.clearInterval(progressTimer);
    audioElement.removeEventListener("ended", stopRecording);
    audioElement.removeEventListener("error", handleAudioError);
    signal?.removeEventListener("abort", stopRecording);
    stopTracks(canvasStream);
    stopTracks(audioStream);
    stopTracks(combinedStream);
  };

  const recording = new Promise<Blob>((resolve, reject) => {
    rejectRecording = reject;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onerror = () => {
      failRecording(new Error("The video recording failed."));
    };

    recorder.onstop = () => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(new Blob(chunks, { type: baseMimeType(mimeType) }));
    };
  });

  signal?.addEventListener("abort", stopRecording);
  audioElement.addEventListener("ended", stopRecording);
  audioElement.addEventListener("error", handleAudioError);

  try {
    await seekToStart(audioElement);
    drawFrame();
    recorder.start(250);
    await audioElement.play();

    progressTimer = window.setInterval(() => {
      onProgress?.({
        elapsedSeconds: audioElement.currentTime,
        durationSeconds,
      });
    }, 250);

    onProgress?.({
      elapsedSeconds: audioElement.currentTime,
      durationSeconds,
    });

    const blob = await recording;
    audioElement.pause();
    return blob;
  } catch (error) {
    stopRecording();
    throw error;
  } finally {
    cleanup();
  }
}

export function createVideoFileName(extension: string, date = new Date()) {
  const timestamp = date
    .toISOString()
    .replace(/\.\d{3}Z$/, "")
    .replace(/[:T]/g, "-");

  return `audio-visualizer-${timestamp}.${extension}`;
}

function copyPreviewStageToExport(
  previewCanvas: HTMLCanvasElement,
  stage: StageRect,
  exportContext: CanvasRenderingContext2D,
  outputWidth: number,
  outputHeight: number,
) {
  const bounds = previewCanvas.getBoundingClientRect();
  const scaleX = previewCanvas.width / Math.max(1, bounds.width);
  const scaleY = previewCanvas.height / Math.max(1, bounds.height);
  const sourceX = Math.max(0, stage.x * scaleX);
  const sourceY = Math.max(0, stage.y * scaleY);
  const sourceWidth = Math.max(1, stage.width * scaleX);
  const sourceHeight = Math.max(1, stage.height * scaleY);

  exportContext.clearRect(0, 0, outputWidth, outputHeight);
  exportContext.fillStyle = "#151817";
  exportContext.fillRect(0, 0, outputWidth, outputHeight);
  exportContext.drawImage(
    previewCanvas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  );
}

function captureAudioStream(audioElement: HTMLAudioElement) {
  const captureElement = audioElement as CaptureAudioElement;
  const stream =
    captureElement.captureStream?.() ?? captureElement.mozCaptureStream?.();

  if (!stream) {
    throw new Error("Audio capture is not supported in this browser.");
  }

  return stream;
}

function stopTracks(stream: MediaStream) {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

async function seekToStart(audioElement: HTMLAudioElement) {
  audioElement.pause();

  if (!Number.isFinite(audioElement.duration) || audioElement.currentTime < 0.05) {
    audioElement.currentTime = 0;
    return;
  }

  await new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(timeout);
      audioElement.removeEventListener("seeked", finish);
      resolve();
    };
    const timeout = window.setTimeout(finish, 1000);
    audioElement.addEventListener("seeked", finish);
    audioElement.currentTime = 0;
  });
}

function baseMimeType(mimeType: string) {
  return mimeType.split(";")[0] || mimeType;
}
