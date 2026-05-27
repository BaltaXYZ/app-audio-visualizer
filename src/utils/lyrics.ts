import type { LyricLine } from "../types/lyrics";

export type LyricsParseResult = {
  lines: LyricLine[];
  warning: string | null;
  error: string | null;
};

const timestampPattern = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

export function parseLyricsInput(input: string): LyricsParseResult {
  const rows = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length === 0) {
    return {
      lines: [],
      warning: null,
      error: "Add lyrics before importing.",
    };
  }

  const timedLines: Array<{ startTime: number; text: string }> = [];
  let ignoredRows = 0;

  for (const row of rows) {
    const timestamps = parseTimestamps(row);
    const text = row.replace(timestampPattern, "").trim();

    if (timestamps.length === 0) {
      ignoredRows += row.includes("[") || timedLines.length > 0 ? 1 : 0;
      continue;
    }

    if (!text) {
      ignoredRows += 1;
      continue;
    }

    for (const startTime of timestamps) {
      timedLines.push({ startTime, text });
    }
  }

  if (timedLines.length > 0) {
    const sortedLines = timedLines
      .sort((a, b) => a.startTime - b.startTime)
      .map((line, index) => ({
        id: createLyricLineId(index),
        startTime: line.startTime,
        endTime: null,
        text: line.text,
      }));

    return {
      lines: withComputedEndTimes(sortedLines),
      warning:
        ignoredRows > 0
          ? `${ignoredRows} lyric row${ignoredRows === 1 ? "" : "s"} could not be imported.`
          : null,
      error: null,
    };
  }

  const plainLines = rows.map((text, index) => ({
    id: createLyricLineId(index),
    startTime: null,
    endTime: null,
    text,
  }));

  return {
    lines: plainLines,
    warning: "Imported plain lyrics without timing. Use Set time & next while the song plays.",
    error: null,
  };
}

export function getActiveLyricIndex(lines: LyricLine[], currentTime: number) {
  let activeIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startTime === null || line.startTime > currentTime) {
      continue;
    }

    if (line.endTime !== null && currentTime >= line.endTime) {
      continue;
    }

    activeIndex = index;
  }

  return activeIndex;
}

export function getActiveLyricLine(lines: LyricLine[], currentTime: number) {
  const index = getActiveLyricIndex(lines, currentTime);
  return index >= 0 ? lines[index] : null;
}

export function setLyricLineStartTime(
  lines: LyricLine[],
  lineId: string,
  startTime: number,
) {
  return withComputedEndTimes(
    lines.map((line) =>
      line.id === lineId
        ? { ...line, startTime: clampTime(startTime), endTime: null }
        : line,
    ),
  );
}

export function getNextLyricLineId(lines: LyricLine[], lineId: string) {
  const index = lines.findIndex((line) => line.id === lineId);
  return index >= 0 ? lines[index + 1]?.id ?? lineId : null;
}

export function withComputedEndTimes(lines: LyricLine[]) {
  return lines.map((line, index) => {
    const nextTimedLine = lines
      .slice(index + 1)
      .find((candidate) => candidate.startTime !== null);

    return {
      ...line,
      endTime:
        line.startTime !== null && nextTimedLine?.startTime !== undefined
          ? nextTimedLine.startTime
          : null,
    };
  });
}

export function formatLyricTime(time: number | null) {
  if (time === null) {
    return "--:--.--";
  }

  const totalHundredths = Math.round(clampTime(time) * 100);
  const minutes = Math.floor(totalHundredths / 6000);
  const seconds = Math.floor((totalHundredths % 6000) / 100);
  const hundredths = totalHundredths % 100;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}.${String(hundredths).padStart(2, "0")}`;
}

export function formatLyricsAsLrc(lines: LyricLine[]) {
  return lines
    .map((line) =>
      line.startTime === null
        ? line.text
        : `[${formatLyricTime(line.startTime)}] ${line.text}`,
    )
    .join("\n");
}

export function formatLyricsAsPlainText(lines: LyricLine[]) {
  return lines.map((line) => line.text).join("\n");
}

function parseTimestamps(row: string) {
  const timestamps: number[] = [];
  timestampPattern.lastIndex = 0;

  for (const match of row.matchAll(timestampPattern)) {
    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const fraction = match[3] ?? "0";

    if (seconds >= 60) {
      continue;
    }

    timestamps.push(
      minutes * 60 + seconds + Number(`0.${fraction.padEnd(3, "0").slice(0, 3)}`),
    );
  }

  return timestamps;
}

function createLyricLineId(index: number) {
  return `lyric-${index + 1}`;
}

function clampTime(time: number) {
  return Math.max(0, Number.isFinite(time) ? time : 0);
}
