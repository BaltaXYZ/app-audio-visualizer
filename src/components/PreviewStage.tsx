import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { AudioFrame } from "../types/audio";
import type { BackgroundImageAsset, LoadStatus } from "../types/assets";
import type {
  BackgroundMotionDirection,
  BackgroundMotionSettings,
} from "../types/backgroundMotion";
import type {
  AnyVisualizationDefinition,
  NormalizedPoint,
  VisualizationSettings,
} from "../types/visualization";
import type { VideoFormatId } from "../types/videoFormat";
import { getVideoFormatRatio } from "../types/videoFormat";

type PreviewStageProps = {
  backgroundImage: BackgroundImageAsset | null;
  status: LoadStatus;
  error: string | null;
  visualization: AnyVisualizationDefinition;
  settings: VisualizationSettings;
  position: NormalizedPoint;
  videoFormatId: VideoFormatId;
  backgroundMotion: BackgroundMotionSettings;
  onPositionChange: (position: NormalizedPoint) => void;
  getAudioFrame: (time: number) => AudioFrame;
};

type StageRect = {
  x: number;
  y: number;
  width: number;
  height: number;
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

      let stage = getFormattedStage(
        width,
        height,
        getVideoFormatRatio(videoFormatIdRef.current),
      );
      drawEmptyStage(ctx, width, height, stage);

      if (image && image.complete && image.naturalWidth > 0) {
        stage = backgroundMotionRef.current.enabled
          ? drawMotionImage(
              ctx,
              image,
              stage,
              timestamp,
              backgroundMotionRef.current,
            )
          : drawContainedImage(ctx, image, stage);
      }

      const audioFrame = getAudioFrameRef.current(timestamp);
      const currentVisualization = visualizationRef.current;
      const currentSettings = settingsRef.current;
      const currentPosition = positionRef.current;
      stageRef.current = stage;

      ctx.save();
      ctx.beginPath();
      ctx.rect(stage.x, stage.y, stage.width, stage.height);
      ctx.clip();
      ctx.translate(stage.x, stage.y);
      currentVisualization.render(
        {
          ctx,
          width: stage.width,
          height: stage.height,
          centerX: stage.width * clamp(currentPosition.x, 0, 1),
          centerY: stage.height * clamp(currentPosition.y, 0, 1),
          position: currentPosition,
          elapsedMs: timestamp,
          deltaMs: lastTimestamp ? timestamp - lastTimestamp : 16.7,
        },
        audioFrame,
        currentSettings,
      );
      ctx.restore();

      if (
        currentVisualization.supportsPositioning ||
        currentVisualization.supportsDrag
      ) {
        drawPositionHandle(ctx, stage, currentPosition);
      }

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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getFormattedStage(width: number, height: number, aspectRatio: number) {
  const shellRatio = width / height;
  const stageWidth = shellRatio > aspectRatio ? height * aspectRatio : width;
  const stageHeight = shellRatio > aspectRatio ? height : width / aspectRatio;

  return {
    x: (width - stageWidth) / 2,
    y: (height - stageHeight) / 2,
    width: stageWidth,
    height: stageHeight,
  };
}

function drawPositionHandle(
  ctx: CanvasRenderingContext2D,
  stage: StageRect,
  position: NormalizedPoint,
) {
  const x = stage.x + stage.width * clamp(position.x, 0, 1);
  const y = stage.y + stage.height * clamp(position.y, 0, 1);
  const radius = Math.max(12, Math.min(stage.width, stage.height) * 0.022);

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.shadowColor = "rgba(0, 0, 0, 0.26)";
  ctx.shadowBlur = 10;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.96)";
  ctx.fillStyle = "rgba(13, 143, 123, 0.86)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.58, y);
  ctx.lineTo(x + radius * 0.58, y);
  ctx.moveTo(x, y - radius * 0.58);
  ctx.lineTo(x, y + radius * 0.58);
  ctx.stroke();
  ctx.restore();
}

function drawEmptyStage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stage: StageRect,
) {
  ctx.fillStyle = "#151817";
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#f7f7f2");
  gradient.addColorStop(0.52, "#edf5f2");
  gradient.addColorStop(1, "#f9ece7");

  ctx.fillStyle = gradient;
  ctx.fillRect(stage.x, stage.y, stage.width, stage.height);

  ctx.strokeStyle = "rgba(38, 54, 61, 0.12)";
  ctx.lineWidth = 1;

  const gridSize = 44;
  for (let x = stage.x; x < stage.x + stage.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, stage.y);
    ctx.lineTo(x, stage.y + stage.height);
    ctx.stroke();
  }

  for (let y = stage.y; y < stage.y + stage.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(stage.x, y);
    ctx.lineTo(stage.x + stage.width, y);
    ctx.stroke();
  }
}

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  stage: StageRect,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const stageRatio = stage.width / stage.height;
  const drawWidth =
    imageRatio > stageRatio ? stage.width : stage.height * imageRatio;
  const drawHeight =
    imageRatio > stageRatio ? stage.width / imageRatio : stage.height;
  const x = stage.x + (stage.width - drawWidth) / 2;
  const y = stage.y + (stage.height - drawHeight) / 2;

  ctx.fillStyle = "#151817";
  ctx.fillRect(stage.x, stage.y, stage.width, stage.height);
  ctx.save();
  ctx.beginPath();
  ctx.rect(stage.x, stage.y, stage.width, stage.height);
  ctx.clip();
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
  ctx.restore();
  return stage;
}

function drawMotionImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  stage: StageRect,
  timestamp: number,
  motion: BackgroundMotionSettings,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const stageRatio = stage.width / stage.height;
  const coverWidth =
    imageRatio > stageRatio ? stage.height * imageRatio : stage.width;
  const coverHeight =
    imageRatio > stageRatio ? stage.height : stage.width / imageRatio;
  const zoomScale = 1 + motion.zoom / 100;
  const drawWidth = coverWidth * zoomScale;
  const drawHeight = coverHeight * zoomScale;
  const maxOffsetX = Math.max(0, (drawWidth - stage.width) / 2);
  const maxOffsetY = Math.max(0, (drawHeight - stage.height) / 2);
  const direction = directionVector(motion.direction);
  const progress = (timestamp / Math.max(1, 18000 / motion.speed)) % 1;
  const phase = Math.sin(progress * Math.PI * 2);
  const offsetX = direction.x * maxOffsetX * phase;
  const offsetY = direction.y * maxOffsetY * phase;
  const x = stage.x + (stage.width - drawWidth) / 2 + offsetX;
  const y = stage.y + (stage.height - drawHeight) / 2 + offsetY;

  ctx.fillStyle = "#151817";
  ctx.fillRect(stage.x, stage.y, stage.width, stage.height);
  ctx.save();
  ctx.beginPath();
  ctx.rect(stage.x, stage.y, stage.width, stage.height);
  ctx.clip();
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
  ctx.restore();
  return stage;
}

function directionVector(direction: BackgroundMotionDirection) {
  switch (direction) {
    case "left":
      return { x: -1, y: 0 };
    case "up":
      return { x: 0, y: -1 };
    case "down":
      return { x: 0, y: 1 };
    case "up-right":
      return { x: 0.7, y: -0.7 };
    case "up-left":
      return { x: -0.7, y: -0.7 };
    case "down-right":
      return { x: 0.7, y: 0.7 };
    case "down-left":
      return { x: -0.7, y: 0.7 };
    default:
      return { x: 1, y: 0 };
  }
}
