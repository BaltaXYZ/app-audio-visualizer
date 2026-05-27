import { describe, expect, it } from "vitest";
import type { AudioFrame } from "../types/audio";
import { createSilentAudioFrame } from "../types/audio";
import type { ImageEffectSettings } from "../types/imageEffects";
import { imageEffectPresets } from "../types/imageEffects";
import {
  calculateImageEffectRenderState,
  neutralImageEffectRenderState,
} from "./imageEffects";

function createAudioFrame(overrides: Partial<AudioFrame> = {}): AudioFrame {
  const silent = createSilentAudioFrame();

  return {
    ...silent,
    ...overrides,
    frequencyBands: {
      ...silent.frequencyBands,
      ...overrides.frequencyBands,
    },
  };
}

describe("calculateImageEffectRenderState", () => {
  it("returns a neutral state when filters are disabled", () => {
    const result = calculateImageEffectRenderState(
      { ...imageEffectPresets["warm-glow"], enabled: false },
      createAudioFrame({ bass: 1, beatPulse: true, beatConfidence: 1 }),
      1000,
    );

    expect(result).toEqual(neutralImageEffectRenderState);
  });

  it("returns a neutral state when amount is zero", () => {
    const result = calculateImageEffectRenderState(
      { ...imageEffectPresets["neon-shift"], amount: 0 },
      createAudioFrame({ treble: 1, mids: 1 }),
      1000,
    );

    expect(result).toEqual(neutralImageEffectRenderState);
  });

  it("raises punch and flash on strong bass beats", () => {
    const settings: ImageEffectSettings = {
      ...imageEffectPresets["clean-pulse"],
      amount: 100,
      bassPunch: 100,
      colorMovement: 0,
      glow: 0,
      vignette: 0,
      grain: 0,
    };
    const quiet = calculateImageEffectRenderState(
      settings,
      createAudioFrame(),
      0,
    );
    const beat = calculateImageEffectRenderState(
      settings,
      createAudioFrame({
        volume: 0.9,
        slowEnergy: 0.7,
        bass: 1,
        transientStrength: 0.9,
        beatPulse: true,
        beatConfidence: 0.86,
      }),
      0,
    );

    expect(beat.contrast).toBeGreaterThan(quiet.contrast);
    expect(beat.brightness).toBeGreaterThan(quiet.brightness);
    expect(beat.flashAlpha).toBeGreaterThan(0);
  });

  it("keeps treble grain within bounded render values", () => {
    const settings: ImageEffectSettings = {
      ...imageEffectPresets["glitch-flash"],
      amount: 100,
      grain: 100,
    };
    const quiet = calculateImageEffectRenderState(
      settings,
      createAudioFrame(),
      500,
    );
    const treble = calculateImageEffectRenderState(
      settings,
      createAudioFrame({
        treble: 1,
        frequencyBands: {
          bass: 0,
          lowMid: 0,
          mid: 0,
          highMid: 1,
          treble: 1,
        },
      }),
      500,
    );

    expect(treble.grainAlpha).toBeGreaterThan(quiet.grainAlpha);
    expect(treble.grainAlpha).toBeLessThanOrEqual(0.24);
    expect(treble.scanlineAlpha).toBeLessThanOrEqual(0.12);
  });
});
