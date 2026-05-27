import { describe, expect, it } from "vitest";
import {
  buildOfflineAudioTimeline,
  getOfflineAudioFrameAtTime,
  type AudioBufferLike,
} from "./offlineAudioAnalyzer";

describe("offline audio analyzer", () => {
  it("creates silent frames for silent audio", () => {
    const timeline = buildOfflineAudioTimeline(
      createMockAudioBuffer(new Float32Array(48_000)),
      { frameRate: 30 },
    );
    const frame = getOfflineAudioFrameAtTime(timeline, 0.5);

    expect(timeline.frames).toHaveLength(30);
    expect(frame.volume).toBe(0);
    expect(frame.bass).toBe(0);
    expect(frame.frequencyData.every((value) => value === 0)).toBe(true);
  });

  it("places low frequency sine energy in the bass band", () => {
    const sampleRate = 48_000;
    const samples = Float32Array.from({ length: sampleRate }, (_, index) => {
      return Math.sin((Math.PI * 2 * 80 * index) / sampleRate) * 0.8;
    });
    const timeline = buildOfflineAudioTimeline(
      createMockAudioBuffer(samples, sampleRate),
      { frameRate: 30 },
    );
    const frame = getOfflineAudioFrameAtTime(timeline, 0.5);

    expect(frame.bass).toBeGreaterThan(0.2);
    expect(frame.bass).toBeGreaterThan(frame.mids * 2);
    expect(frame.bass).toBeGreaterThan(frame.treble * 4);
  });

  it("detects a short transient as a beat pulse", () => {
    const sampleRate = 48_000;
    const samples = new Float32Array(sampleRate);
    const start = Math.floor(sampleRate * 0.5);

    for (let index = 0; index < 320; index += 1) {
      samples[start + index] = 1;
    }

    const timeline = buildOfflineAudioTimeline(
      createMockAudioBuffer(samples, sampleRate),
      { frameRate: 30 },
    );

    expect(timeline.frames.some((frame) => frame.beatPulse)).toBe(true);
    expect(
      timeline.frames.some((frame) => frame.transientStrength > 0.32),
    ).toBe(true);
  });
});

function createMockAudioBuffer(
  channelData: Float32Array,
  sampleRate = 48_000,
): AudioBufferLike {
  return {
    duration: channelData.length / sampleRate,
    length: channelData.length,
    numberOfChannels: 1,
    sampleRate,
    getChannelData: () => channelData,
  };
}
