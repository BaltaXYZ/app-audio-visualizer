export const lyricStyles = [
  "subtitle",
  "center",
  "karaoke",
  "poster",
] as const;

export const lyricPositions = ["top", "center", "bottom"] as const;

export type LyricStyleId = (typeof lyricStyles)[number];
export type LyricPosition = (typeof lyricPositions)[number];

export type LyricLine = {
  id: string;
  startTime: number | null;
  endTime: number | null;
  text: string;
};

export type LyricsSettings = {
  enabled: boolean;
  style: LyricStyleId;
  position: LyricPosition;
  fontSize: number;
  color: string;
  background: boolean;
  shadow: boolean;
  showNextLine: boolean;
};

export type LyricsSettingValue = boolean | number | string;

export const defaultLyricsSettings: LyricsSettings = {
  enabled: true,
  style: "subtitle",
  position: "bottom",
  fontSize: 34,
  color: "#ffffff",
  background: true,
  shadow: true,
  showNextLine: true,
};
