import { describe, expect, it } from "vitest";
import type { LocalAsset } from "../types/assets";
import {
  appReducer,
  defaultBackgroundMotion,
  defaultPosition,
  initialAppState,
} from "./appReducer";

function createAsset(name: string, type: string): LocalAsset {
  return {
    file: new File([""], name, { type }),
    objectUrl: `blob:test/${name}`,
    name,
    type,
    size: 128,
  };
}

describe("appReducer", () => {
  it("stores background metadata after image load", () => {
    const withImage = appReducer(initialAppState, {
      type: "setBackgroundImage",
      asset: createAsset("cover.png", "image/png"),
    });
    const ready = appReducer(withImage, {
      type: "setBackgroundMetadata",
      width: 1280,
      height: 720,
    });

    expect(ready.backgroundStatus).toBe("ready");
    expect(ready.backgroundImage?.width).toBe(1280);
    expect(ready.backgroundImage?.height).toBe(720);
  });

  it("keeps visualization settings isolated per visualization", () => {
    const changed = appReducer(initialAppState, {
      type: "updateVisualizationSetting",
      visualizationId: "pulse-circle",
      settingId: "baseRadius",
      value: 140,
    });

    expect(changed.visualizationSettings["pulse-circle"].baseRadius).toBe(140);
    expect(changed.visualizationSettings["frequency-bars"].barCount).toBe(48);
  });

  it("resets settings and position for the selected visualization", () => {
    const moved = appReducer(initialAppState, {
      type: "setVisualizationPosition",
      visualizationId: "pulse-circle",
      position: { x: 0.2, y: 0.8 },
    });
    const changed = appReducer(moved, {
      type: "updateVisualizationSetting",
      visualizationId: "pulse-circle",
      settingId: "baseRadius",
      value: 150,
    });
    const resetSettings = appReducer(changed, {
      type: "resetVisualizationSettings",
      visualizationId: "pulse-circle",
    });
    const resetPosition = appReducer(resetSettings, {
      type: "resetVisualizationPosition",
      visualizationId: "pulse-circle",
    });

    expect(resetSettings.visualizationSettings["pulse-circle"].baseRadius).toBe(
      92,
    );
    expect(resetPosition.visualizationPositions["pulse-circle"]).toEqual(
      defaultPosition,
    );
  });

  it("updates and resets background motion independently", () => {
    const enabled = appReducer(initialAppState, {
      type: "updateBackgroundMotion",
      settingId: "enabled",
      value: true,
    });
    const directed = appReducer(enabled, {
      type: "updateBackgroundMotion",
      settingId: "direction",
      value: "down-right",
    });
    const reset = appReducer(directed, { type: "resetBackgroundMotion" });

    expect(directed.backgroundMotion.enabled).toBe(true);
    expect(directed.backgroundMotion.direction).toBe("down-right");
    expect(reset.backgroundMotion).toEqual(defaultBackgroundMotion);
  });

  it("stores the selected video format", () => {
    const changed = appReducer(initialAppState, {
      type: "setVideoFormat",
      videoFormatId: "9-16",
    });

    expect(changed.videoFormatId).toBe("9-16");
    expect(changed.backgroundMotion).toEqual(initialAppState.backgroundMotion);
  });
});
