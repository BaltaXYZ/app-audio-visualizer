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
  it("offers Fast MP4 before quality MP4 and WebM", () => {
    expect(defaultVideoExportFormatId).toBe("mp4-fast");
    expect(videoExportFormats.map((format) => format.id)).toEqual([
      "mp4-fast",
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
      getSupportedVideoExportProfile("mp4-fast", {
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
    expect(getVideoExportFormat("mp4-fast").extension).toBe("mp4");
    expect(getVideoExportFormat("mp4").extension).toBe("mp4");
    expect(getVideoExportFormat("webm").extension).toBe("webm");
  });

  it("maps export profiles to their output containers", () => {
    expect(getVideoExportFormat("mp4-fast").container).toBe("mp4");
    expect(getVideoExportFormat("mp4").container).toBe("mp4");
    expect(getVideoExportFormat("webm").container).toBe("webm");
  });

  it("uses realtime latency for the default fast export profile", () => {
    expect(getVideoExportFormat(defaultVideoExportFormatId).latencyMode).toBe(
      "realtime",
    );
    expect(getVideoExportFormat("mp4").latencyMode).toBe("quality");
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
