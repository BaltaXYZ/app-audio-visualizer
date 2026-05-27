export const backgroundMotionDirections = [
  "right",
  "left",
  "up",
  "down",
  "up-right",
  "up-left",
  "down-right",
  "down-left",
  "zoom-in",
  "zoom-out",
  "zoom-in-out",
  "organic-drift",
] as const;

export type BackgroundMotionDirection =
  (typeof backgroundMotionDirections)[number];

export type BackgroundMotionSettings = {
  enabled: boolean;
  direction: BackgroundMotionDirection;
  speed: number;
  zoom: number;
};

export type BackgroundMotionValue = boolean | number | BackgroundMotionDirection;
