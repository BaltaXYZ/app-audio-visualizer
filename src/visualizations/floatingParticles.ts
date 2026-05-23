import type { VisualizationDefinition } from "../types/visualization";
import { stageScale } from "./helpers";

type FloatingParticlesSettings = {
  color: string;
  dotCount: number;
  spread: number;
  size: number;
  drift: number;
};

const goldenAngle = Math.PI * (3 - Math.sqrt(5));

export const floatingParticles: VisualizationDefinition<FloatingParticlesSettings> = {
  id: "floating-particles",
  name: "Floating Particles",
  description: "A cloud of small points that breathe, drift and sparkle with treble.",
  audioInputs: ["volume", "bass", "treble", "slowEnergy"],
  defaultSettings: {
    color: "#f6a6ff",
    dotCount: 120,
    spread: 310,
    size: 4,
    drift: 0.62,
  },
  controls: [
    { id: "color", label: "Color", type: "color" },
    { id: "dotCount", label: "Dot count", type: "range", min: 30, max: 220, step: 5 },
    { id: "spread", label: "Spread", type: "range", min: 100, max: 560 },
    { id: "size", label: "Dot size", type: "range", min: 1, max: 10, step: 0.5 },
    {
      id: "drift",
      label: "Drift",
      type: "range",
      min: 0,
      max: 1.5,
      step: 0.05,
    },
  ],
  supportsDrag: true,
  supportsPositioning: true,
  recommendedFor: "both",
  render: ({ ctx, centerX, centerY, width, height, elapsedMs }, audio, settings) => {
    const scale = stageScale(width, height);
    const count = Math.max(8, Math.round(settings.dotCount));
    const spread = settings.spread * scale * (0.9 + audio.bass * 0.18);
    const time = elapsedMs / 1000;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = settings.color;
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = 5 + audio.treble * 20;

    for (let index = 0; index < count; index += 1) {
      const normalized = (index + 0.5) / count;
      const radius = Math.sqrt(normalized) * spread;
      const baseAngle = index * goldenAngle;
      const wobble =
        Math.sin(time * (0.4 + settings.drift) + index * 0.57) *
        settings.drift *
        0.34;
      const angle = baseAngle + wobble + audio.slowEnergy * 0.4;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * 0.72;
      const pulse = 0.55 + audio.volume * 1.1 + audio.treble * ((index % 5) / 5);
      const dotSize = Math.max(0.8, settings.size * scale * pulse);

      ctx.globalAlpha = 0.18 + audio.treble * 0.3 + (1 - normalized) * 0.28;
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  },
};
