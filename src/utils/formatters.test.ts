import { describe, expect, it } from "vitest";
import { formatBytes, formatDuration } from "./formatters";

describe("formatBytes", () => {
  it("formats byte and kilobyte values compactly", () => {
    expect(formatBytes(553)).toBe("553 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1024 * 24)).toBe("24 KB");
  });
});

describe("formatDuration", () => {
  it("formats durations as minutes and seconds", () => {
    expect(formatDuration(2.2)).toBe("0:02");
    expect(formatDuration(65)).toBe("1:05");
  });

  it("uses an English fallback for unavailable duration", () => {
    expect(formatDuration()).toBe("Unknown duration");
    expect(formatDuration(Number.NaN)).toBe("Unknown duration");
  });
});
