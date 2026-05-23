export type LoadStatus = "idle" | "loading" | "ready" | "error";

export type LocalAsset = {
  file: File;
  objectUrl: string;
  name: string;
  type: string;
  size: number;
};

export type BackgroundImageAsset = LocalAsset & {
  width?: number;
  height?: number;
};

export type AudioTrackAsset = LocalAsset & {
  duration?: number;
};
