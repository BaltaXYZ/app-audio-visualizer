import type { AudioFrame } from "../types/audio";
import type { ImageEffectSettings } from "../types/imageEffects";

type ImageEffectStage = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageEffectRenderState = {
  enabled: boolean;
  cssFilter: string;
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  glowAlpha: number;
  glowRadius: number;
  vignetteAlpha: number;
  grainAlpha: number;
  flashAlpha: number;
  scanlineAlpha: number;
};

export const neutralImageEffectRenderState: ImageEffectRenderState = {
  enabled: false,
  cssFilter: "none",
  brightness: 1,
  contrast: 1,
  saturation: 1,
  hueRotate: 0,
  glowAlpha: 0,
  glowRadius: 0,
  vignetteAlpha: 0,
  grainAlpha: 0,
  flashAlpha: 0,
  scanlineAlpha: 0,
};

export function calculateImageEffectRenderState(
  settings: ImageEffectSettings,
  audio: AudioFrame,
  elapsedMs: number,
): ImageEffectRenderState {
  const amount = normalizePercent(settings.amount);

  if (!settings.enabled || amount <= 0) {
    return { ...neutralImageEffectRenderState };
  }

  const bassPunch = normalizePercent(settings.bassPunch) * amount;
  const colorMovement = normalizePercent(settings.colorMovement) * amount;
  const glow = normalizePercent(settings.glow) * amount;
  const vignette = normalizePercent(settings.vignette) * amount;
  const grain = normalizePercent(settings.grain) * amount;
  const beat = audio.beatPulse
    ? Math.max(audio.beatConfidence, audio.transientStrength)
    : 0;
  const bassEnergy = clamp(
    audio.bass * 0.72 + beat * 0.34 + audio.transientStrength * 0.14,
    0,
    1,
  );
  const midEnergy = clamp(
    audio.mids * 0.74 + audio.frequencyBands.mid * 0.26,
    0,
    1,
  );
  const trebleEnergy = clamp(
    audio.treble * 0.72 + audio.frequencyBands.highMid * 0.28,
    0,
    1,
  );
  const totalEnergy = clamp(
    audio.volume * 0.46 + audio.slowEnergy * 0.36 + bassEnergy * 0.18,
    0,
    1,
  );
  const colorPhase = Math.sin(elapsedMs / 900 + midEnergy * Math.PI);
  const brightness = clamp(
    1 + bassPunch * (0.04 + bassEnergy * 0.2 + beat * 0.1),
    0.82,
    1.32,
  );
  const contrast = clamp(1 + bassPunch * (0.06 + bassEnergy * 0.42), 0.82, 1.52);
  const saturation = clamp(
    1 + colorMovement * (0.08 + midEnergy * 0.34 + trebleEnergy * 0.2),
    0.78,
    1.78,
  );
  const hueRotate = clamp(
    (colorPhase * 12 + trebleEnergy * 16) * colorMovement,
    -28,
    28,
  );
  const glowAlpha = clamp(glow * (0.1 + totalEnergy * 0.46 + beat * 0.18), 0, 0.5);
  const glowRadius = clamp(0.42 + totalEnergy * 0.48, 0.3, 0.94);
  const vignetteAlpha = clamp(vignette * (0.16 + bassEnergy * 0.24), 0, 0.62);
  const grainAlpha = clamp(grain * (0.04 + trebleEnergy * 0.18 + beat * 0.08), 0, 0.24);
  const flashAlpha = clamp(bassPunch * beat * 0.2, 0, 0.22);
  const scanlineAlpha = clamp(grain * (0.02 + trebleEnergy * 0.08), 0, 0.12);

  return {
    enabled: true,
    cssFilter: `brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(
      3,
    )}) saturate(${saturation.toFixed(3)}) hue-rotate(${hueRotate.toFixed(2)}deg)`,
    brightness,
    contrast,
    saturation,
    hueRotate,
    glowAlpha,
    glowRadius,
    vignetteAlpha,
    grainAlpha,
    flashAlpha,
    scanlineAlpha,
  };
}

export function drawImageEffects(
  ctx: CanvasRenderingContext2D,
  stage: ImageEffectStage,
  settings: ImageEffectSettings,
  audio: AudioFrame,
  elapsedMs: number,
) {
  const effect = calculateImageEffectRenderState(settings, audio, elapsedMs);

  if (!effect.enabled) {
    return;
  }

  const source = document.createElement("canvas");
  source.width = Math.max(1, Math.round(stage.width));
  source.height = Math.max(1, Math.round(stage.height));

  const sourceCtx = source.getContext("2d");
  if (!sourceCtx) {
    return;
  }

  sourceCtx.drawImage(
    ctx.canvas,
    stage.x,
    stage.y,
    stage.width,
    stage.height,
    0,
    0,
    source.width,
    source.height,
  );

  ctx.save();
  ctx.beginPath();
  ctx.rect(stage.x, stage.y, stage.width, stage.height);
  ctx.clip();
  ctx.filter = effect.cssFilter;
  ctx.clearRect(stage.x, stage.y, stage.width, stage.height);
  ctx.drawImage(source, stage.x, stage.y, stage.width, stage.height);
  ctx.filter = "none";

  drawGlow(ctx, stage, effect, elapsedMs);
  drawBeatFlash(ctx, stage, effect);
  drawVignette(ctx, stage, effect);
  drawGrain(ctx, stage, effect, elapsedMs);

  ctx.restore();
  resetCanvasEffectState(ctx);
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  stage: ImageEffectStage,
  effect: ImageEffectRenderState,
  elapsedMs: number,
) {
  if (effect.glowAlpha <= 0) {
    return;
  }

  const centerX = stage.x + stage.width * (0.48 + Math.sin(elapsedMs / 1800) * 0.08);
  const centerY = stage.y + stage.height * (0.46 + Math.cos(elapsedMs / 2200) * 0.08);
  const radius = Math.max(stage.width, stage.height) * effect.glowRadius;
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius,
  );

  gradient.addColorStop(0, `rgba(255, 247, 214, ${effect.glowAlpha})`);
  gradient.addColorStop(0.42, `rgba(72, 210, 196, ${effect.glowAlpha * 0.36})`);
  gradient.addColorStop(1, "rgba(255, 247, 214, 0)");

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = gradient;
  ctx.fillRect(stage.x, stage.y, stage.width, stage.height);
  ctx.globalCompositeOperation = "source-over";
}

function drawBeatFlash(
  ctx: CanvasRenderingContext2D,
  stage: ImageEffectStage,
  effect: ImageEffectRenderState,
) {
  if (effect.flashAlpha <= 0) {
    return;
  }

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(255, 255, 255, ${effect.flashAlpha})`;
  ctx.fillRect(stage.x, stage.y, stage.width, stage.height);
  ctx.globalCompositeOperation = "source-over";
}

function drawVignette(
  ctx: CanvasRenderingContext2D,
  stage: ImageEffectStage,
  effect: ImageEffectRenderState,
) {
  if (effect.vignetteAlpha <= 0) {
    return;
  }

  const centerX = stage.x + stage.width / 2;
  const centerY = stage.y + stage.height / 2;
  const radius = Math.max(stage.width, stage.height) * 0.74;
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    radius * 0.18,
    centerX,
    centerY,
    radius,
  );

  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.55, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(0, 0, 0, ${effect.vignetteAlpha})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(stage.x, stage.y, stage.width, stage.height);
}

function drawGrain(
  ctx: CanvasRenderingContext2D,
  stage: ImageEffectStage,
  effect: ImageEffectRenderState,
  elapsedMs: number,
) {
  if (effect.grainAlpha <= 0 && effect.scanlineAlpha <= 0) {
    return;
  }

  const lineGap = Math.max(2, Math.round(stage.height / 150));
  const phase = Math.floor(elapsedMs / 44);

  ctx.globalCompositeOperation = "overlay";
  for (let y = 0; y < stage.height; y += lineGap) {
    const flicker = ((phase + y * 17) % 13) / 12;
    const alpha =
      effect.scanlineAlpha * 0.6 + effect.grainAlpha * (0.28 + flicker * 0.52);
    ctx.fillStyle =
      flicker > 0.48
        ? `rgba(255, 255, 255, ${alpha})`
        : `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(stage.x, stage.y + y, stage.width, 1);
  }

  ctx.globalCompositeOperation = "source-over";
}

function normalizePercent(value: number) {
  return clamp(value / 100, 0, 1);
}

function resetCanvasEffectState(ctx: CanvasRenderingContext2D) {
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowColor = "transparent";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
