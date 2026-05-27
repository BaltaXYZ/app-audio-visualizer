import { describe, expect, it } from "vitest";
import {
  defaultVideoExportFormatId,
  getSupportedVideoExportProfile,
  getVideoExportFormat,
  isVideoExportFormatSupported,
  type VideoExportCodecSupport,
  videoExportFormats,
} from "./videoExport";

describe("video export formats", () => {
  it("offers MP4 before WebM", () => {
    expect(defaultVideoExportFormatId).toBe("mp4");
    expect(videoExportFormats.map((format) => format.id)).toEqual([
      "mp4",
      "webm",
    ]);
  });

  it("requires both video and audio codec support for a format", async () => {
    const support = {
      canEncodeVideo: async (codec: string) => codec === "avc",
      canEncodeAudio: async (codec: string) => codec === "aac",
    } as VideoExportCodecSupport;

    await expect(
      getSupportedVideoExportProfile("mp4", {
        width: 1280,
        height: 720,
        support,
      }),
    ).resolves.toMatchObject({ mimeType: "video/mp4" });
    await expect(
      isVideoExportFormatSupported("webm", {
        width: 1280,
        height: 720,
        support,
      }),
    ).resolves.toBe(false);
  });

  it("stores file extensions with the export formats", () => {
    expect(getVideoExportFormat("mp4").extension).toBe("mp4");
    expect(getVideoExportFormat("webm").extension).toBe("webm");
  });

  it("returns no support when WebCodecs support is unavailable", async () => {
    await expect(
      getSupportedVideoExportProfile("mp4", {
        width: 1280,
        height: 720,
        support: null,
      }),
    ).resolves.toBeNull();
  });
});
