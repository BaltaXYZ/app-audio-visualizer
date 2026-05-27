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
    amount: 48,
    bassPunch: 46,
    colorMovement: 12,
    glow: 18,
    vignette: 10,
    grain: 0,
  },
  "warm-glow": {
    enabled: true,
    presetId: "warm-glow",
    amount: 62,
    bassPunch: 28,
    colorMovement: 24,
    glow: 58,
    vignette: 18,
    grain: 6,
  },
  "neon-shift": {
    enabled: true,
    presetId: "neon-shift",
    amount: 70,
    bassPunch: 38,
    colorMovement: 72,
    glow: 40,
    vignette: 22,
    grain: 12,
  },
  "dark-impact": {
    enabled: true,
    presetId: "dark-impact",
    amount: 66,
    bassPunch: 70,
    colorMovement: 8,
    glow: 20,
    vignette: 56,
    grain: 10,
  },
  "glitch-flash": {
    enabled: true,
    presetId: "glitch-flash",
    amount: 76,
    bassPunch: 52,
    colorMovement: 54,
    glow: 18,
    vignette: 26,
    grain: 44,
  },
};

export function getImageEffectPreset(
  presetId: ImageEffectPresetId,
): ImageEffectSettings {
  return { ...imageEffectPresets[presetId] };
}
