import type { VisualizationDefinition } from "../types/visualization";
import { alphaColor, audioResponse, stageScale } from "./helpers";

type BreathingGlowSettings = {
  color: string;
  size: number;
  intensity: number;
  softness: number;
  audioResponse: number;
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
    audioResponse: 1.55,
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
    {
      id: "audioResponse",
      label: "Audio response",
      type: "range",
      min: 0.5,
      max: 3,
      step: 0.05,
    },
  ],
  supportsDrag: true,
  supportsPositioning: true,
  recommendedFor: "calm",
  render: ({ ctx, centerX, centerY, width, height }, audio, settings) => {
    const scale = stageScale(width, height);
    const energy = audioResponse(
      audio.slowEnergy * 0.7 + audio.bass * 0.5 + audio.volume * 0.45,
      settings.audioResponse,
    );
    const radius = settings.size * scale * (0.72 + energy * 0.68);
    const inner = Math.max(0.02, 0.08 + settings.softness * 0.18);
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      radius * inner,
      centerX,
      centerY,
      radius,
    );

    gradient.addColorStop(
      0,
      alphaColor(settings.color, (0.34 + energy * 0.22) * settings.intensity),
    );
    gradient.addColorStop(
      Math.min(0.78, 0.38 + settings.softness * 0.34),
      alphaColor(settings.color, (0.09 + energy * 0.16) * settings.intensity),
    );
    gradient.addColorStop(1, alphaColor(settings.color, 0));

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  },
};
