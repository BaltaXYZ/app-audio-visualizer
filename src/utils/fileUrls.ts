import type { LocalAsset } from "../types/assets";

export function createLocalAsset(file: File): LocalAsset {
  return {
    file,
    objectUrl: URL.createObjectURL(file),
    name: file.name,
    type: file.type,
    size: file.size,
  };
}
