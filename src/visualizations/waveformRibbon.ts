import type { VisualizationDefinition } from "../types/visualization";
import { audioResponse } from "./helpers";

type WaveformRibbonSettings = {
  color: string;
  lineWidth: number;
  amplitude: number;
  audioResponse: number;
};

export const waveformRibbon: VisualizationDefinition<WaveformRibbonSettings> = {
  id: "waveform-ribbon",
  name: "Waveform Ribbon",
  description: "A smooth signal line that moves with the current waveform.",
  audioInputs: ["waveform", "volume", "mids"],
  defaultSettings: {
    color: "#f26d4f",
    lineWidth: 3,
    amplitude: 170,
    audioResponse: 1.5,
  },
  controls: [
    { id: "color", label: "Color", type: "color" },
    { id: "lineWidth", label: "Line width", type: "range", min: 1, max: 10 },
    { id: "amplitude", label: "Amplitude", type: "range", min: 40, max: 260 },
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
    const response = audioResponse(
      audio.volume * 0.65 + audio.mids * 0.45 + audio.energyDelta * 0.35,
      settings.audioResponse,
    );
    const centerY = height * (0.48 + Math.sin(elapsedMs / 1900) * 0.02);
    const amplitude = Math.min(height * 0.34, settings.amplitude);
    const sampleCount = Math.min(260, audio.waveform.length);
    const step = audio.waveform.length / sampleCount;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = settings.color;
    ctx.lineWidth = settings.lineWidth + response * 4;
    ctx.globalAlpha = 0.42 + response * 0.5;
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = 10 + response * 30;
    ctx.beginPath();

    for (let index = 0; index < sampleCount; index += 1) {
      const sample = audio.waveform[Math.floor(index * step)] ?? 0;
      const x = (index / (sampleCount - 1)) * width;
      const y = centerY + sample * amplitude * (0.3 + response * 1.05);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.restore();
  },
};
