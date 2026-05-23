import type { VisualizationDefinition } from "../types/visualization";
import { alphaColor } from "./helpers";

type SpectralFogSettings = {
  lowColor: string;
  highColor: string;
  density: number;
  opacity: number;
  flow: number;
};

export const spectralFog: VisualizationDefinition<SpectralFogSettings> = {
  id: "spectral-fog",
  name: "Spectral Fog",
  description: "Layered color haze where bass and treble pull different tones.",
  audioInputs: ["bass", "mids", "treble", "slowEnergy"],
  defaultSettings: {
    lowColor: "#3a86ff",
    highColor: "#ffbe0b",
    density: 6,
    opacity: 0.34,
    flow: 0.55,
  },
  controls: [
    { id: "lowColor", label: "Low color", type: "color" },
    { id: "highColor", label: "High color", type: "color" },
    { id: "density", label: "Density", type: "range", min: 3, max: 12 },
    {
      id: "opacity",
      label: "Opacity",
      type: "range",
      min: 0.08,
      max: 0.7,
      step: 0.02,
    },
    {
      id: "flow",
      label: "Flow",
      type: "range",
      min: 0,
      max: 1.5,
      step: 0.05,
    },
  ],
  supportsDrag: false,
  supportsPositioning: false,
  recommendedFor: "calm",
  render: ({ ctx, width, height, elapsedMs }, audio, settings) => {
    const layers = Math.max(2, Math.round(settings.density));
    const time = elapsedMs / 1000;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.filter = "blur(18px)";

    for (let index = 0; index < layers; index += 1) {
      const phase = index / layers;
      const color = index % 2 === 0 ? settings.lowColor : settings.highColor;
      const energy = index % 2 === 0 ? audio.bass : audio.treble;
      const x =
        width *
        (0.18 + phase * 0.72 + Math.sin(time * settings.flow + index) * 0.08);
      const y =
        height *
        (0.22 + ((index * 0.37) % 0.62) + Math.cos(time * settings.flow * 0.7 + index) * 0.06);
      const radiusX = width * (0.18 + audio.slowEnergy * 0.08 + phase * 0.03);
      const radiusY = height * (0.16 + audio.mids * 0.08 + (1 - phase) * 0.04);

      ctx.globalAlpha = settings.opacity * (0.28 + energy * 0.9);
      ctx.fillStyle = alphaColor(color, 0.8);
      ctx.beginPath();
      ctx.ellipse(x, y, radiusX, radiusY, phase * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  },
};
