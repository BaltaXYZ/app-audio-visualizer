import { describe, expect, it } from "vitest";
import {
  createExportFrameSchedule,
  createVideoFileName,
  renderProjectVideo,
  type RenderProjectVideoOptions,
} from "./videoExport";

describe("video export utilities", () => {
  it("creates a timestamped download file name", () => {
    expect(
      createVideoFileName("mp4", new Date("2026-05-23T14:15:16.000Z")),
    ).toBe("audio-visualizer-2026-05-23-14-15-16.mp4");
  });

  it("creates exact frame timestamps for a one second render", () => {
    const schedule = createExportFrameSchedule(1, 30);
    const totalDuration = schedule.reduce(
      (total, frame) => total + frame.durationSeconds,
      0,
    );

    expect(schedule).toHaveLength(30);
    expect(schedule[0]).toMatchObject({ index: 0, timestampSeconds: 0 });
    expect(schedule.at(-1)?.timestampSeconds).toBeCloseTo(29 / 30);
    expect(totalDuration).toBeCloseTo(1);
  });

  it("shortens the final frame for non-even durations", () => {
    const schedule = createExportFrameSchedule(1.01, 30);

    expect(schedule).toHaveLength(31);
    expect(schedule.at(-1)?.durationSeconds).toBeCloseTo(0.01);
  });

  it("honors an already cancelled export before touching browser APIs", async () => {
    const abortController = new AbortController();
    abortController.abort();

    await expect(
      renderProjectVideo({
        signal: abortController.signal,
      } as RenderProjectVideoOptions),
    ).rejects.toThrow("Export cancelled.");
  });
});
