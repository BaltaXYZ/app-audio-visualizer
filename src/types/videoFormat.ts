export const videoFormats = [
  { id: "16-9", label: "16:9 Landscape", width: 16, height: 9 },
  { id: "9-16", label: "9:16 Portrait", width: 9, height: 16 },
  { id: "1-1", label: "1:1 Square", width: 1, height: 1 },
  { id: "4-5", label: "4:5 Portrait", width: 4, height: 5 },
] as const;

export type VideoFormatId = (typeof videoFormats)[number]["id"];

export const defaultVideoFormatId: VideoFormatId = "16-9";

export function getVideoFormat(id: VideoFormatId) {
  return (
    videoFormats.find((format) => format.id === id) ?? videoFormats[0]
  );
}

export function getVideoFormatRatio(id: VideoFormatId) {
  const format = getVideoFormat(id);
  return format.width / format.height;
}
