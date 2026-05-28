import { describe, expect, it } from "vitest";
import type { LocalAsset } from "../types/assets";
import {
  appReducer,
  defaultBackgroundMotion,
  defaultPosition,
  initialAppState,
} from "./appReducer";
import {
  defaultImageEffectSettings,
  imageEffectPresets,
} from "../types/imageEffects";

function createAsset(name: string, type: string): LocalAsset {
  return {
    file: new File([""], name, { type }),
    objectUrl: `blob:test/${name}`,
    name,
    type,
    size: 128,
  };
}

describe("appReducer", () => {
  it("stores background metadata after image load", () => {
    const withImage = appReducer(initialAppState, {
      type: "setBackgroundImage",
      asset: createAsset("cover.png", "image/png"),
    });
    const ready = appReducer(withImage, {
      type: "setBackgroundMetadata",
      width: 1280,
      height: 720,
    });

    expect(ready.backgroundStatus).toBe("ready");
    expect(ready.backgroundImage?.width).toBe(1280);
    expect(ready.backgroundImage?.height).toBe(720);
  });

  it("resets the full project to fresh defaults", () => {
    const withImage = appReducer(initialAppState, {
      type: "setBackgroundImage",
      asset: createAsset("cover.png", "image/png"),
    });
    const withAudio = appReducer(withImage, {
      type: "setAudioTrack",
      asset: createAsset("song.wav", "audio/wav"),
    });
    const withEffects = appReducer(withAudio, {
      type: "applyImageEffectPreset",
      presetId: "glitch-flash",
    });
    const withMotion = appReducer(withEffects, {
      type: "updateBackgroundMotion",
      settingId: "enabled",
      value: true,
    });
    const withLyrics = appReducer(withMotion, {
      type: "applyLyricsDraftResult",
      lines: [
        { id: "lyric-1", startTime: null, endTime: null, text: "First" },
      ],
      draftText: "First",
    });
    const withVisualChange = appReducer(withLyrics, {
      type: "setVisualizationEnabled",
      enabled: false,
    });
    const reset = appReducer(withVisualChange, { type: "resetProject" });

    expect(reset).toEqual(initialAppState);
    expect(reset.backgroundMotion).not.toBe(initialAppState.backgroundMotion);
    expect(reset.imageEffects).not.toBe(initialAppState.imageEffects);
    expect(reset.lyricsSettings).not.toBe(initialAppState.lyricsSettings);
    expect(reset.visualizationSettings).not.toBe(
      initialAppState.visualizationSettings,
    );
    expect(reset.visualizationPositions).not.toBe(
      initialAppState.visualizationPositions,
    );
  });

  it("keeps visualization settings isolated per visualization", () => {
    const changed = appReducer(initialAppState, {
      type: "updateVisualizationSetting",
      visualizationId: "pulse-circle",
      settingId: "baseRadius",
      value: 140,
    });

    expect(changed.visualizationSettings["pulse-circle"].baseRadius).toBe(140);
    expect(changed.visualizationSettings["frequency-bars"].barCount).toBe(48);
  });

  it("toggles the main visual independently from visual settings", () => {
    const disabled = appReducer(initialAppState, {
      type: "setVisualizationEnabled",
      enabled: false,
    });
    const changed = appReducer(disabled, {
      type: "updateVisualizationSetting",
      visualizationId: "pulse-circle",
      settingId: "baseRadius",
      value: 140,
    });
    const enabled = appReducer(changed, {
      type: "setVisualizationEnabled",
      enabled: true,
    });

    expect(disabled.visualizationEnabled).toBe(false);
    expect(changed.visualizationEnabled).toBe(false);
    expect(changed.visualizationSettings["pulse-circle"].baseRadius).toBe(140);
    expect(enabled.visualizationEnabled).toBe(true);
  });

  it("resets settings and position for the selected visualization", () => {
    const moved = appReducer(initialAppState, {
      type: "setVisualizationPosition",
      visualizationId: "pulse-circle",
      position: { x: 0.2, y: 0.8 },
    });
    const changed = appReducer(moved, {
      type: "updateVisualizationSetting",
      visualizationId: "pulse-circle",
      settingId: "baseRadius",
      value: 150,
    });
    const resetSettings = appReducer(changed, {
      type: "resetVisualizationSettings",
      visualizationId: "pulse-circle",
    });
    const resetPosition = appReducer(resetSettings, {
      type: "resetVisualizationPosition",
      visualizationId: "pulse-circle",
    });

    expect(resetSettings.visualizationSettings["pulse-circle"].baseRadius).toBe(
      92,
    );
    expect(resetPosition.visualizationPositions["pulse-circle"]).toEqual(
      defaultPosition,
    );
  });

  it("updates and resets background motion independently", () => {
    const enabled = appReducer(initialAppState, {
      type: "updateBackgroundMotion",
      settingId: "enabled",
      value: true,
    });
    const directed = appReducer(enabled, {
      type: "updateBackgroundMotion",
      settingId: "direction",
      value: "organic-drift",
    });
    const reset = appReducer(directed, { type: "resetBackgroundMotion" });

    expect(directed.backgroundMotion.enabled).toBe(true);
    expect(directed.backgroundMotion.direction).toBe("organic-drift");
    expect(reset.backgroundMotion).toEqual(defaultBackgroundMotion);
  });

  it("updates, applies presets and resets image filters independently", () => {
    const enabled = appReducer(initialAppState, {
      type: "updateImageEffects",
      settingId: "enabled",
      value: true,
    });
    const changed = appReducer(enabled, {
      type: "updateImageEffects",
      settingId: "amount",
      value: 82,
    });
    const preset = appReducer(changed, {
      type: "applyImageEffectPreset",
      presetId: "warm-glow",
    });
    const reset = appReducer(preset, { type: "resetImageEffects" });

    expect(changed.imageEffects.enabled).toBe(true);
    expect(changed.imageEffects.amount).toBe(82);
    expect(changed.backgroundMotion).toEqual(initialAppState.backgroundMotion);
    expect(preset.imageEffects).toEqual(imageEffectPresets["warm-glow"]);
    expect(reset.imageEffects).toEqual(defaultImageEffectSettings);
  });

  it("stores the selected video format", () => {
    const changed = appReducer(initialAppState, {
      type: "setVideoFormat",
      videoFormatId: "9-16",
    });

    expect(changed.videoFormatId).toBe("9-16");
    expect(changed.backgroundMotion).toEqual(initialAppState.backgroundMotion);
  });

  it("imports, times and clears lyrics", () => {
    const dirtyDraft = appReducer(initialAppState, {
      type: "setLyricsDraftText",
      text: "First\nSecond",
    });
    const withLyrics = appReducer(dirtyDraft, {
      type: "applyLyricsDraftResult",
      lines: [
        { id: "lyric-1", startTime: null, endTime: null, text: "First" },
        { id: "lyric-2", startTime: null, endTime: null, text: "Second" },
      ],
      warning: "Imported plain lyrics.",
    });
    const timed = appReducer(withLyrics, {
      type: "setLyricLineTimeAndSelectNext",
      lineId: "lyric-1",
      startTime: 12.4,
    });
    const timingCleared = appReducer(timed, { type: "clearLyricTiming" });
    const cleared = appReducer(timingCleared, { type: "clearLyrics" });

    expect(dirtyDraft.lyricsDraftText).toBe("First\nSecond");
    expect(dirtyDraft.lyricsDraftDirty).toBe(true);
    expect(withLyrics.activeLyricLineId).toBe("lyric-1");
    expect(withLyrics.lyricsDraftDirty).toBe(false);
    expect(withLyrics.lyricsWarning).toBe("Imported plain lyrics.");
    expect(timed.lyricLines[0].startTime).toBe(12.4);
    expect(timed.lyricsDraftText).toBe("[00:12.40] First\nSecond");
    expect(timed.lyricsDraftDirty).toBe(false);
    expect(timed.activeLyricLineId).toBe("lyric-2");
    expect(timingCleared.lyricLines).toEqual([
      { id: "lyric-1", startTime: null, endTime: null, text: "First" },
      { id: "lyric-2", startTime: null, endTime: null, text: "Second" },
    ]);
    expect(timingCleared.lyricsDraftText).toBe("First\nSecond");
    expect(timingCleared.lyricsDraftDirty).toBe(false);
    expect(timingCleared.activeLyricLineId).toBe("lyric-1");
    expect(timingCleared.lyricsWarning).toBe("Timing cleared. Lyrics are kept.");
    expect(cleared.lyricLines).toEqual([]);
    expect(cleared.lyricsDraftText).toBe("");
    expect(cleared.lyricsDraftDirty).toBe(false);
    expect(cleared.activeLyricLineId).toBeNull();
  });

  it("keeps applied lyrics when a draft has parse errors", () => {
    const withLyrics = appReducer(initialAppState, {
      type: "applyLyricsDraftResult",
      draftText: "[00:01.00] First",
      lines: [
        { id: "lyric-1", startTime: 1, endTime: null, text: "First" },
      ],
    });
    const dirtyDraft = appReducer(withLyrics, {
      type: "setLyricsDraftText",
      text: "",
    });
    const failed = appReducer(dirtyDraft, {
      type: "setLyricsError",
      message: "Add lyrics before importing.",
    });

    expect(failed.lyricLines).toEqual(withLyrics.lyricLines);
    expect(failed.lyricsDraftText).toBe("");
    expect(failed.lyricsDraftDirty).toBe(true);
    expect(failed.lyricsError).toBe("Add lyrics before importing.");
  });

  it("updates and resets lyric settings", () => {
    const changed = appReducer(initialAppState, {
      type: "updateLyricsSetting",
      settingId: "style",
      value: "poster",
    });
    const reset = appReducer(changed, { type: "resetLyricsSettings" });

    expect(changed.lyricsSettings.style).toBe("poster");
    expect(reset.lyricsSettings).toEqual(initialAppState.lyricsSettings);
  });
});
