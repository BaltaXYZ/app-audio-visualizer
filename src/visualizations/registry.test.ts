import { describe, expect, it } from "vitest";
import { visualizationRegistry } from "./registry";

describe("visualizationRegistry", () => {
  it("contains at least ten concrete visualizations", () => {
    expect(visualizationRegistry.length).toBeGreaterThanOrEqual(10);
  });

  it("uses unique ids and includes generated controls", () => {
    const ids = visualizationRegistry.map((visualization) => visualization.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(
      visualizationRegistry.every(
        (visualization) =>
          visualization.name &&
          visualization.description &&
          visualization.controls.length > 0,
      ),
    ).toBe(true);
  });

  it("keeps range defaults inside declared bounds", () => {
    for (const visualization of visualizationRegistry) {
      for (const control of visualization.controls) {
        if (control.type !== "range") {
          continue;
        }

        const defaults = visualization.defaultSettings as Record<string, unknown>;
        const value = defaults[control.id];

        expect(typeof value, `${visualization.id}.${control.id}`).toBe(
          "number",
        );
        expect(value, `${visualization.id}.${control.id}`).toBeGreaterThanOrEqual(
          control.min ?? Number.NEGATIVE_INFINITY,
        );
        expect(value, `${visualization.id}.${control.id}`).toBeLessThanOrEqual(
          control.max ?? Number.POSITIVE_INFINITY,
        );
      }
    }
  });

  it("exposes an audio response control for every visualization", () => {
    for (const visualization of visualizationRegistry) {
      expect(
        visualization.controls.some((control) => control.id === "audioResponse"),
        visualization.id,
      ).toBe(true);
    }
  });
});
