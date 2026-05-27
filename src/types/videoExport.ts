export const videoExportFormats = [
  {
    id: "mp4",
    label: "MP4",
    extension: "mp4",
    mimeTypes: [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4;codecs=h264,aac",
      "video/mp4",
    ],
  },
  {
    id: "webm",
    label: "WebM",
    extension: "webm",
    mimeTypes: [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ],
  },
] as const;

export type VideoExportFormatId = (typeof videoExportFormats)[number]["id"];

export const defaultVideoExportFormatId: VideoExportFormatId = "mp4";

export type MediaRecorderSupport = {
  isTypeSupported: (mimeType: string) => boolean;
};

export function getVideoExportFormat(id: VideoExportFormatId) {
  return (
    videoExportFormats.find((format) => format.id === id) ??
    videoExportFormats[0]
  );
}

export function getSupportedExportMimeType(
  id: VideoExportFormatId,
  support: MediaRecorderSupport | null = getMediaRecorderSupport(),
) {
  if (!support) {
    return null;
  }

  return (
    getVideoExportFormat(id).mimeTypes.find((mimeType) =>
      support.isTypeSupported(mimeType),
    ) ?? null
  );
}

export function isVideoExportFormatSupported(
  id: VideoExportFormatId,
  support: MediaRecorderSupport | null = getMediaRecorderSupport(),
) {
  return Boolean(getSupportedExportMimeType(id, support));
}

function getMediaRecorderSupport(): MediaRecorderSupport | null {
  return typeof MediaRecorder === "undefined" ? null : MediaRecorder;
}
