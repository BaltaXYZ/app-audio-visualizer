import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  WebMOutputFormat,
} from "mediabunny";
import {
  buildOfflineAudioTimeline,
  getOfflineAudioFrameAtTime,
} from "../audio/offlineAudioAnalyzer";
import { renderPreviewFrame } from "../canvas/renderPreviewFrame";
import type { AudioTrackAsset, BackgroundImageAsset } from "../types/assets";
import type { BackgroundMotionSettings } from "../types/backgroundMotion";
import type { ImageEffectSettings } from "../types/imageEffects";
import type { LyricLine, LyricsSettings } from "../types/lyrics";
import type {
  AnyVisualizationDefinition,
  NormalizedPoint,
  VisualizationSettings,
} from "../types/visualization";
import type { VideoExportProfile } from "../types/videoExport";
import type { VideoFormatId } from "../types/videoFormat";

type BrowserAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export type VideoExportProgress = {
  framesRendered: number;
  totalFrames: number;
  elapsedSeconds: number;
  durationSeconds: number;
  wallClockSeconds?: number;
  framesPerSecond?: number;
  estimatedRemainingSeconds?: number | null;
};

type VideoExportDiagnostics = {
  loadAndDecodeMs: number;
  audioTimelineMs: number;
  audioEncodeMs: number;
  renderMs: number;
  videoEncodeMs: number;
  finalizeMs: number;
  totalMs: number;
  framesRendered: number;
  framesPerSecond: number;
  realtimeFactor: number;
};

export type ExportFrameSample = {
  index: number;
  timestampSeconds: number;
  durationSeconds: number;
};

export type RenderProjectVideoOptions = {
  backgroundImage: BackgroundImageAsset;
  audioTrack: AudioTrackAsset;
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
  profile: VideoExportProfile;
  frameRate?: number;
  signal?: AbortSignal;
  onProgress?: (progress: VideoExportProgress) => void;
};

const defaultFrameRate = 30;

export async function renderProjectVideo({
  backgroundImage,
  audioTrack,
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
  profile,
  frameRate = defaultFrameRate,
  signal,
  onProgress,
}: RenderProjectVideoOptions) {
  throwIfAborted(signal);

  const exportStartedAt = performance.now();
  const diagnostics: VideoExportDiagnostics = {
    loadAndDecodeMs: 0,
    audioTimelineMs: 0,
    audioEncodeMs: 0,
    renderMs: 0,
    videoEncodeMs: 0,
    finalizeMs: 0,
    totalMs: 0,
    framesRendered: 0,
    framesPerSecond: 0,
    realtimeFactor: 0,
  };
  const loadStartedAt = performance.now();
  const [image, audioBuffer] = await Promise.all([
    loadImage(backgroundImage),
    decodeAudioFile(audioTrack.file),
  ]);
  diagnostics.loadAndDecodeMs = performance.now() - loadStartedAt;
  throwIfAborted(signal);

  const timelineStartedAt = performance.now();
  const timeline = buildOfflineAudioTimeline(audioBuffer, {
    frameRate,
    signal,
  });
  diagnostics.audioTimelineMs = performance.now() - timelineStartedAt;
  const frameSchedule = createExportFrameSchedule(
    timeline.durationSeconds,
    frameRate,
  );
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("The export canvas could not be created.");
  }

  const target = new BufferTarget();
  const output = new Output({
    format:
      profile.format.container === "mp4"
        ? new Mp4OutputFormat()
        : new WebMOutputFormat(),
    target,
  });
  const videoSource = new CanvasSource(canvas, {
    codec: profile.format.videoCodec,
    bitrate: profile.format.videoBitrate,
    fullCodecString: profile.format.fullVideoCodecString,
    alpha: "discard",
    keyFrameInterval: 2,
    latencyMode: profile.format.latencyMode,
  });
  const audioSource = new AudioBufferSource({
    codec: profile.format.audioCodec,
    bitrate: profile.format.audioBitrate,
    fullCodecString: profile.format.fullAudioCodecString,
  });

  output.addVideoTrack(videoSource, {
    frameRate,
    maximumPacketCount: frameSchedule.length,
  });
  output.addAudioTrack(audioSource);

  try {
    await output.start();
    throwIfAborted(signal);

    const audioEncodeStartedAt = performance.now();
    await audioSource.add(audioBuffer);
    audioSource.close();
    diagnostics.audioEncodeMs = performance.now() - audioEncodeStartedAt;
    throwIfAborted(signal);

    for (const frame of frameSchedule) {
      throwIfAborted(signal);

      const elapsedMs = frame.timestampSeconds * 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, outputWidth, outputHeight);
      const renderStartedAt = performance.now();
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
        lyricTimeSeconds: frame.timestampSeconds,
        audioFrame: getOfflineAudioFrameAtTime(timeline, frame.timestampSeconds),
        elapsedMs,
        deltaMs: frame.durationSeconds * 1000,
        showPositionHandle: false,
      });
      diagnostics.renderMs += performance.now() - renderStartedAt;

      const videoEncodeStartedAt = performance.now();
      await videoSource.add(frame.timestampSeconds, frame.durationSeconds, {
        keyFrame: frame.index % (frameRate * 2) === 0,
      });
      diagnostics.videoEncodeMs += performance.now() - videoEncodeStartedAt;

      const framesRendered = frame.index + 1;
      const wallClockSeconds = (performance.now() - exportStartedAt) / 1000;
      const framesPerSecond =
        wallClockSeconds > 0 ? framesRendered / wallClockSeconds : 0;
      const estimatedRemainingSeconds =
        framesPerSecond > 0
          ? (frameSchedule.length - framesRendered) / framesPerSecond
          : null;
      diagnostics.framesRendered = framesRendered;
      diagnostics.framesPerSecond = framesPerSecond;
      diagnostics.realtimeFactor =
        wallClockSeconds > 0
          ? Math.min(
              timeline.durationSeconds,
              frame.timestampSeconds + frame.durationSeconds,
            ) / wallClockSeconds
          : 0;
      onProgress?.({
        framesRendered,
        totalFrames: frameSchedule.length,
        elapsedSeconds: Math.min(
          timeline.durationSeconds,
          frame.timestampSeconds + frame.durationSeconds,
        ),
        durationSeconds: timeline.durationSeconds,
        wallClockSeconds,
        framesPerSecond,
        estimatedRemainingSeconds,
      });
    }

    videoSource.close();
    const finalizeStartedAt = performance.now();
    await output.finalize();
    diagnostics.finalizeMs = performance.now() - finalizeStartedAt;
    diagnostics.totalMs = performance.now() - exportStartedAt;
    logVideoExportDiagnostics(diagnostics);
  } catch (error) {
    if (output.state !== "canceled" && output.state !== "finalized") {
      await output.cancel();
    }
    throw error;
  }

  if (!target.buffer) {
    throw new Error("The video file could not be finalized.");
  }

  return new Blob([target.buffer], { type: profile.mimeType });
}

export function createExportFrameSchedule(
  durationSeconds: number,
  frameRate = defaultFrameRate,
): ExportFrameSample[] {
  if (!Number.isFinite(frameRate) || frameRate <= 0) {
    throw new Error("Export frame rate must be positive.");
  }

  const safeDuration = Math.max(0, durationSeconds);
  const frameDuration = 1 / frameRate;
  const frameCount = Math.max(1, Math.ceil(safeDuration * frameRate));

  return Array.from({ length: frameCount }, (_, index) => {
    const timestampSeconds = index * frameDuration;
    const remaining = safeDuration - timestampSeconds;
    const duration =
      safeDuration > 0
        ? Math.max(0.001, Math.min(frameDuration, remaining || frameDuration))
        : frameDuration;

    return {
      index,
      timestampSeconds,
      durationSeconds: duration,
    };
  });
}

export function createVideoFileName(extension: string, date = new Date()) {
  const timestamp = date
    .toISOString()
    .replace(/\.\d{3}Z$/, "")
    .replace(/[:T]/g, "-");

  return `audio-visualizer-${timestamp}.${extension}`;
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

async function decodeAudioFile(file: File) {
  const AudioContextConstructor =
    window.AudioContext || (window as BrowserAudioWindow).webkitAudioContext;

  if (!AudioContextConstructor) {
    throw new Error("Audio decoding is not supported in this browser.");
  }

  const audioContext = new AudioContextConstructor();

  try {
    const arrayBuffer = await file.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  } finally {
    await audioContext.close();
  }
}

function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) {
    throw new DOMException("Export cancelled.", "AbortError");
  }
}

function logVideoExportDiagnostics(diagnostics: VideoExportDiagnostics) {
  if (!import.meta.env.DEV) {
    return;
  }

  console.debug("Video export diagnostics", {
    ...diagnostics,
    loadAndDecodeMs: Math.round(diagnostics.loadAndDecodeMs),
    audioTimelineMs: Math.round(diagnostics.audioTimelineMs),
    audioEncodeMs: Math.round(diagnostics.audioEncodeMs),
    renderMs: Math.round(diagnostics.renderMs),
    videoEncodeMs: Math.round(diagnostics.videoEncodeMs),
    finalizeMs: Math.round(diagnostics.finalizeMs),
    totalMs: Math.round(diagnostics.totalMs),
    framesPerSecond: Number(diagnostics.framesPerSecond.toFixed(2)),
    realtimeFactor: Number(diagnostics.realtimeFactor.toFixed(2)),
  });
}
