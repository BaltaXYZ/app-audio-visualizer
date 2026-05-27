import type { VisualizationDefinition } from "../types/visualization";
import { audioResponse, clamp, stageScale } from "./helpers";

const spriteTypes = [
  "stars",
  "diamonds",
  "rings",
  "triangles",
  "crosses",
  "sparks",
] as const;

const spriteDirections = [
  "toward-viewer",
  "away-from-viewer",
  "left",
  "right",
  "up",
  "down",
  "up-right",
  "up-left",
  "down-right",
  "down-left",
  "organic-drift",
] as const;

type SpriteType = (typeof spriteTypes)[number];
type SpriteDirection = (typeof spriteDirections)[number];

type SpriteFieldSettings = {
  sprite: SpriteType;
  direction: SpriteDirection;
  color: string;
  opacity: number;
  count: number;
  size: number;
  spread: number;
  speed: number;
  audioResponse: number;
};

export const spriteField: VisualizationDefinition<SpriteFieldSettings> = {
  id: "sprite-field",
  name: "Sprite Field",
  description:
    "Selectable sprites that travel through the scene with color, opacity and direction controls.",
  audioInputs: ["volume", "bass", "treble", "energyDelta", "beatPulse"],
  defaultSettings: {
    sprite: "stars",
    direction: "toward-viewer",
    color: "#ffffff",
    opacity: 0.72,
    count: 72,
    size: 18,
    spread: 1.15,
    speed: 0.82,
    audioResponse: 1.35,
  },
  controls: [
    { id: "sprite", label: "Sprite", type: "select", options: spriteTypes },
    { id: "color", label: "Color", type: "color" },
    {
      id: "opacity",
      label: "Opacity",
      type: "range",
      min: 0.1,
      max: 1,
      step: 0.05,
    },
    {
      id: "direction",
      label: "Direction",
      type: "select",
      options: spriteDirections,
    },
    {
      id: "count",
      label: "Sprite count",
      type: "range",
      min: 12,
      max: 180,
      step: 4,
    },
    {
      id: "size",
      label: "Sprite size",
      type: "range",
      min: 6,
      max: 44,
      step: 1,
    },
    {
      id: "spread",
      label: "Spread",
      type: "range",
      min: 0.45,
      max: 1.6,
      step: 0.05,
    },
    {
      id: "speed",
      label: "Speed",
      type: "range",
      min: 0.2,
      max: 2,
      step: 0.05,
    },
    {
      id: "audioResponse",
      label: "Audio response",
      type: "range",
      min: 0.3,
      max: 3,
      step: 0.05,
    },
  ],
  supportsDrag: true,
  supportsPositioning: true,
  recommendedFor: "both",
  render: (
    { ctx, width, height, centerX, centerY, elapsedMs },
    audio,
    settings,
  ) => {
    const scale = stageScale(width, height);
    const count = Math.max(4, Math.round(settings.count));
    const time = elapsedMs / 1000;
    const response = audioResponse(
      audio.volume * 0.55 +
        audio.bass * 0.34 +
        audio.treble * 0.28 +
        audio.energyDelta * 0.45 +
        audio.beatConfidence * 0.24,
      settings.audioResponse,
    );
    const baseSize = settings.size * scale * (1 + response * 0.34);
    const maxDistance =
      Math.hypot(width, height) * 0.58 * clamp(settings.spread, 0.45, 1.6);
    const travelSpeed = settings.speed * (0.07 + response * 0.055);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = Math.max(4, baseSize * (0.32 + response * 0.8));

    for (let index = 0; index < count; index += 1) {
      const seedX = signedHash(index, 1);
      const seedY = signedHash(index, 2);
      const seedPhase = hash(index, 3);
      const depthPhase = wrap01(seedPhase + time * travelSpeed);
      const rotation =
        hash(index, 4) * Math.PI * 2 + time * (0.18 + response * 0.36);
      const spriteScale = 0.76 + hash(index, 5) * 0.62;
      const point = spritePoint({
        direction: settings.direction,
        centerX,
        centerY,
        width,
        height,
        maxDistance,
        seedX,
        seedY,
        seedPhase,
        depthPhase,
        time,
        speed: settings.speed,
        response,
      });
      const spriteSize = baseSize * spriteScale * point.scale;
      const opacity = clamp(
        settings.opacity * point.opacity * (0.78 + response * 0.36),
        0,
        1,
      );

      drawSprite(ctx, settings.sprite, point.x, point.y, spriteSize, rotation);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = settings.color;
      ctx.strokeStyle = settings.color;
      ctx.lineWidth = Math.max(1.2, spriteSize * 0.12);
      if (settings.sprite !== "rings") {
        ctx.fill();
      }
      ctx.stroke();
    }

    ctx.restore();
  },
};

type SpritePointOptions = {
  direction: SpriteDirection;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  maxDistance: number;
  seedX: number;
  seedY: number;
  seedPhase: number;
  depthPhase: number;
  time: number;
  speed: number;
  response: number;
};

function spritePoint({
  direction,
  centerX,
  centerY,
  width,
  height,
  maxDistance,
  seedX,
  seedY,
  seedPhase,
  depthPhase,
  time,
  speed,
  response,
}: SpritePointOptions) {
  if (direction === "toward-viewer" || direction === "away-from-viewer") {
    const depth =
      direction === "toward-viewer" ? depthPhase : 1 - depthPhase;
    const angle =
      Math.atan2(seedY, seedX) +
      Math.sin(time * 0.17 + seedPhase * Math.PI * 2) * 0.08;
    const distance =
      Math.sqrt(Math.abs(seedX * seedY)) * maxDistance * (0.12 + depth * 0.92);

    return {
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance * 0.76,
      scale: 0.36 + depth * 1.22 + response * 0.18,
      opacity: 0.16 + depth * 0.84,
    };
  }

  if (direction === "organic-drift") {
    return {
      x:
        centerX +
        seedX * maxDistance * 0.58 +
        Math.sin(time * (0.31 + speed * 0.08) + seedPhase * 8) *
          maxDistance *
          0.08,
      y:
        centerY +
        seedY * maxDistance * 0.42 +
        Math.cos(time * (0.27 + speed * 0.07) + seedPhase * 9) *
          maxDistance *
          0.08,
      scale: 0.74 + hashFromValue(seedPhase + response) * 0.46,
      opacity: 0.58 + response * 0.34,
    };
  }

  const vector = directionVector(direction);
  const margin = maxDistance * 0.18;
  const rangeX = width + margin * 2;
  const rangeY = height + margin * 2;
  const progress = depthPhase - 0.5;
  const x = wrapRange(
    (seedX + 1) * 0.5 * width + vector.x * progress * rangeX,
    -margin,
    width + margin,
  );
  const y = wrapRange(
    (seedY + 1) * 0.5 * height + vector.y * progress * rangeY,
    -margin,
    height + margin,
  );

  return {
    x,
    y,
    scale: 0.82 + hashFromValue(seedPhase) * 0.5 + response * 0.18,
    opacity: 0.58 + response * 0.34,
  };
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteType,
  x: number,
  y: number,
  size: number,
  rotation: number,
) {
  ctx.beginPath();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  if (sprite === "stars") {
    for (let point = 0; point < 10; point += 1) {
      const radius = point % 2 === 0 ? size : size * 0.42;
      const angle = -Math.PI / 2 + (point / 10) * Math.PI * 2;
      const nextX = Math.cos(angle) * radius;
      const nextY = Math.sin(angle) * radius;

      if (point === 0) {
        ctx.moveTo(nextX, nextY);
      } else {
        ctx.lineTo(nextX, nextY);
      }
    }
    ctx.closePath();
  } else if (sprite === "diamonds") {
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.72, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.72, 0);
    ctx.closePath();
  } else if (sprite === "triangles") {
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.88, size * 0.62);
    ctx.lineTo(-size * 0.88, size * 0.62);
    ctx.closePath();
  } else if (sprite === "crosses") {
    const arm = size * 0.88;
    const stem = size * 0.24;
    ctx.rect(-stem, -arm, stem * 2, arm * 2);
    ctx.rect(-arm, -stem, arm * 2, stem * 2);
  } else if (sprite === "sparks") {
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.24, -size * 0.2);
    ctx.lineTo(size, 0);
    ctx.lineTo(size * 0.24, size * 0.2);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.24, size * 0.2);
    ctx.lineTo(-size, 0);
    ctx.lineTo(-size * 0.24, -size * 0.2);
    ctx.closePath();
  } else {
    ctx.arc(0, 0, size * 0.72, 0, Math.PI * 2);
    ctx.moveTo(size * 0.36, 0);
    ctx.arc(0, 0, size * 0.36, 0, Math.PI * 2, true);
  }

  ctx.restore();
}

function directionVector(direction: SpriteDirection) {
  switch (direction) {
    case "left":
      return { x: -1, y: 0 };
    case "right":
      return { x: 1, y: 0 };
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
      return { x: 0, y: 0 };
  }
}

function hash(index: number, salt: number) {
  return hashFromValue(index * 12.9898 + salt * 78.233);
}

function signedHash(index: number, salt: number) {
  return hash(index, salt) * 2 - 1;
}

function hashFromValue(value: number) {
  const hashed = Math.sin(value) * 43758.5453;
  return hashed - Math.floor(hashed);
}

function wrap01(value: number) {
  return value - Math.floor(value);
}

function wrapRange(value: number, min: number, max: number) {
  const span = max - min;

  if (span <= 0) {
    return min;
  }

  return ((((value - min) % span) + span) % span) + min;
}
