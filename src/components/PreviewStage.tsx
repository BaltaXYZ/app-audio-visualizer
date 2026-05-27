import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { AudioFrame } from "../types/audio";
import type { BackgroundImageAsset, LoadStatus } from "../types/assets";
import type { BackgroundMotionSettings } from "../types/backgroundMotion";
import type { ImageEffectSettings } from "../types/imageEffects";
import {
  renderPreviewFrame,
  type StageRect,
} from "../canvas/renderPreviewFrame";
import type { LyricLine, LyricsSettings } from "../types/lyrics";
import type {
  AnyVisualizationDefinition,
  NormalizedPoint,
  VisualizationSettings,
} from "../types/visualization";
import type { VideoFormatId } from "../types/videoFormat";
import { clamp } from "../visualizations/helpers";

type PreviewStageProps = {
  backgroundImage: BackgroundImageAsset | null;
  status: LoadStatus;
  error: string | null;
  visualization: AnyVisualizationDefinition;
  settings: VisualizationSettings;
  position: NormalizedPoint;
  videoFormatId: VideoFormatId;
  backgroundMotion: BackgroundMotionSettings;
  imageEffects: ImageEffectSettings;
  lyricLines: LyricLine[];
  lyricsSettings: LyricsSettings;
  audioTime: number;
  onPositionChange: (position: NormalizedPoint) => void;
  getAudioFrame: (time: number) => AudioFrame;
};

export function PreviewStage({
  backgroundImage,
  status,
  error,
  visualization,
  settings,
  position,
  videoFormatId,
  backgroundMotion,
  imageEffects,
  lyricLines,
  lyricsSettings,
  audioTime,
  onPositionChange,
  getAudioFrame,
}: PreviewStageProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<StageRect>({ x: 0, y: 0, width: 1, height: 1 });
  const visualizationRef = useRef(visualization);
  const settingsRef = useRef(settings);
  const positionRef = useRef(position);
  const videoFormatIdRef = useRef(videoFormatId);
  const backgroundMotionRef = useRef(backgroundMotion);
  const imageEffectsRef = useRef(imageEffects);
  const lyricLinesRef = useRef(lyricLines);
  const lyricsSettingsRef = useRef(lyricsSettings);
  const audioTimeRef = useRef(audioTime);
  const getAudioFrameRef = useRef(getAudioFrame);
  const draggingPointerIdRef = useRef<number | null>(null);
  const canDrag = visualization.supportsPositioning || visualization.supportsDrag;

  useEffect(() => {
    visualizationRef.current = visualization;
  }, [visualization]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    videoFormatIdRef.current = videoFormatId;
  }, [videoFormatId]);

  useEffect(() => {
    backgroundMotionRef.current = backgroundMotion;
  }, [backgroundMotion]);

  useEffect(() => {
    imageEffectsRef.current = imageEffects;
  }, [imageEffects]);

  useEffect(() => {
    lyricLinesRef.current = lyricLines;
  }, [lyricLines]);

  useEffect(() => {
    lyricsSettingsRef.current = lyricsSettings;
  }, [lyricsSettings]);

  useEffect(() => {
    audioTimeRef.current = audioTime;
  }, [audioTime]);

  useEffect(() => {
    getAudioFrameRef.current = getAudioFrame;
  }, [getAudioFrame]);

  const readPointerPosition = useCallback((event: ReactPointerEvent) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const stage = stageRef.current;
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    if (
      point.x < stage.x ||
      point.x > stage.x + stage.width ||
      point.y < stage.y ||
      point.y > stage.y + stage.height
    ) {
      return null;
    }

    return {
      x: clamp((point.x - stage.x) / stage.width, 0, 1),
      y: clamp((point.y - stage.y) / stage.height, 0, 1),
      absoluteX: point.x,
      absoluteY: point.y,
    };
  }, []);

  const updatePositionFromPointer = useCallback(
    (event: ReactPointerEvent) => {
      const pointer = readPointerPosition(event);

      if (!pointer) {
        return false;
      }

      const nextPosition = { x: pointer.x, y: pointer.y };
      positionRef.current = nextPosition;
      onPositionChange(nextPosition);
      return true;
    },
    [onPositionChange, readPointerPosition],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!canDrag) {
        return;
      }

      const pointer = readPointerPosition(event);

      if (!pointer) {
        return;
      }

      const stage = stageRef.current;
      const focusX = stage.x + stage.width * positionRef.current.x;
      const focusY = stage.y + stage.height * positionRef.current.y;
      const distance = Math.hypot(
        pointer.absoluteX - focusX,
        pointer.absoluteY - focusY,
      );
      const handleRadius = Math.max(24, Math.min(stage.width, stage.height) * 0.045);

      if (distance > handleRadius) {
        return;
      }

      draggingPointerIdRef.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      updatePositionFromPointer(event);
      event.preventDefault();
    },
    [canDrag, readPointerPosition, updatePositionFromPointer],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (draggingPointerIdRef.current !== event.pointerId) {
        return;
      }

      updatePositionFromPointer(event);
      event.preventDefault();
    },
    [updatePositionFromPointer],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (draggingPointerIdRef.current !== event.pointerId) {
        return;
      }

      draggingPointerIdRef.current = null;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  useEffect(() => {
    const shell = shellRef.current;
    const canvas = canvasRef.current;

    if (!shell || !canvas) {
      return;
    }

    let active = true;
    let animationFrame = 0;
    let lastTimestamp = 0;
    let image: HTMLImageElement | null = null;
    const size = {
      width: 1,
      height: 1,
    };

    const updateSize = () => {
      const rect = shell.getBoundingClientRect();
      size.width = Math.max(1, rect.width);
      size.height = Math.max(1, rect.height);
    };

    const draw = (timestamp = 0) => {
      if (!active) {
        return;
      }

      const { width, height } = size;
      const pixelRatio = window.devicePixelRatio || 1;
      const pixelWidth = Math.round(width * pixelRatio);
      const pixelHeight = Math.round(height * pixelRatio);
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return;
      }

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.clearRect(0, 0, width, height);

      stageRef.current = renderPreviewFrame({
        ctx,
        width,
        height,
        backgroundImage: image,
        visualization: visualizationRef.current,
        settings: settingsRef.current,
        position: positionRef.current,
        videoFormatId: videoFormatIdRef.current,
        backgroundMotion: backgroundMotionRef.current,
        imageEffects: imageEffectsRef.current,
        lyricLines: lyricLinesRef.current,
        lyricsSettings: lyricsSettingsRef.current,
        lyricTimeSeconds: audioTimeRef.current,
        audioFrame: getAudioFrameRef.current(timestamp),
        elapsedMs: timestamp,
        deltaMs: lastTimestamp ? timestamp - lastTimestamp : 16.7,
        showPositionHandle: true,
      });

      lastTimestamp = timestamp;
      animationFrame = requestAnimationFrame(draw);
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(shell);

    if (backgroundImage) {
      image = new Image();
      image.src = backgroundImage.objectUrl;
    }

    animationFrame = requestAnimationFrame(draw);

    return () => {
      active = false;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [backgroundImage?.objectUrl]);

  const showEmptyState = !backgroundImage && !error;
  const showPreviewError = !backgroundImage && error;
  const statusLabel = showPreviewError
    ? "Image error"
    : status === "ready"
      ? "Image ready"
      : status === "loading"
        ? "Reading image"
        : "Ready";

  return (
    <section className="preview-card" aria-label="Live preview">
      <div className="preview-header">
        <div>
          <p className="eyebrow">Live-preview</p>
          <h2>{backgroundImage ? backgroundImage.name : "No image selected"}</h2>
          <p className="preview-visualization">{visualization.name}</p>
        </div>
        <p className="preview-status">{statusLabel}</p>
      </div>

      <div className="preview-shell" ref={shellRef}>
        <canvas
          ref={canvasRef}
          className={canDrag ? "is-positionable" : undefined}
          data-testid="preview-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        {showEmptyState ? (
          <div className="preview-empty">
            <p>Choose a background image to fill the preview.</p>
          </div>
        ) : null}
        {showPreviewError ? (
          <div className="preview-empty error">
            <p>{error}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
