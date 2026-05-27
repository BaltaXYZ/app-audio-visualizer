import { describe, expect, it } from "vitest";
import { backgroundMotionDirections } from "./backgroundMotion";

describe("background motion", () => {
  it("includes pan, zoom and organic drift styles", () => {
    expect(backgroundMotionDirections).toEqual([
      "right",
      "left",
      "up",
      "down",
      "up-right",
      "up-left",
      "down-right",
      "down-left",
      "zoom-in",
      "zoom-out",
      "zoom-in-out",
      "organic-drift",
    ]);
  });
});
