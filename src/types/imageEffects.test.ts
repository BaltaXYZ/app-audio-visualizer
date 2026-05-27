import { describe, expect, it } from "vitest";
import {
  defaultImageEffectSettings,
  imageEffectPresetIds,
  imageEffectPresetOptions,
  imageEffectPresets,
} from "./imageEffects";

describe("image effect presets", () => {
  it("exposes every preset as a selectable option", () => {
    expect(imageEffectPresetOptions.map((preset) => preset.id)).toEqual(
      imageEffectPresetIds,
    );
  });

  it("keeps every preset complete", () => {
    const settingKeys = Object.keys(defaultImageEffectSettings).sort();

    for (const presetId of imageEffectPresetIds) {
      expect(Object.keys(imageEffectPresets[presetId]).sort()).toEqual(
        settingKeys,
      );
      expect(imageEffectPresets[presetId].presetId).toBe(presetId);
    }
  });
});
