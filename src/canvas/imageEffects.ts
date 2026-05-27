import type { AudioFrame } from "../types/audio";
import type {
  ImageEffectPresetId,
  ImageEffectSettings,
} from "../types/imageEffects";

type ImageEffectStage = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageEffectRenderState = {
  enabled: boolean;
  presetId: ImageEffectPresetId;
  cssFilter: string;
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  toneAlpha: number;
  toneColor: string;
  secondaryToneColor: string;
  darkenAlpha: number;
  glowAlpha: number;
  glowRadius: number;
  vignetteAlpha: number;
  grainAlpha: number;
  flashAlpha: number;
  scanlineAlpha: number;
  channelShift: number;
  channelShiftAlpha: number;
  sliceShift: number;
  sliceAlpha: number;
};

export const neutralImageEffectRenderState: ImageEffectRenderState = {
  enabled: false,
  presetId: "clean-pulse",
  cssFilter: "none",
  brightness: 1,
  contrast: 1,
  saturation: 1,
  hueRotate: 0,
  toneAlpha: 0,
  toneColor: "rgba(255, 255, 255, 0)",
  secondaryToneColor: "rgba(255, 255, 255, 0)",
  darkenAlpha: 0,
  glowAlpha: 0,
  glowRadius: 0,
  vignetteAlpha: 0,
  grainAlpha: 0,
  flashAlpha: 0,
  scanlineAlpha: 0,
  channelShift: 0,
  channelShiftAlpha: 0,
  sliceShift: 0,
  sliceAlpha: 0,
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

  const profile = getPresetProfile(settings.presetId);

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
    1 +
      profile.brightnessLift +
      bassPunch * (0.1 + bassEnergy * 0.36 + beat * 0.32) +
      glow * 0.05,
    0.64,
    1.68,
  );
  const contrast = clamp(
    1 + profile.contrastLift + bassPunch * (0.16 + bassEnergy * 0.74),
    0.72,
    1.95,
  );
  const saturation = clamp(
    1 +
      profile.saturationLift +
      colorMovement * (0.38 + midEnergy * 0.72 + trebleEnergy * 0.46) +
      glow * 0.12,
    0.62,
    2.8,
  );
  const hueRotate = clamp(
    profile.hueBase +
      (colorPhase * 26 + trebleEnergy * 42 + beat * 18) * colorMovement,
    -90,
    90,
  );
  const toneAlpha = clamp(
    amount * profile.toneStrength * (0.14 + totalEnergy * 0.36 + beat * 0.18),
    0,
    0.52,
  );
  const darkenAlpha = clamp(
    amount * profile.darkenStrength * (0.12 + bassEnergy * 0.42 + beat * 0.22),
    0,
    0.58,
  );
  const glowAlpha = clamp(
    glow * (0.24 + totalEnergy * 0.74 + beat * 0.32) * profile.glowMultiplier,
    0,
    0.78,
  );
  const glowRadius = clamp(0.42 + totalEnergy * 0.48, 0.3, 0.94);
  const vignetteAlpha = clamp(
    vignette * (0.24 + bassEnergy * 0.38 + beat * 0.18) +
      profile.vignetteBase * amount,
    0,
    0.82,
  );
  const grainAlpha = clamp(
    grain * (0.1 + trebleEnergy * 0.3 + beat * 0.18),
    0,
    0.42,
  );
  const flashAlpha = clamp(
    bassPunch * (beat * 0.42 + audio.transientStrength * 0.16),
    0,
    0.44,
  );
  const scanlineAlpha = clamp(grain * (0.06 + trebleEnergy * 0.16), 0, 0.22);
  const channelShift = clamp(
    profile.channelShift *
      amount *
      (0.32 + trebleEnergy * 0.58 + beat * 0.64),
    0,
    18,
  );
  const channelShiftAlpha = clamp(
    profile.channelShiftAlpha *
      amount *
      (0.42 + trebleEnergy * 0.42 + beat * 0.36),
    0,
    0.38,
  );
  const sliceShift = clamp(
    profile.sliceShift * amount * (0.2 + beat * 0.88 + trebleEnergy * 0.3),
    0,
    34,
  );
  const sliceAlpha = clamp(
    profile.sliceAlpha * amount * (0.18 + beat * 0.72 + trebleEnergy * 0.36),
    0,
    0.5,
  );

  return {
    enabled: true,
    presetId: settings.presetId,
    cssFilter: `brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(
      3,
    )}) saturate(${saturation.toFixed(3)}) hue-rotate(${hueRotate.toFixed(2)}deg)`,
    brightness,
    contrast,
    saturation,
    hueRotate,
    toneAlpha,
    toneColor: profile.toneColor,
    secondaryToneColor: profile.secondaryToneColor,
    darkenAlpha,
    glowAlpha,
    glowRadius,
    vignetteAlpha,
    grainAlpha,
    flashAlpha,
    scanlineAlpha,
    channelShift,
    channelShiftAlpha,
    sliceShift,
    sliceAlpha,
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

  drawToneOverlay(ctx, stage, effect, elapsedMs);
  drawDarkenOverlay(ctx, stage, effect);
  drawChannelShift(ctx, stage, source, effect);
  drawGlitchSlices(ctx, stage, source, effect, elapsedMs);
  drawGlow(ctx, stage, effect, elapsedMs);
  drawBeatFlash(ctx, stage, effect);
  drawVignette(ctx, stage, effect);
  drawGrain(ctx, stage, effect, elapsedMs);

  ctx.restore();
  resetCanvasEffectState(ctx);
}

function drawToneOverlay(
  ctx: CanvasRenderingContext2D,
  stage: ImageEffectStage,
  effect: ImageEffectRenderState,
  elapsedMs: number,
) {
  if (effect.toneAlpha <= 0) {
    return;
  }

  const gradient = ctx.createLinearGradient(
    stage.x,
    stage.y,
    stage.x + stage.width,
    stage.y + stage.height,
  );
  const pulse = 0.74 + Math.sin(elapsedMs / 520) * 0.26;

  gradient.addColorStop(0, rgbaWithAlpha(effect.toneColor, effect.toneAlpha));
  gradient.addColorStop(
    0.52,
    rgbaWithAlpha(effect.secondaryToneColor, effect.toneAlpha * 0.7 * pulse),
  );
  gradient.addColorStop(1, rgbaWithAlpha(effect.toneColor, effect.toneAlpha * 0.5));

  ctx.globalCompositeOperation =
    effect.presetId === "dark-impact" ? "multiply" : "screen";
  ctx.fillStyle = gradient;
  ctx.fillRect(stage.x, stage.y, stage.width, stage.height);
  ctx.globalCompositeOperation = "source-over";
}

function drawDarkenOverlay(
  ctx: CanvasRenderingContext2D,
  stage: ImageEffectStage,
  effect: ImageEffectRenderState,
) {
  if (effect.darkenAlpha <= 0) {
    return;
  }

  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgba(7, 11, 13, ${effect.darkenAlpha})`;
  ctx.fillRect(stage.x, stage.y, stage.width, stage.height);
  ctx.globalCompositeOperation = "source-over";
}

function drawChannelShift(
  ctx: CanvasRenderingContext2D,
  stage: ImageEffectStage,
  source: HTMLCanvasElement,
  effect: ImageEffectRenderState,
) {
  if (effect.channelShift <= 0 || effect.channelShiftAlpha <= 0) {
    return;
  }

  ctx.globalAlpha = effect.channelShiftAlpha;
  ctx.globalCompositeOperation = "screen";
  ctx.filter = "hue-rotate(95deg) saturate(2.4) contrast(1.2)";
  ctx.drawImage(
    source,
    stage.x + effect.channelShift,
    stage.y,
    stage.width,
    stage.height,
  );
  ctx.filter = "hue-rotate(-95deg) saturate(2.2) contrast(1.15)";
  ctx.drawImage(
    source,
    stage.x - effect.channelShift,
    stage.y,
    stage.width,
    stage.height,
  );
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

function drawGlitchSlices(
  ctx: CanvasRenderingContext2D,
  stage: ImageEffectStage,
  source: HTMLCanvasElement,
  effect: ImageEffectRenderState,
  elapsedMs: number,
) {
  if (effect.sliceShift <= 0 || effect.sliceAlpha <= 0) {
    return;
  }

  const sliceCount = 6;
  const sliceHeight = Math.max(6, stage.height * 0.035);
  const phase = Math.floor(elapsedMs / 72);

  ctx.globalAlpha = effect.sliceAlpha;
  for (let index = 0; index < sliceCount; index += 1) {
    const y =
      ((phase * 31 + index * 97) % Math.max(1, stage.height - sliceHeight)) |
      0;
    const direction = index % 2 === 0 ? 1 : -1;
    const offset =
      direction * effect.sliceShift * (0.45 + ((phase + index) % 5) / 5);

    ctx.drawImage(
      source,
      0,
      y,
      source.width,
      sliceHeight,
      stage.x + offset,
      stage.y + y,
      stage.width,
      sliceHeight,
    );
  }
  ctx.globalAlpha = 1;
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

  gradient.addColorStop(0, rgbaWithAlpha(effect.toneColor, effect.glowAlpha));
  gradient.addColorStop(
    0.42,
    rgbaWithAlpha(effect.secondaryToneColor, effect.glowAlpha * 0.55),
  );
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

type PresetProfile = {
  brightnessLift: number;
  contrastLift: number;
  saturationLift: number;
  hueBase: number;
  toneColor: string;
  secondaryToneColor: string;
  toneStrength: number;
  darkenStrength: number;
  glowMultiplier: number;
  vignetteBase: number;
  channelShift: number;
  channelShiftAlpha: number;
  sliceShift: number;
  sliceAlpha: number;
};

function getPresetProfile(presetId: ImageEffectPresetId): PresetProfile {
  switch (presetId) {
    case "warm-glow":
      return {
        brightnessLift: 0.1,
        contrastLift: 0.05,
        saturationLift: 0.26,
        hueBase: 7,
        toneColor: "255, 172, 75",
        secondaryToneColor: "255, 226, 150",
        toneStrength: 0.72,
        darkenStrength: 0,
        glowMultiplier: 1.26,
        vignetteBase: 0.02,
        channelShift: 0,
        channelShiftAlpha: 0,
        sliceShift: 0,
        sliceAlpha: 0,
      };
    case "neon-shift":
      return {
        brightnessLift: 0.04,
        contrastLift: 0.12,
        saturationLift: 0.58,
        hueBase: -12,
        toneColor: "38, 228, 255",
        secondaryToneColor: "255, 49, 214",
        toneStrength: 0.56,
        darkenStrength: 0,
        glowMultiplier: 1.1,
        vignetteBase: 0.04,
        channelShift: 8,
        channelShiftAlpha: 0.22,
        sliceShift: 0,
        sliceAlpha: 0,
      };
    case "dark-impact":
      return {
        brightnessLift: -0.2,
        contrastLift: 0.32,
        saturationLift: -0.1,
        hueBase: 0,
        toneColor: "255, 55, 42",
        secondaryToneColor: "255, 154, 63",
        toneStrength: 0.24,
        darkenStrength: 0.86,
        glowMultiplier: 0.65,
        vignetteBase: 0.18,
        channelShift: 0,
        channelShiftAlpha: 0,
        sliceShift: 0,
        sliceAlpha: 0,
      };
    case "glitch-flash":
      return {
        brightnessLift: 0.02,
        contrastLift: 0.18,
        saturationLift: 0.34,
        hueBase: 18,
        toneColor: "33, 248, 214",
        secondaryToneColor: "255, 38, 125",
        toneStrength: 0.42,
        darkenStrength: 0,
        glowMultiplier: 0.55,
        vignetteBase: 0,
        channelShift: 16,
        channelShiftAlpha: 0.34,
        sliceShift: 30,
        sliceAlpha: 0.48,
      };
    case "clean-pulse":
    default:
      return {
        brightnessLift: 0,
        contrastLift: 0.06,
        saturationLift: 0,
        hueBase: 0,
        toneColor: "255, 255, 255",
        secondaryToneColor: "198, 255, 240",
        toneStrength: 0.1,
        darkenStrength: 0,
        glowMultiplier: 0.72,
        vignetteBase: 0,
        channelShift: 0,
        channelShiftAlpha: 0,
        sliceShift: 0,
        sliceAlpha: 0,
      };
  }
}

function rgbaWithAlpha(rgb: string, alpha: number) {
  return `rgba(${rgb}, ${clamp(alpha, 0, 1)})`;
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
