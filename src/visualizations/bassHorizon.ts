import type { VisualizationDefinition } from "../types/visualization";
import {
  alphaColor,
  audioResponse,
  normalizedFrequencyValue,
  stageScale,
} from "./helpers";

type BassHorizonSettings = {
  color: string;
  layers: number;
  height: number;
  roughness: number;
  audioResponse: number;
};

export const bassHorizon: VisualizationDefinition<BassHorizonSettings> = {
  id: "bass-horizon",
  name: "Bass Horizon",
  description: "Stacked horizon lines that rise and ripple with low frequencies.",
  audioInputs: ["frequencyData", "bass", "mids", "volume"],
  defaultSettings: {
    color: "#00c2a8",
    layers: 5,
    height: 120,
    roughness: 0.72,
    audioResponse: 1.45,
  },
  controls: [
    { id: "color", label: "Color", type: "color" },
    { id: "layers", label: "Layers", type: "range", min: 2, max: 9 },
    { id: "height", label: "Height", type: "range", min: 40, max: 260 },
    {
      id: "roughness",
      label: "Roughness",
      type: "range",
      min: 0.2,
      max: 1.4,
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
  supportsDrag: false,
  supportsPositioning: false,
  recommendedFor: "both",
  render: ({ ctx, width, height, elapsedMs }, audio, settings) => {
    const scale = stageScale(width, height);
    const layers = Math.max(2, Math.round(settings.layers));
    const points = 72;
    const bassResponse = audioResponse(audio.bass, settings.audioResponse);
    const midsResponse = audioResponse(audio.mids, settings.audioResponse);
    const baseY = height * (0.73 - bassResponse * 0.14);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = 8 + bassResponse * 28;

    for (let layer = 0; layer < layers; layer += 1) {
      const depth = layer / Math.max(1, layers - 1);
      const layerY = baseY + depth * height * 0.16;
      const amplitude =
        settings.height *
        scale *
        (0.24 + depth * 0.7) *
        (0.56 + bassResponse * 1.05);

      ctx.strokeStyle = alphaColor(settings.color, 0.32 + (1 - depth) * 0.34);
      ctx.lineWidth = Math.max(1, (1.5 + (1 - depth) * 2.5) * scale);
      ctx.beginPath();

      for (let point = 0; point < points; point += 1) {
        const x = (point / (points - 1)) * width;
        const value = audioResponse(
          normalizedFrequencyValue(audio.frequencyData, point, points, 0.34),
          settings.audioResponse,
        );
        const wave =
          Math.sin(point * 0.42 + elapsedMs / 420 + layer * 1.2) *
          settings.roughness *
          0.18;
        const y = layerY - (value + wave + midsResponse * 0.16) * amplitude;

        if (point === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    ctx.restore();
  },
};
