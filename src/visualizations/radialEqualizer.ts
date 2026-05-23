import type { VisualizationDefinition } from "../types/visualization";
import { normalizedFrequencyValue, stageScale } from "./helpers";

type RadialEqualizerSettings = {
  color: string;
  radius: number;
  barHeight: number;
  segmentCount: number;
  spin: number;
};

export const radialEqualizer: VisualizationDefinition<RadialEqualizerSettings> = {
  id: "radial-equalizer",
  name: "Radial Equalizer",
  description: "Frequency bars arranged around a draggable center point.",
  audioInputs: ["frequencyData", "bass", "mids", "treble", "volume"],
  defaultSettings: {
    color: "#8adf5f",
    radius: 105,
    barHeight: 150,
    segmentCount: 72,
    spin: 0.18,
  },
  controls: [
    { id: "color", label: "Color", type: "color" },
    { id: "radius", label: "Inner radius", type: "range", min: 40, max: 220 },
    { id: "barHeight", label: "Bar height", type: "range", min: 40, max: 280 },
    {
      id: "segmentCount",
      label: "Segments",
      type: "range",
      min: 24,
      max: 128,
      step: 4,
    },
    {
      id: "spin",
      label: "Spin",
      type: "range",
      min: 0,
      max: 1.2,
      step: 0.02,
    },
  ],
  supportsDrag: true,
  supportsPositioning: true,
  recommendedFor: "both",
  render: ({ ctx, centerX, centerY, width, height, elapsedMs }, audio, settings) => {
    const scale = stageScale(width, height);
    const count = Math.max(8, Math.round(settings.segmentCount));
    const innerRadius = settings.radius * scale * (0.92 + audio.bass * 0.12);
    const maxHeight = settings.barHeight * scale;
    const rotation = (elapsedMs / 1000) * settings.spin;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = settings.color;
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = 7 + audio.treble * 18;
    ctx.lineCap = "round";

    for (let index = 0; index < count; index += 1) {
      const value = normalizedFrequencyValue(audio.frequencyData, index, count);
      const angle = (index / count) * Math.PI * 2 + rotation;
      const heightBoost = 0.24 + value * 0.88 + audio.mids * 0.16;
      const outerRadius = innerRadius + maxHeight * heightBoost;
      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * outerRadius;
      const y2 = centerY + Math.sin(angle) * outerRadius;

      ctx.globalAlpha = 0.2 + value * 0.72 + audio.volume * 0.12;
      ctx.lineWidth = Math.max(1.5, 2.4 * scale + value * 4 * scale);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  },
};
