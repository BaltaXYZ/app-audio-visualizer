import { describe, expect, it } from "vitest";
import {
  defaultVideoFormatId,
  getVideoFormat,
  getVideoFormatRatio,
  videoFormats,
} from "./videoFormat";

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

  it("stores export dimensions for each format", () => {
    expect(getVideoFormat("16-9")).toMatchObject({
      exportWidth: 1280,
      exportHeight: 720,
    });
    expect(getVideoFormat("9-16")).toMatchObject({
      exportWidth: 720,
      exportHeight: 1280,
    });
  });
});
