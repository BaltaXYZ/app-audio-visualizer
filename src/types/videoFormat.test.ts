import { describe, expect, it } from "vitest";
import { defaultVideoFormatId, getVideoFormatRatio, videoFormats } from "./videoFormat";

describe("video formats", () => {
  it("defaults to landscape video", () => {
    expect(defaultVideoFormatId).toBe("16-9");
    expect(getVideoFormatRatio(defaultVideoFormatId)).toBeCloseTo(16 / 9);
  });

  it("includes common video aspect ratios", () => {
    expect(videoFormats.map((format) => format.id)).toEqual([
      "16-9",
      "9-16",
      "1-1",
      "4-5",
    ]);
  });
});
