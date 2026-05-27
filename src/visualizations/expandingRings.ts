import type { VisualizationDefinition } from "../types/visualization";
import { audioResponse, stageScale } from "./helpers";

type ExpandingRingsSettings = {
  color: string;
  ringCount: number;
  maxRadius: number;
  lineWidth: number;
  speed: number;
  audioResponse: number;
};

export const expandingRings: VisualizationDefinition<ExpandingRingsSettings> = {
  id: "expanding-rings",
  name: "Expanding Rings",
  description: "Concentric ripples that push outward on transients and bass.",
  audioInputs: ["bass", "energyDelta", "transient", "beatPulse"],
  defaultSettings: {
    color: "#ffd166",
    ringCount: 5,
    maxRadius: 330,
    lineWidth: 4,
    speed: 0.85,
    audioResponse: 1.45,
  },
  controls: [
    { id: "color", label: "Color", type: "color" },
    { id: "ringCount", label: "Ring count", type: "range", min: 2, max: 10 },
    { id: "maxRadius", label: "Reach", type: "range", min: 120, max: 560 },
    { id: "lineWidth", label: "Line width", type: "range", min: 1, max: 12 },
    {
      id: "speed",
      label: "Speed",
      type: "range",
      min: 0.35,
      max: 1.8,
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
  recommendedFor: "fast",
  render: ({ ctx, centerX, centerY, width, height, elapsedMs }, audio, settings) => {
    const scale = stageScale(width, height);
    const count = Math.max(2, Math.round(settings.ringCount));
    const bassResponse = audioResponse(audio.bass, settings.audioResponse);
    const maxRadius = settings.maxRadius * scale * (0.82 + bassResponse * 0.3);
    const accent = audioResponse(
      audio.transientStrength * 0.8 +
        audio.energyDelta * 1.7 +
        audio.beatConfidence * 0.45 +
        audio.bass * 0.2,
      settings.audioResponse,
    );

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = settings.color;
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = 12 + accent * 28;
    ctx.lineWidth = Math.max(1.5, settings.lineWidth * scale);

    for (let index = 0; index < count; index += 1) {
      const offset = index / count;
      const phase =
        (elapsedMs / (1500 / settings.speed) +
          offset +
          audioResponse(audio.beatConfidence, settings.audioResponse) * 0.14) %
        1;
      const radius = Math.max(4, phase * maxRadius);
      const alpha = (1 - phase) * (0.2 + accent * 0.52);

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  },
};
