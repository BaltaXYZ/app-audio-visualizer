import { renderPreviewFrame } from "../canvas/renderPreviewFrame";
import type { AudioFrame } from "../types/audio";
import type { BackgroundImageAsset } from "../types/assets";
import type { BackgroundMotionSettings } from "../types/backgroundMotion";
import type { ImageEffectSettings } from "../types/imageEffects";
import type { LyricLine, LyricsSettings } from "../types/lyrics";
import type {
  AnyVisualizationDefinition,
  NormalizedPoint,
  VisualizationSettings,
} from "../types/visualization";
import type { VideoFormatId } from "../types/videoFormat";

export type RealtimeRecordingFormat = {
  id: string;
  label: string;
  extension: string;
  mimeType: string;
};

export type RealtimeRecordingProgress = {
  elapsedSeconds: number;
  durationSeconds: number;
  wallClockSeconds: number;
};

export type RealtimeRecordingResult = {
  blob: Blob;
  format: RealtimeRecordingFormat;
};

type AudioPlaybackLike = {
  currentTime: number;
  paused: boolean;
  pause: () => void;
};

export type AudioPlaybackSnapshot = {
  currentTime: number;
  wasPaused: boolean;
};

export type RecordRealtimeProjectVideoOptions = {
  canvas: HTMLCanvasElement;
  audioElement: HTMLAudioElement;
  backgroundImage: BackgroundImageAsset;
  visualizationEnabled: boolean;
  visualization: AnyVisualizationDefinition;
  settings: VisualizationSettings;
  position: NormalizedPoint;
  videoFormatId: VideoFormatId;
  backgroundMotion: BackgroundMotionSettings;
  imageEffects: ImageEffectSettings;
  lyricLines: LyricLine[];
  lyricsSettings: LyricsSettings;
  outputWidth: number;
  outputHeight: number;
  durationSeconds?: number;
  startAudioAnalysis: () => Promise<void>;
  setAudioMonitorMuted: (muted: boolean) => void;
  getAudioRecordingStream: () => MediaStream | null;
  getAudioFrame: (time: number) => AudioFrame;
  frameRate?: number;
  signal?: AbortSignal;
  onProgress?: (progress: RealtimeRecordingProgress) => void;
};

export const realtimeRecordingFormats: RealtimeRecordingFormat[] = [
  {
    id: "mp4-avc-aac",
    label: "MP4",
    extension: "mp4",
    mimeType: "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  },
  {
    id: "mp4",
    label: "MP4",
    extension: "mp4",
    mimeType: "video/mp4",
  },
  {
    id: "webm-vp9",
    label: "WebM",
    extension: "webm",
    mimeType: "video/webm;codecs=vp9,opus",
  },
  {
    id: "webm-vp8",
    label: "WebM",
    extension: "webm",
    mimeType: "video/webm;codecs=vp8,opus",
  },
  {
    id: "webm",
    label: "WebM",
    extension: "webm",
    mimeType: "video/webm",
  },
];

const defaultFrameRate = 30;
const defaultVideoBitsPerSecond = 6_000_000;
const defaultAudioBitsPerSecond = 192_000;

export function getSupportedRealtimeRecordingFormat(
  isTypeSupported = getDefaultTypeSupport(),
) {
  if (!isTypeSupported) {
    return null;
  }

  return (
    realtimeRecordingFormats.find((format) => isTypeSupported(format.mimeType)) ??
    null
  );
}

export function captureAudioPlaybackSnapshot(
  audioElement: AudioPlaybackLike,
): AudioPlaybackSnapshot {
  return {
    currentTime: audioElement.currentTime,
    wasPaused: audioElement.paused,
  };
}

export function restoreAudioPlaybackSnapshot(
  audioElement: AudioPlaybackLike,
  snapshot: AudioPlaybackSnapshot,
) {
  audioElement.pause();
  audioElement.currentTime = snapshot.currentTime;
}

export function createRealtimeRecordingProgress({
  elapsedSeconds,
  durationSeconds,
  startedAt,
  now = performance.now(),
}: {
  elapsedSeconds: number;
  durationSeconds: number;
  startedAt: number;
  now?: number;
}): RealtimeRecordingProgress {
  return {
    elapsedSeconds: clamp(elapsedSeconds, 0, durationSeconds),
    durationSeconds,
    wallClockSeconds: Math.max(0, (now - startedAt) / 1000),
  };
}

export async function recordRealtimeProjectVideo({
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
  outputWidth,
  outputHeight,
  durationSeconds: expectedDurationSeconds,
  startAudioAnalysis,
  setAudioMonitorMuted,
  getAudioRecordingStream,
  getAudioFrame,
  frameRate = defaultFrameRate,
  signal,
  onProgress,
}: RecordRealtimeProjectVideoOptions): Promise<RealtimeRecordingResult> {
  throwIfAborted(signal);

  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser cannot record video exports.");
  }

  const format = getSupportedRealtimeRecordingFormat();

  if (!format) {
    throw new Error("This browser cannot record MP4 or WebM video exports.");
  }

  if (!canvas.captureStream) {
    throw new Error("Canvas recording is not supported in this browser.");
  }

  const [image] = await Promise.all([loadImage(backgroundImage)]);
  throwIfAborted(signal);

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("The recording canvas could not be created.");
  }

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  await startAudioAnalysis();
  setAudioMonitorMuted(true);
  const audioStream = getAudioRecordingStream();
  const audioTracks = audioStream?.getAudioTracks() ?? [];

  if (!audioTracks.length) {
    setAudioMonitorMuted(false);
    throw new Error("The audio track could not be prepared for recording.");
  }

  const playbackSnapshot = captureAudioPlaybackSnapshot(audioElement);
  const canvasStream = canvas.captureStream(frameRate);
  const videoTracks = canvasStream.getVideoTracks();
  const recordingStream = new MediaStream([...videoTracks, ...audioTracks]);
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(recordingStream, {
    mimeType: format.mimeType,
    videoBitsPerSecond: defaultVideoBitsPerSecond,
    audioBitsPerSecond: defaultAudioBitsPerSecond,
  });
  const durationSeconds = Math.max(
    expectedDurationSeconds ?? 0,
    getAudioDuration(audioElement),
  );
  const startedAt = performance.now();
  let active = true;
  let animationFrame = 0;
  let lastElapsedMs = 0;
  let stopRequested = false;

  const recorderStopped = new Promise<void>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onerror = () => {
      reject(new Error("The video recording could not be completed."));
    };
    recorder.onstop = () => resolve();
  });

  const stopRecorder = () => {
    if (stopRequested) {
      return;
    }

    stopRequested = true;

    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const handleEnded = () => {
    active = false;
    stopRecorder();
  };

  const handleError = () => {
    active = false;
    stopRecorder();
  };

  const handleAbort = () => {
    active = false;
    stopRecorder();
  };

  const renderFrame = () => {
    const currentTimeSeconds = clamp(audioElement.currentTime, 0, durationSeconds);
    const elapsedMs = currentTimeSeconds * 1000;
    const deltaMs = lastElapsedMs ? Math.max(0, elapsedMs - lastElapsedMs) : 16.7;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, outputWidth, outputHeight);
    renderPreviewFrame({
      ctx,
      width: outputWidth,
      height: outputHeight,
      backgroundImage: image,
      visualizationEnabled,
      visualization,
      settings,
      position,
      videoFormatId,
      backgroundMotion,
      imageEffects,
      lyricLines,
      lyricsSettings,
      lyricTimeSeconds: currentTimeSeconds,
      audioFrame: getAudioFrame(elapsedMs),
      elapsedMs,
      deltaMs,
      showPositionHandle: false,
    });

    lastElapsedMs = elapsedMs;
    onProgress?.(
      createRealtimeRecordingProgress({
        elapsedSeconds: currentTimeSeconds,
        durationSeconds,
        startedAt,
      }),
    );
  };

  const draw = () => {
    if (!active) {
      return;
    }

    renderFrame();
    animationFrame = requestAnimationFrame(draw);
  };

  try {
    throwIfAborted(signal);
    audioElement.pause();
    audioElement.currentTime = 0;
    renderFrame();

    audioElement.addEventListener("ended", handleEnded, { once: true });
    audioElement.addEventListener("error", handleError, { once: true });
    signal?.addEventListener("abort", handleAbort, { once: true });

    recorder.start(1000);
    await audioElement.play();
    animationFrame = requestAnimationFrame(draw);
    await recorderStopped;

    if (signal?.aborted) {
      throw new DOMException("Export cancelled.", "AbortError");
    }

    if (audioElement.error) {
      throw new Error("The audio track could not be played during recording.");
    }
  } finally {
    active = false;
    cancelAnimationFrame(animationFrame);
    if (recorder.state !== "inactive") {
      stopRecorder();
      await recorderStopped.catch(() => undefined);
    }
    audioElement.removeEventListener("ended", handleEnded);
    audioElement.removeEventListener("error", handleError);
    signal?.removeEventListener("abort", handleAbort);
    videoTracks.forEach((track) => track.stop());
    setAudioMonitorMuted(false);
    restoreAudioPlaybackSnapshot(audioElement, playbackSnapshot);
  }

  if (!chunks.length) {
    throw new Error("No video data was recorded.");
  }

  return {
    blob: new Blob(chunks, { type: format.mimeType }),
    format,
  };
}

function getDefaultTypeSupport() {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }

  return MediaRecorder.isTypeSupported.bind(MediaRecorder);
}

async function loadImage(asset: BackgroundImageAsset) {
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () =>
      reject(new Error("The background image could not be loaded for export."));
    image.src = asset.objectUrl;
  });

  return image;
}

function getAudioDuration(audioElement: HTMLAudioElement) {
  return Number.isFinite(audioElement.duration) && audioElement.duration > 0
    ? audioElement.duration
    : 0;
}

function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) {
    throw new DOMException("Export cancelled.", "AbortError");
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
