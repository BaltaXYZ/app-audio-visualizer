const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const audioExtensions = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"];

function hasExtension(file: File, extensions: string[]) {
  const lowerName = file.name.toLowerCase();
  return extensions.some((extension) => lowerName.endsWith(extension));
}

export function isAcceptedImageFile(file: File) {
  return file.type.startsWith("image/") || hasExtension(file, imageExtensions);
}

export function isAcceptedAudioFile(file: File) {
  return file.type.startsWith("audio/") || hasExtension(file, audioExtensions);
}
