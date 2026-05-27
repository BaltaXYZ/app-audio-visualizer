export const imageEffectPresetIds = [
  "clean-pulse",
  "warm-glow",
  "neon-shift",
  "dark-impact",
  "glitch-flash",
] as const;

export type ImageEffectPresetId = (typeof imageEffectPresetIds)[number];

export type ImageEffectSettings = {
  enabled: boolean;
  presetId: ImageEffectPresetId;
  amount: number;
  bassPunch: number;
  colorMovement: number;
  glow: number;
  vignette: number;
  grain: number;
};

export type ImageEffectSettingValue = boolean | number | ImageEffectPresetId;

export type ImageEffectPresetOption = {
  id: ImageEffectPresetId;
  label: string;
};

export const imageEffectPresetOptions: ImageEffectPresetOption[] = [
  { id: "clean-pulse", label: "Clean pulse" },
  { id: "warm-glow", label: "Warm glow" },
  { id: "neon-shift", label: "Neon shift" },
  { id: "dark-impact", label: "Dark impact" },
  { id: "glitch-flash", label: "Glitch flash" },
];

export const defaultImageEffectSettings: ImageEffectSettings = {
  enabled: false,
  presetId: "clean-pulse",
  amount: 50,
  bassPunch: 45,
  colorMovement: 12,
  glow: 18,
  vignette: 10,
  grain: 0,
};

export const imageEffectPresets: Record<
  ImageEffectPresetId,
  ImageEffectSettings
> = {
  "clean-pulse": {
    enabled: true,
    presetId: "clean-pulse",
    amount: 58,
    bassPunch: 70,
    colorMovement: 0,
    glow: 14,
    vignette: 6,
    grain: 0,
  },
  "warm-glow": {
    enabled: true,
    presetId: "warm-glow",
    amount: 72,
    bassPunch: 24,
    colorMovement: 28,
    glow: 88,
    vignette: 14,
    grain: 4,
  },
  "neon-shift": {
    enabled: true,
    presetId: "neon-shift",
    amount: 84,
    bassPunch: 42,
    colorMovement: 96,
    glow: 62,
    vignette: 22,
    grain: 10,
  },
  "dark-impact": {
    enabled: true,
    presetId: "dark-impact",
    amount: 82,
    bassPunch: 96,
    colorMovement: 0,
    glow: 8,
    vignette: 88,
    grain: 14,
  },
  "glitch-flash": {
    enabled: true,
    presetId: "glitch-flash",
    amount: 88,
    bassPunch: 74,
    colorMovement: 82,
    glow: 8,
    vignette: 18,
    grain: 92,
  },
};

export function getImageEffectPreset(
  presetId: ImageEffectPresetId,
): ImageEffectSettings {
  return { ...imageEffectPresets[presetId] };
}
