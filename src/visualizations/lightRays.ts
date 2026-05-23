import type { VisualizationDefinition } from "../types/visualization";
import { alphaColor, stageScale } from "./helpers";

type LightRaysSettings = {
  color: string;
  rayCount: number;
  length: number;
  intensity: number;
  sweep: number;
};

export const lightRays: VisualizationDefinition<LightRaysSettings> = {
  id: "light-rays",
  name: "Light Rays",
  description: "Bright beams that rotate from a focus point and sharpen on treble.",
  audioInputs: ["bass", "treble", "volume", "beatPulse"],
  defaultSettings: {
    color: "#ffffff",
    rayCount: 28,
    length: 460,
    intensity: 0.72,
    sweep: 0.35,
  },
  controls: [
    { id: "color", label: "Color", type: "color" },
    { id: "rayCount", label: "Ray count", type: "range", min: 8, max: 72 },
    { id: "length", label: "Length", type: "range", min: 140, max: 900 },
    {
      id: "intensity",
      label: "Intensity",
      type: "range",
      min: 0.1,
      max: 1,
      step: 0.05,
    },
    {
      id: "sweep",
      label: "Sweep",
      type: "range",
      min: 0,
      max: 1.5,
      step: 0.05,
    },
  ],
  supportsDrag: true,
  supportsPositioning: true,
  recommendedFor: "fast",
  render: ({ ctx, centerX, centerY, width, height, elapsedMs }, audio, settings) => {
    const scale = stageScale(width, height);
    const count = Math.max(4, Math.round(settings.rayCount));
    const length = settings.length * scale * (0.88 + audio.bass * 0.22);
    const rotation =
      (elapsedMs / 1300) * settings.sweep + audio.beatConfidence * 0.16;
    const alpha = settings.intensity * (0.08 + audio.treble * 0.28 + audio.volume * 0.18);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = 10 + audio.treble * 30;

    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 + rotation;
      const rayLength = length * (0.55 + ((index % 7) / 7) * 0.45);
      const x2 = centerX + Math.cos(angle) * rayLength;
      const y2 = centerY + Math.sin(angle) * rayLength;
      const gradient = ctx.createLinearGradient(centerX, centerY, x2, y2);

      gradient.addColorStop(0, alphaColor(settings.color, alpha * 1.5));
      gradient.addColorStop(0.55, alphaColor(settings.color, alpha * 0.55));
      gradient.addColorStop(1, alphaColor(settings.color, 0));

      ctx.strokeStyle = gradient;
      ctx.lineWidth = Math.max(1, (1.5 + audio.treble * 4) * scale);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  },
};
