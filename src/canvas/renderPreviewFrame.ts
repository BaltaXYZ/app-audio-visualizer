import type { AudioFrame } from "../types/audio";
import type {
  BackgroundMotionDirection,
  BackgroundMotionSettings,
} from "../types/backgroundMotion";
import { drawImageEffects } from "./imageEffects";
import type { ImageEffectSettings } from "../types/imageEffects";
import type { LyricLine, LyricsSettings } from "../types/lyrics";
import type {
  AnyVisualizationDefinition,
  NormalizedPoint,
  VisualizationSettings,
} from "../types/visualization";
import type { VideoFormatId } from "../types/videoFormat";
import { getVideoFormatRatio } from "../types/videoFormat";
import { getActiveLyricIndex } from "../utils/lyrics";
import { clamp } from "../visualizations/helpers";

export type StageRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RenderPreviewFrameOptions = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  backgroundImage: HTMLImageElement | null;
  visualizationEnabled: boolean;
  visualization: AnyVisualizationDefinition;
  settings: VisualizationSettings;
  position: NormalizedPoint;
  videoFormatId: VideoFormatId;
  backgroundMotion: BackgroundMotionSettings;
  imageEffects: ImageEffectSettings;
  lyricLines: LyricLine[];
  lyricsSettings: LyricsSettings;
  lyricTimeSeconds: number;
  audioFrame: AudioFrame;
  elapsedMs: number;
  deltaMs: number;
  showPositionHandle?: boolean;
};

export function renderPreviewFrame({
  ctx,
  width,
  height,
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
  lyricTimeSeconds,
  audioFrame,
  elapsedMs,
  deltaMs,
  showPositionHandle = true,
}: RenderPreviewFrameOptions) {
  let stage = getFormattedStage(width, height, getVideoFormatRatio(videoFormatId));
  drawEmptyStage(ctx, width, height, stage);

  if (
    backgroundImage &&
    backgroundImage.complete &&
    backgroundImage.naturalWidth > 0
  ) {
    stage = backgroundMotion.enabled
      ? drawMotionImage(ctx, backgroundImage, stage, elapsedMs, backgroundMotion)
      : drawContainedImage(ctx, backgroundImage, stage);
    drawImageEffects(ctx, stage, imageEffects, audioFrame, elapsedMs);
  }

  if (visualizationEnabled) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(stage.x, stage.y, stage.width, stage.height);
    ctx.clip();
    ctx.translate(stage.x, stage.y);
    visualization.render(
      {
        ctx,
        width: stage.width,
        height: stage.height,
        centerX: stage.width * clamp(position.x, 0, 1),
        centerY: stage.height * clamp(position.y, 0, 1),
        position,
        elapsedMs,
        deltaMs,
      },
      audioFrame,
      settings,
    );
    ctx.restore();
  }

  if (
    visualizationEnabled &&
    showPositionHandle &&
    (visualization.supportsPositioning || visualization.supportsDrag)
  ) {
    drawPositionHandle(ctx, stage, position);
  }

  drawLyrics(ctx, stage, lyricLines, lyricsSettings, lyricTimeSeconds);
  return stage;
}

export function getFormattedStage(
  width: number,
  height: number,
  aspectRatio: number,
) {
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
  const progress = (timestamp / Math.max(1, 18000 / motion.speed)) % 1;
  const zoomScale = motionZoomScale(motion, timestamp, progress);
  const drawWidth = coverWidth * zoomScale;
  const drawHeight = coverHeight * zoomScale;
  const maxOffsetX = Math.max(0, (drawWidth - stage.width) / 2);
  const maxOffsetY = Math.max(0, (drawHeight - stage.height) / 2);
  const offset = motionOffset(motion, timestamp, progress, maxOffsetX, maxOffsetY);
  const x = stage.x + (stage.width - drawWidth) / 2 + offset.x;
  const y = stage.y + (stage.height - drawHeight) / 2 + offset.y;

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

function drawLyrics(
  ctx: CanvasRenderingContext2D,
  stage: StageRect,
  lines: LyricLine[],
  settings: LyricsSettings,
  currentTime: number,
) {
  if (!settings.enabled || lines.length === 0) {
    return;
  }

  const activeIndex = getActiveLyricIndex(lines, currentTime);

  if (activeIndex < 0) {
    return;
  }

  const currentLine = lines[activeIndex];
  const nextLine = lines[activeIndex + 1] ?? null;
  const scale = clamp(Math.min(stage.width, stage.height) / 720, 0.68, 1.6);
  const baseFontSize = settings.fontSize * scale;
  const items = buildLyricItems(currentLine, nextLine, settings, baseFontSize);
  const align = settings.style === "poster" ? "left" : "center";
  const maxWidth =
    settings.style === "poster" ? stage.width * 0.72 : stage.width * 0.84;
  const layout = layoutLyricItems(ctx, items, maxWidth);
  const anchor = lyricAnchor(stage, settings.position, layout.height);
  const x =
    align === "left"
      ? stage.x + stage.width * 0.1
      : stage.x + stage.width / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(stage.x, stage.y, stage.width, stage.height);
  ctx.clip();
  ctx.textBaseline = "top";
  ctx.textAlign = align;

  if (settings.shadow) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.58)";
    ctx.shadowBlur = Math.max(8, baseFontSize * 0.34);
    ctx.shadowOffsetY = Math.max(2, baseFontSize * 0.08);
  }

  if (settings.background) {
    drawLyricsBackground(ctx, x, anchor.y, layout.width, layout.height, align);
  }

  let y = anchor.y + layout.padding;
  for (const item of layout.items) {
    ctx.font = lyricFont(item.fontSize, item.weight);
    ctx.fillStyle = settings.color;
    ctx.globalAlpha = item.alpha;

    for (const text of item.lines) {
      ctx.fillText(text, x, y);
      y += item.lineHeight;
    }

    y += item.gap;
  }

  ctx.restore();
}

function buildLyricItems(
  currentLine: LyricLine,
  nextLine: LyricLine | null,
  settings: LyricsSettings,
  baseFontSize: number,
) {
  if (settings.style === "karaoke") {
    return [
      {
        text: currentLine.text,
        fontSize: baseFontSize * 1.05,
        weight: 820,
        alpha: 1,
      },
      ...(settings.showNextLine && nextLine
        ? [
            {
              text: nextLine.text,
              fontSize: baseFontSize * 0.68,
              weight: 720,
              alpha: 0.52,
            },
          ]
        : []),
    ];
  }

  if (settings.style === "center") {
    return [
      {
        text: currentLine.text,
        fontSize: baseFontSize * 1.24,
        weight: 840,
        alpha: 1,
      },
    ];
  }

  if (settings.style === "poster") {
    return [
      {
        text: currentLine.text.toUpperCase(),
        fontSize: baseFontSize * 1.34,
        weight: 900,
        alpha: 1,
      },
      ...(settings.showNextLine && nextLine
        ? [
            {
              text: nextLine.text,
              fontSize: baseFontSize * 0.6,
              weight: 760,
              alpha: 0.58,
            },
          ]
        : []),
    ];
  }

  return [
    {
      text: currentLine.text,
      fontSize: baseFontSize,
      weight: 780,
      alpha: 1,
    },
  ];
}

function layoutLyricItems(
  ctx: CanvasRenderingContext2D,
  items: Array<{
    text: string;
    fontSize: number;
    weight: number;
    alpha: number;
  }>,
  maxWidth: number,
) {
  const padding = Math.max(12, maxWidth * 0.018);
  let width = 0;
  let height = padding * 2;
  const layoutItems = items.map((item, index) => {
    ctx.font = lyricFont(item.fontSize, item.weight);
    const lines = wrapLyricText(ctx, item.text, maxWidth);
    const lineHeight = item.fontSize * 1.16;
    const gap = index === items.length - 1 ? 0 : item.fontSize * 0.22;

    for (const line of lines) {
      width = Math.max(width, ctx.measureText(line).width);
    }

    height += lines.length * lineHeight + gap;

    return {
      ...item,
      lines,
      lineHeight,
      gap,
    };
  });

  return {
    items: layoutItems,
    width: Math.min(maxWidth, width) + padding * 2,
    height,
    padding,
  };
}

function wrapLyricText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = text.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (ctx.measureText(nextLine).width <= maxWidth || !currentLine) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function lyricAnchor(
  stage: StageRect,
  position: LyricsSettings["position"],
  height: number,
) {
  if (position === "top") {
    return { y: stage.y + stage.height * 0.12 };
  }

  if (position === "center") {
    return { y: stage.y + (stage.height - height) / 2 };
  }

  return { y: stage.y + stage.height * 0.84 - height };
}

function drawLyricsBackground(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  align: "left" | "center",
) {
  const left = align === "left" ? x - width * 0.04 : x - width / 2;
  const radius = Math.min(12, height * 0.18);

  ctx.save();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "rgba(0, 0, 0, 0.46)";
  ctx.beginPath();
  roundedRect(ctx, left, y, width, height, radius);
  ctx.fill();
  ctx.restore();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

function lyricFont(fontSize: number, weight: number) {
  return `${weight} ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
}

function motionZoomScale(
  motion: BackgroundMotionSettings,
  timestamp: number,
  progress: number,
) {
  const zoomRoom = motion.zoom / 100;
  const easedProgress = (1 - Math.cos(progress * Math.PI)) / 2;

  if (motion.direction === "zoom-in") {
    return 1 + zoomRoom * easedProgress;
  }

  if (motion.direction === "zoom-out") {
    return 1 + zoomRoom * (1 - easedProgress);
  }

  if (motion.direction === "zoom-in-out") {
    const zoomPhase = (1 - Math.cos(progress * Math.PI * 2)) / 2;
    return 1 + zoomRoom * (0.28 + zoomPhase * 0.72);
  }

  if (motion.direction === "organic-drift") {
    const time = (timestamp / 1000) * Math.max(0.2, motion.speed);
    const drift =
      (Math.sin(time * 0.23 + 1.4) + Math.sin(time * 0.071 + 4.2) * 0.52) /
      1.52;

    return 1 + zoomRoom * (0.48 + (drift + 1) * 0.22);
  }

  return 1 + zoomRoom;
}

function motionOffset(
  motion: BackgroundMotionSettings,
  timestamp: number,
  progress: number,
  maxOffsetX: number,
  maxOffsetY: number,
) {
  if (motion.direction === "organic-drift") {
    const time = (timestamp / 1000) * Math.max(0.2, motion.speed);
    return {
      x:
        maxOffsetX *
        ((Math.sin(time * 0.19 + 0.7) + Math.sin(time * 0.047 + 3.8) * 0.64) /
          1.64),
      y:
        maxOffsetY *
        ((Math.cos(time * 0.17 + 2.3) + Math.sin(time * 0.061 + 5.1) * 0.58) /
          1.58),
    };
  }

  if (
    motion.direction === "zoom-in" ||
    motion.direction === "zoom-out" ||
    motion.direction === "zoom-in-out"
  ) {
    return { x: 0, y: 0 };
  }

  const direction = directionVector(motion.direction);
  const phase = Math.sin(progress * Math.PI * 2);

  return {
    x: direction.x * maxOffsetX * phase,
    y: direction.y * maxOffsetY * phase,
  };
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
