import { describe, expect, it } from "vitest";
import {
  getActiveLyricIndex,
  formatLyricsAsLrc,
  formatLyricsAsPlainText,
  formatLyricTime,
  parseLyricsInput,
  setLyricLineStartTime,
} from "./lyrics";

describe("lyrics utilities", () => {
  it("parses timed LRC lines and computes end times", () => {
    const result = parseLyricsInput("[00:01.00] One\n[00:03.50] Two");

    expect(result.error).toBeNull();
    expect(result.lines).toEqual([
      { id: "lyric-1", startTime: 1, endTime: 3.5, text: "One" },
      { id: "lyric-2", startTime: 3.5, endTime: null, text: "Two" },
    ]);
  });

  it("expands multiple timestamps on the same row", () => {
    const result = parseLyricsInput("[00:01.00][00:02.00] Echo");

    expect(result.lines.map((line) => line.startTime)).toEqual([1, 2]);
    expect(result.lines.map((line) => line.text)).toEqual(["Echo", "Echo"]);
  });

  it("imports plain lyrics without timing", () => {
    const result = parseLyricsInput("First line\nSecond line");

    expect(result.error).toBeNull();
    expect(result.warning).toContain("plain lyrics");
    expect(result.lines).toEqual([
      { id: "lyric-1", startTime: null, endTime: null, text: "First line" },
      { id: "lyric-2", startTime: null, endTime: null, text: "Second line" },
    ]);
  });

  it("warns about malformed rows mixed with timed lyrics", () => {
    const result = parseLyricsInput(
      "[00:01.00] One\n[00:xx.yy] Broken\n[00:02.00]",
    );

    expect(result.error).toBeNull();
    expect(result.warning).toContain("2 lyric rows");
    expect(result.lines).toEqual([
      { id: "lyric-1", startTime: 1, endTime: null, text: "One" },
    ]);
  });

  it("returns an error for empty input", () => {
    expect(parseLyricsInput("  \n ").error).toBe("Add lyrics before importing.");
  });

  it("finds the active line from the current audio time", () => {
    const lines = parseLyricsInput(
      "[00:01.00] One\n[00:03.00] Two\n[00:05.00] Three",
    ).lines;

    expect(getActiveLyricIndex(lines, 0.5)).toBe(-1);
    expect(getActiveLyricIndex(lines, 1.2)).toBe(0);
    expect(getActiveLyricIndex(lines, 3.2)).toBe(1);
    expect(getActiveLyricIndex(lines, 9)).toBe(2);
  });

  it("sets line timing", () => {
    const lines = parseLyricsInput("One\nTwo").lines;
    const timed = setLyricLineStartTime(lines, "lyric-1", 4.2);

    expect(timed[0].startTime).toBe(4.2);
  });

  it("formats lyric time without floating-point drift", () => {
    expect(formatLyricTime(1.2)).toBe("00:01.20");
    expect(formatLyricTime(2.4)).toBe("00:02.40");
    expect(formatLyricTime(59.999)).toBe("01:00.00");
  });

  it("formats lyrics back to editable text", () => {
    const lines = parseLyricsInput("[00:01.20] One\nPlain two").lines;

    expect(formatLyricsAsLrc(lines)).toBe("[00:01.20] One");
    expect(
      formatLyricsAsPlainText([
        { id: "lyric-1", startTime: 1.2, endTime: null, text: "One" },
        { id: "lyric-2", startTime: null, endTime: null, text: "Two" },
      ]),
    ).toBe("One\nTwo");
  });
});
