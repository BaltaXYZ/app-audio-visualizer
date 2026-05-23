export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizedFrequencyValue(
  data: Uint8Array,
  index: number,
  count: number,
  span = 0.82,
) {
  if (!data.length || count <= 1) {
    return 0;
  }

  const boundedIndex = clamp(index, 0, count - 1);
  const dataIndex = Math.floor((boundedIndex / (count - 1)) * data.length * span);
  return (data[Math.min(data.length - 1, dataIndex)] ?? 0) / 255;
}

export function stageScale(width: number, height: number) {
  return Math.min(width, height) / 720;
}

export function alphaColor(color: string, alpha: number) {
  const match = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);

  if (!match) {
    return color;
  }

  const hex = match[1];
  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((character) => character + character)
          .join("")
      : hex;
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${clamp(alpha, 0, 1)})`;
}
