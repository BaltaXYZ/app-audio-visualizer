import { describe, expect, it } from "vitest";
import type { AppState } from "./appReducer";
import { initialAppState } from "./appReducer";
import { createProjectSnapshot } from "./projectSnapshot";

describe("createProjectSnapshot", () => {
  it("creates a serializable snapshot without object URLs or File objects", () => {
    const state: AppState = {
      ...initialAppState,
      backgroundImage: {
        file: new File(["image"], "cover.png", { type: "image/png" }),
        objectUrl: "blob:test/cover",
        name: "cover.png",
        type: "image/png",
        size: 512,
        width: 1280,
        height: 720,
      },
      audioTrack: {
        file: new File(["audio"], "song.wav", { type: "audio/wav" }),
        objectUrl: "blob:test/audio",
        name: "song.wav",
        type: "audio/wav",
        size: 1024,
        duration: 12.4,
      },
      selectedVisualizationId: "radial-equalizer",
      videoFormatId: "9-16",
      backgroundMotion: {
        enabled: true,
        direction: "up-right",
        speed: 0.8,
        zoom: 16,
      },
      imageEffects: {
        enabled: true,
        presetId: "neon-shift",
        amount: 74,
        bassPunch: 42,
        colorMovement: 80,
        glow: 34,
        vignette: 12,
        grain: 18,
      },
      lyricLines: [
        { id: "lyric-1", startTime: 1.2, endTime: 3.4, text: "Hello" },
      ],
      lyricsSettings: {
        ...initialAppState.lyricsSettings,
        style: "center",
      },
      visualizationPositions: {
        ...initialAppState.visualizationPositions,
        "radial-equalizer": { x: 0.35, y: 0.6 },
      },
    };

    const snapshot = createProjectSnapshot(state, "2026-05-23T12:00:00.000Z");
    const serialized = JSON.stringify(snapshot);

    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.videoFormatId).toBe("9-16");
    expect(snapshot.assets.backgroundImage?.name).toBe("cover.png");
    expect(snapshot.assets.audioTrack?.duration).toBe(12.4);
    expect(snapshot.backgroundMotion).toEqual({
      enabled: true,
      direction: "up-right",
      speed: 0.8,
      zoom: 16,
    });
    expect(snapshot.imageEffects).toEqual({
      enabled: true,
      presetId: "neon-shift",
      amount: 74,
      bassPunch: 42,
      colorMovement: 80,
      glow: 34,
      vignette: 12,
      grain: 18,
    });
    expect(snapshot.lyrics.lines).toEqual([
      { id: "lyric-1", startTime: 1.2, endTime: 3.4, text: "Hello" },
    ]);
    expect(snapshot.lyrics.settings.style).toBe("center");
    expect(snapshot.visualizationInstances).toEqual([
      {
        instanceId: "active-visualization",
        visualizationId: "radial-equalizer",
        label: "Active visual",
        settings: state.visualizationSettings["radial-equalizer"],
        position: { x: 0.35, y: 0.6 },
        zIndex: 0,
      },
    ]);
    expect(serialized).not.toContain("blob:test");
    expect(serialized).not.toContain("File");
  });
});
