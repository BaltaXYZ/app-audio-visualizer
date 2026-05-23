import { describe, expect, it } from "vitest";
import { isAcceptedAudioFile, isAcceptedImageFile } from "./fileValidation";

describe("file validation", () => {
  it("accepts common image types and extensions", () => {
    expect(
      isAcceptedImageFile(new File([""], "cover.png", { type: "image/png" })),
    ).toBe(true);
    expect(isAcceptedImageFile(new File([""], "cover.webp"))).toBe(true);
  });

  it("accepts common audio types and extensions", () => {
    expect(
      isAcceptedAudioFile(new File([""], "track.wav", { type: "audio/wav" })),
    ).toBe(true);
    expect(isAcceptedAudioFile(new File([""], "track.flac"))).toBe(true);
  });

  it("does not mix image and audio files", () => {
    expect(isAcceptedImageFile(new File([""], "track.wav"))).toBe(false);
    expect(isAcceptedAudioFile(new File([""], "cover.png"))).toBe(false);
  });
});
