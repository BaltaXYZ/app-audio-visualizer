import { bassHorizon } from "./bassHorizon";
import { breathingGlow } from "./breathingGlow";
import { expandingRings } from "./expandingRings";
import { frequencyBars } from "./frequencyBars";
import { floatingParticles } from "./floatingParticles";
import { impactFrame } from "./impactFrame";
import { lightRays } from "./lightRays";
import { pulseCircle } from "./pulseCircle";
import { radialEqualizer } from "./radialEqualizer";
import { spectralFog } from "./spectralFog";
import { waveformRibbon } from "./waveformRibbon";

export const visualizationRegistry = [
  pulseCircle,
  radialEqualizer,
  frequencyBars,
  waveformRibbon,
  expandingRings,
  breathingGlow,
  floatingParticles,
  lightRays,
  spectralFog,
  impactFrame,
  bassHorizon,
] as const;

export type VisualizationId = (typeof visualizationRegistry)[number]["id"];

export function getVisualizationById(id: string) {
  return (
    visualizationRegistry.find((visualization) => visualization.id === id) ??
    visualizationRegistry[0]
  );
}
