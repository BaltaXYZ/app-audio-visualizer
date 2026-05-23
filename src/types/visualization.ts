import type { AudioFrame } from "./audio";

export type NormalizedPoint = {
  x: number;
  y: number;
};

export type AudioInputKind =
  | "volume"
  | "slowEnergy"
  | "energyDelta"
  | "bass"
  | "mids"
  | "treble"
  | "waveform"
  | "frequencyData"
  | "transient"
  | "beatPulse";

export type RenderContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  position: NormalizedPoint;
  elapsedMs: number;
  deltaMs: number;
};

export type ControlValue = string | number | boolean;
export type VisualizationSettings = Record<string, ControlValue>;

export type ControlDefinition = {
  id: string;
  label: string;
  type: "range" | "color" | "select" | "toggle";
  min?: number;
  max?: number;
  step?: number;
  options?: readonly string[];
};

export type VisualizationDefinition<TSettings = Record<string, unknown>> = {
  id: string;
  name: string;
  description: string;
  audioInputs: AudioInputKind[];
  defaultSettings: TSettings;
  controls: ControlDefinition[];
  supportsDrag: boolean;
  supportsPositioning: boolean;
  recommendedFor: "calm" | "fast" | "both";
  render: (
    context: RenderContext,
    audio: AudioFrame,
    settings: TSettings,
  ) => void;
};

export type AnyVisualizationDefinition = VisualizationDefinition<any>;
