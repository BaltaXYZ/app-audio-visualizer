import { describe, expect, it } from "vitest";
import { createVideoFileName } from "./videoExport";

describe("video export utilities", () => {
  it("creates a timestamped download file name", () => {
    expect(
      createVideoFileName("mp4", new Date("2026-05-23T14:15:16.000Z")),
    ).toBe("audio-visualizer-2026-05-23-14-15-16.mp4");
  });
});
