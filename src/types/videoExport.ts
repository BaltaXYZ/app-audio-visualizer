import {
  canEncodeAudio,
  canEncodeVideo,
  type AudioCodec,
  type VideoCodec,
} from "mediabunny";

export const videoExportFormats = [
  {
    id: "mp4",
    label: "MP4",
    extension: "mp4",
    mimeType: "video/mp4",
    videoCodec: "avc",
    audioCodec: "aac",
    fullVideoCodecString: "avc1.4d0034",
    fullAudioCodecString: "mp4a.40.2",
    videoBitrate: 8_000_000,
    audioBitrate: 192_000,
  },
  {
    id: "webm",
    label: "WebM",
    extension: "webm",
    mimeType: "video/webm",
    videoCodec: "vp9",
    audioCodec: "opus",
    fullVideoCodecString: "vp09.00.40.08.00",
    fullAudioCodecString: "opus",
    videoBitrate: 7_000_000,
    audioBitrate: 160_000,
  },
] as const satisfies readonly VideoExportFormat[];

export type VideoExportFormatId = (typeof videoExportFormats)[number]["id"];

export type VideoExportFormat = {
  id: string;
  label: string;
  extension: string;
  mimeType: string;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  fullVideoCodecString: string;
  fullAudioCodecString: string;
  videoBitrate: number;
  audioBitrate: number;
};

export type VideoExportProfile = {
  format: VideoExportFormat;
  mimeType: string;
};

export type VideoExportCodecSupport = {
  canEncodeVideo: typeof canEncodeVideo;
  canEncodeAudio: typeof canEncodeAudio;
};

export type VideoExportSupportOptions = {
  width: number;
  height: number;
  numberOfChannels?: number;
  sampleRate?: number;
  support?: VideoExportCodecSupport | null;
};

export const defaultVideoExportFormatId: VideoExportFormatId = "mp4";

export function getVideoExportFormat(id: VideoExportFormatId) {
  return (
    videoExportFormats.find((format) => format.id === id) ??
    videoExportFormats[0]
  );
}

export async function getSupportedVideoExportProfile(
  id: VideoExportFormatId,
  {
    width,
    height,
    numberOfChannels = 2,
    sampleRate = 48_000,
    support = getDefaultCodecSupport(),
  }: VideoExportSupportOptions,
): Promise<VideoExportProfile | null> {
  if (!support) {
    return null;
  }

  const format = getVideoExportFormat(id);
  const [videoSupported, audioSupported] = await Promise.all([
    support.canEncodeVideo(format.videoCodec, {
      width,
      height,
      bitrate: format.videoBitrate,
      fullCodecString: format.fullVideoCodecString,
    }),
    support.canEncodeAudio(format.audioCodec, {
      numberOfChannels,
      sampleRate,
      bitrate: format.audioBitrate,
      fullCodecString: format.fullAudioCodecString,
    }),
  ]);

  if (!videoSupported || !audioSupported) {
    return null;
  }

  return {
    format,
    mimeType: format.mimeType,
  };
}

export async function isVideoExportFormatSupported(
  id: VideoExportFormatId,
  options: VideoExportSupportOptions,
) {
  return Boolean(await getSupportedVideoExportProfile(id, options));
}

function getDefaultCodecSupport(): VideoExportCodecSupport | null {
  if (
    typeof VideoEncoder === "undefined" ||
    typeof AudioEncoder === "undefined"
  ) {
    return null;
  }

  return {
    canEncodeVideo,
    canEncodeAudio,
  };
}
