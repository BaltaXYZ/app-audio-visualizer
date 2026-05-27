import type { VisualizationDefinition } from "../types/visualization";
import { audioResponse, stageScale } from "./helpers";

type PulseCircleSettings = {
  color: string;
  baseRadius: number;
  pulseRadius: number;
  lineWidth: number;
  audioResponse: number;
};

export const pulseCircle: VisualizationDefinition<PulseCircleSettings> = {
  id: "pulse-circle",
  name: "Pulse Circle",
  description: "A clean focus ring that expands with bass and overall energy.",
  audioInputs: ["bass", "volume", "slowEnergy"],
  defaultSettings: {
    color: "#f5e6a6",
    baseRadius: 92,
    pulseRadius: 92,
    lineWidth: 5,
    audioResponse: 1.35,
  },
  controls: [
    { id: "color", label: "Color", type: "color" },
    { id: "baseRadius", label: "Base size", type: "range", min: 40, max: 180 },
    {
      id: "pulseRadius",
      label: "Pulse strength",
      type: "range",
      min: 20,
      max: 160,
    },
    { id: "lineWidth", label: "Line width", type: "range", min: 1, max: 12 },
    {
      id: "audioResponse",
      label: "Audio response",
      type: "range",
      min: 0.4,
      max: 2.6,
      step: 0.05,
    },
  ],
  supportsDrag: true,
  supportsPositioning: true,
  recommendedFor: "both",
  render: ({ ctx, centerX, centerY, width, height }, audio, settings) => {
    const scale = stageScale(width, height);
    const pulse = audioResponse(
      audio.bass * 0.9 + audio.volume * 0.55 + audio.energyDelta * 0.35,
      settings.audioResponse,
    );
    const glow = audioResponse(
      audio.slowEnergy * 0.8 + audio.volume * 0.35,
      settings.audioResponse,
    );
    const radius =
      (settings.baseRadius + settings.pulseRadius * pulse) * scale;
    const glowRadius = radius * (1.14 + glow * 0.32);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = settings.color;
    ctx.lineWidth = Math.max(2, settings.lineWidth * scale);
    ctx.globalAlpha = 0.45 + pulse * 0.48;
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = 16 + pulse * 42;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.1 + glow * 0.26;
    ctx.lineWidth = Math.max(8, 18 * scale);
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },
};
