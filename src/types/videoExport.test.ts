import { describe, expect, it } from "vitest";
import {
  defaultVideoExportFormatId,
  getSupportedExportMimeType,
  getVideoExportFormat,
  isVideoExportFormatSupported,
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

  it("selects the first supported mime type for a format", () => {
    const support = {
      isTypeSupported: (mimeType: string) => mimeType === "video/mp4",
    };

    expect(getSupportedExportMimeType("mp4", support)).toBe("video/mp4");
    expect(isVideoExportFormatSupported("mp4", support)).toBe(true);
    expect(isVideoExportFormatSupported("webm", support)).toBe(false);
  });

  it("stores file extensions with the export formats", () => {
    expect(getVideoExportFormat("mp4").extension).toBe("mp4");
    expect(getVideoExportFormat("webm").extension).toBe("webm");
  });
});
