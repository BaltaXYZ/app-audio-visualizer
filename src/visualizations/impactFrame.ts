import type { VisualizationDefinition } from "../types/visualization";
import { alphaColor, audioResponse, stageScale } from "./helpers";

type ImpactFrameSettings = {
  color: string;
  intensity: number;
  thickness: number;
  vignette: boolean;
  audioResponse: number;
};

export const impactFrame: VisualizationDefinition<ImpactFrameSettings> = {
  id: "impact-frame",
  name: "Impact Frame",
  description: "A full-frame flash and edge pulse that reacts to beats.",
  audioInputs: ["bass", "volume", "transient", "beatPulse"],
  defaultSettings: {
    color: "#ff4d6d",
    intensity: 0.75,
    thickness: 14,
    vignette: true,
    audioResponse: 1.65,
  },
  controls: [
    { id: "color", label: "Color", type: "color" },
    {
      id: "intensity",
      label: "Intensity",
      type: "range",
      min: 0.1,
      max: 1,
      step: 0.05,
    },
    { id: "thickness", label: "Thickness", type: "range", min: 3, max: 42 },
    { id: "vignette", label: "Vignette", type: "toggle" },
    {
      id: "audioResponse",
      label: "Audio response",
      type: "range",
      min: 0.5,
      max: 3,
      step: 0.05,
    },
  ],
  supportsDrag: false,
  supportsPositioning: false,
  recommendedFor: "fast",
  render: ({ ctx, width, height }, audio, settings) => {
    const scale = stageScale(width, height);
    const impact = audioResponse(
      audio.beatConfidence * 0.75 +
        audio.transientStrength * 0.65 +
        audio.bass * 0.28 +
        audio.volume * 0.16,
      settings.audioResponse,
    );
    const inset = settings.thickness * scale * (1 + impact * 1.4);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = settings.color;
    ctx.lineWidth = Math.max(2, inset);
    ctx.globalAlpha = settings.intensity * (0.1 + impact * 0.78);
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = 18 + impact * 34;
    ctx.strokeRect(inset / 2, inset / 2, width - inset, height - inset);

    ctx.globalAlpha = settings.intensity * impact * 0.13;
    ctx.fillStyle = settings.color;
    ctx.fillRect(0, 0, width, height);

    if (settings.vignette) {
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.18,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.68,
      );

      gradient.addColorStop(0, alphaColor("#000000", 0));
      gradient.addColorStop(1, alphaColor(settings.color, settings.intensity * (0.08 + impact * 0.16)));
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 1;
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  },
};
