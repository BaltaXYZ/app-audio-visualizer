import type { VisualizationDefinition } from "../types/visualization";

type PulseCircleSettings = {
  color: string;
  baseRadius: number;
  pulseRadius: number;
  lineWidth: number;
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
  ],
  supportsDrag: true,
  supportsPositioning: true,
  recommendedFor: "both",
  render: ({ ctx, centerX, centerY, width, height }, audio, settings) => {
    const stageScale = Math.min(width, height) / 720;
    const radius =
      (settings.baseRadius +
        settings.pulseRadius * (audio.bass * 0.85 + audio.volume * 0.35)) *
      stageScale;
    const glowRadius = radius * (1.14 + audio.slowEnergy * 0.22);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = settings.color;
    ctx.lineWidth = Math.max(2, settings.lineWidth * stageScale);
    ctx.globalAlpha = 0.55 + audio.volume * 0.34;
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = 18 + audio.bass * 34;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.12 + audio.slowEnergy * 0.18;
    ctx.lineWidth = Math.max(8, 18 * stageScale);
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },
};
