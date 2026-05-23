import type { VisualizationDefinition } from "../types/visualization";
import { alphaColor, stageScale } from "./helpers";

type BreathingGlowSettings = {
  color: string;
  size: number;
  intensity: number;
  softness: number;
};

export const breathingGlow: VisualizationDefinition<BreathingGlowSettings> = {
  id: "breathing-glow",
  name: "Breathing Glow",
  description: "A soft light bloom that swells with the song's energy.",
  audioInputs: ["volume", "slowEnergy", "bass"],
  defaultSettings: {
    color: "#5ed8ff",
    size: 240,
    intensity: 0.68,
    softness: 0.72,
  },
  controls: [
    { id: "color", label: "Color", type: "color" },
    { id: "size", label: "Size", type: "range", min: 80, max: 420 },
    {
      id: "intensity",
      label: "Intensity",
      type: "range",
      min: 0.1,
      max: 1,
      step: 0.05,
    },
    {
      id: "softness",
      label: "Softness",
      type: "range",
      min: 0.25,
      max: 1,
      step: 0.05,
    },
  ],
  supportsDrag: true,
  supportsPositioning: true,
  recommendedFor: "calm",
  render: ({ ctx, centerX, centerY, width, height }, audio, settings) => {
    const scale = stageScale(width, height);
    const energy = audio.slowEnergy * 0.75 + audio.bass * 0.45 + audio.volume * 0.3;
    const radius = settings.size * scale * (0.78 + energy * 0.45);
    const inner = Math.max(0.02, 0.08 + settings.softness * 0.18);
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      radius * inner,
      centerX,
      centerY,
      radius,
    );

    gradient.addColorStop(0, alphaColor(settings.color, 0.42 * settings.intensity));
    gradient.addColorStop(
      Math.min(0.78, 0.38 + settings.softness * 0.34),
      alphaColor(settings.color, 0.14 * settings.intensity),
    );
    gradient.addColorStop(1, alphaColor(settings.color, 0));

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  },
};
