import { describe, expect, it, vi } from "vitest";
import {
  captureAudioPlaybackSnapshot,
  createRealtimeRecordingProgress,
  getSupportedRealtimeRecordingFormat,
  restoreAudioPlaybackSnapshot,
} from "./realtimeVideoExport";

describe("real-time video export utilities", () => {
  it("prefers MP4 when MediaRecorder supports it", () => {
    const format = getSupportedRealtimeRecordingFormat((mimeType) =>
      mimeType.startsWith("video/mp4"),
    );

    expect(format).toMatchObject({
      extension: "mp4",
      mimeType: "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    });
  });

  it("falls back to WebM when MP4 is unsupported", () => {
    const format = getSupportedRealtimeRecordingFormat((mimeType) =>
      mimeType.startsWith("video/webm;codecs=vp8"),
    );

    expect(format).toMatchObject({
      extension: "webm",
      mimeType: "video/webm;codecs=vp8,opus",
    });
  });

  it("returns null when MediaRecorder type support is unavailable", () => {
    expect(getSupportedRealtimeRecordingFormat(null)).toBeNull();
  });

  it("captures and restores audio playback state", () => {
    const audio = {
      currentTime: 42,
      paused: false,
      pause: vi.fn(),
    };
    const snapshot = captureAudioPlaybackSnapshot(audio);

    audio.currentTime = 3;
    restoreAudioPlaybackSnapshot(audio, snapshot);

    expect(snapshot).toEqual({ currentTime: 42, wasPaused: false });
    expect(audio.pause).toHaveBeenCalledOnce();
    expect(audio.currentTime).toBe(42);
  });

  it("creates clamped recording progress with wall-clock timing", () => {
    expect(
      createRealtimeRecordingProgress({
        elapsedSeconds: 25,
        durationSeconds: 20,
        startedAt: 1000,
        now: 4500,
      }),
    ).toEqual({
      elapsedSeconds: 20,
      durationSeconds: 20,
      wallClockSeconds: 3.5,
    });
  });
});
