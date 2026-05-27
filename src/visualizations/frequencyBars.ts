import type { VisualizationDefinition } from "../types/visualization";
import { audioResponse } from "./helpers";

type FrequencyBarsSettings = {
  color: string;
  barCount: number;
  maxHeight: number;
  audioResponse: number;
};

export const frequencyBars: VisualizationDefinition<FrequencyBarsSettings> = {
  id: "frequency-bars",
  name: "Frequency Bars",
  description: "Equalizer bars along the lower edge of the preview.",
  audioInputs: ["frequencyData", "volume"],
  defaultSettings: {
    color: "#7bd6c4",
    barCount: 48,
    maxHeight: 150,
    audioResponse: 1.45,
  },
  controls: [
    { id: "color", label: "Color", type: "color" },
    { id: "barCount", label: "Bar count", type: "range", min: 16, max: 96 },
    { id: "maxHeight", label: "Height", type: "range", min: 40, max: 260 },
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
    const barCount = settings.barCount;
    const gap = 3;
    const barWidth = Math.max(3, (width - gap * (barCount - 1)) / barCount);
    const maxHeight = Math.min(height * 0.42, settings.maxHeight);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = 8 + audioResponse(audio.volume, settings.audioResponse) * 22;

    for (let index = 0; index < barCount; index += 1) {
      const dataIndex = Math.floor(
        (index / barCount) * audio.frequencyData.length * 0.72,
      );
      const rawValue = (audio.frequencyData[dataIndex] ?? 0) / 255;
      const value = audioResponse(
        rawValue + audio.volume * 0.08,
        settings.audioResponse,
      );
      const barHeight = Math.max(4, value * maxHeight);
      const x = index * (barWidth + gap);
      const y = height - barHeight;
      const alpha = 0.24 + value * 0.72;

      ctx.fillStyle = settings.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(x, y, barWidth, barHeight);
    }

    ctx.restore();
  },
};
