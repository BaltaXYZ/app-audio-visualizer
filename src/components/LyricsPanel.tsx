import { useEffect, useRef, useState } from "react";
import type {
  LyricLine,
  LyricsSettings,
  LyricsSettingValue,
} from "../types/lyrics";
import { lyricPositions, lyricStyles } from "../types/lyrics";
import { formatLyricTime } from "../utils/lyrics";

type LyricsPanelProps = {
  lines: LyricLine[];
  draftText: string;
  draftDirty: boolean;
  settings: LyricsSettings;
  activeLineId: string | null;
  currentTime: number;
  error: string | null;
  warning: string | null;
  onDraftChange: (text: string) => void;
  onApplyDraft: () => void;
  onLoadText: (text: string) => void;
  onClear: () => void;
  onSetLineTime: (lineId: string, startTime: number) => void;
  onSetLineTimeAndNext: (lineId: string, startTime: number) => void;
  onClearTiming: () => void;
  onSettingChange: (
    settingId: keyof LyricsSettings,
    value: LyricsSettingValue,
  ) => void;
  onResetSettings: () => void;
};

type LyricsSubtabId = "timing" | "visual";

const lyricsSubtabs: Array<{ id: LyricsSubtabId; label: string }> = [
  { id: "timing", label: "Timing" },
  { id: "visual", label: "Visual" },
];

export function LyricsPanel({
  lines,
  draftText,
  draftDirty,
  settings,
  activeLineId,
  currentTime,
  error,
  warning,
  onDraftChange,
  onApplyDraft,
  onLoadText,
  onClear,
  onSetLineTime,
  onSetLineTimeAndNext,
  onClearTiming,
  onSettingChange,
  onResetSettings,
}: LyricsPanelProps) {
  const [activeSubtab, setActiveSubtab] =
    useState<LyricsSubtabId>("timing");
  const lyricsInputRef = useRef<HTMLTextAreaElement | null>(null);
  const activeLine = lines.find((line) => line.id === activeLineId) ?? null;
  const activeLineIndex = activeLine
    ? lines.findIndex((line) => line.id === activeLine.id)
    : -1;
  const canTimeActiveLine = Boolean(activeLine) && !draftDirty;
  const hasTimedLines = lines.some((line) => line.startTime !== null);

  useEffect(() => {
    if (draftDirty || activeLineIndex < 0) {
      return;
    }

    const textarea = lyricsInputRef.current;

    if (!textarea) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const style = window.getComputedStyle(textarea);
      const parsedLineHeight = Number.parseFloat(style.lineHeight);
      const parsedFontSize = Number.parseFloat(style.fontSize);
      const lineHeight = Number.isFinite(parsedLineHeight)
        ? parsedLineHeight
        : Number.isFinite(parsedFontSize)
          ? parsedFontSize * 1.45
          : 20;
      const firstVisibleLine =
        activeLineIndex <= 5 ? 0 : activeLineIndex - 5;

      textarea.scrollTop = Math.max(0, firstVisibleLine * lineHeight);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeLineIndex, activeSubtab, draftDirty, draftText]);

  const handleFileSelected = (file: File | null) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      onLoadText(text);
    };
    reader.readAsText(file);
  };

  return (
    <section className="lyrics-card" aria-label="Lyrics">
      <div className="settings-header">
        <div>
          <p className="eyebrow">Lyrics</p>
          <h2>Timed lyrics</h2>
        </div>
      </div>

      <div className="lyrics-subtabs" role="tablist" aria-label="Lyrics tabs">
        {lyricsSubtabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`lyrics-subtab-${tab.id}`}
            aria-selected={activeSubtab === tab.id}
            aria-controls={`lyrics-subtab-panel-${tab.id}`}
            className={activeSubtab === tab.id ? "is-active" : undefined}
            data-testid={`lyrics-subtab-${tab.id}`}
            onClick={() => setActiveSubtab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubtab === "timing" ? (
        <div
          id="lyrics-subtab-panel-timing"
          className="lyrics-subtab-panel is-timing"
          role="tabpanel"
          aria-labelledby="lyrics-subtab-timing"
        >
          <label className="control-field lyrics-editor-field">
            <span className="control-label">LRC or plain lyrics</span>
            <textarea
              ref={lyricsInputRef}
              value={draftText}
              rows={18}
              wrap="off"
              spellCheck={false}
              placeholder="[00:12.30] First lyric line"
              data-testid="lyrics-input"
              onChange={(event) => onDraftChange(event.currentTarget.value)}
            />
          </label>

          <div className="settings-actions">
            <button
              type="button"
              className="primary-button"
              disabled={!draftText.trim() || !draftDirty}
              onClick={onApplyDraft}
              data-testid="apply-lyrics"
            >
              Apply lyrics
            </button>
            <label className="secondary-button file-button">
              Load .lrc
              <input
                type="file"
                accept=".lrc,text/plain"
                data-testid="lyrics-file-input"
                onChange={(event) => {
                  handleFileSelected(event.currentTarget.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <button
              type="button"
              className="secondary-button"
              disabled={lines.length === 0 && !draftText.trim()}
              onClick={onClear}
              data-testid="clear-lyrics"
            >
              Clear lyrics
            </button>
          </div>
          <p
            className={`lyrics-draft-status ${draftDirty ? "is-dirty" : ""}`}
            data-testid="lyrics-draft-status"
          >
            {draftDirty
              ? "Unapplied changes. Click Apply lyrics to update preview and export."
              : lines.length > 0
                ? "Lyrics applied."
                : "Paste lyrics, then apply them for preview and export."}
          </p>

          <div className="lyrics-timing">
            <p className="settings-title">Timing</p>
            <p className="lyrics-time">
              Current time {formatLyricTime(currentTime)}
            </p>
            <div className="settings-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={!canTimeActiveLine}
                onClick={() => {
                  if (!activeLine) {
                    return;
                  }

                  onSetLineTime(activeLine.id, currentTime);
                }}
                data-testid="set-lyric-time"
              >
                Set time
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!canTimeActiveLine}
                onClick={() => {
                  if (!activeLine) {
                    return;
                  }

                  onSetLineTimeAndNext(activeLine.id, currentTime);
                }}
                data-testid="set-lyric-time-next"
              >
                Set time & next
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!hasTimedLines || draftDirty}
                onClick={() => {
                  onClearTiming();
                }}
                data-testid="clear-lyric-timing"
              >
                Clear timing
              </button>
            </div>
            {activeLine ? (
              <p className="lyrics-current-line">
                {draftDirty
                  ? "Apply lyrics before continuing timing."
                  : `Timing line ${activeLineIndex + 1} of ${lines.length}: ${
                      activeLine.text
                    }`}
              </p>
            ) : (
              <p className="lyrics-current-line">
                Apply lyrics to start timing from the first line.
              </p>
            )}
          </div>

          {warning ? (
            <p className="status-message info" role="status">
              {warning}
            </p>
          ) : null}

          {error ? (
            <p className="status-message error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      {activeSubtab === "visual" ? (
        <div
          id="lyrics-subtab-panel-visual"
          className="lyrics-subtab-panel is-visual"
          role="tabpanel"
          aria-labelledby="lyrics-subtab-visual"
        >
          <div className="settings-panel" aria-label="Lyric style settings">
            <div className="lyrics-settings-header">
              <p className="settings-title">Text style</p>
              <button
                type="button"
                className="secondary-button"
                onClick={onResetSettings}
                data-testid="reset-lyrics-settings"
              >
                Reset style
              </button>
            </div>

            <label className="control-field checkbox">
              <input
                type="checkbox"
                checked={settings.enabled}
                data-testid="lyrics-enabled"
                onChange={(event) =>
                  onSettingChange("enabled", event.currentTarget.checked)
                }
              />
              <span className="control-label">Show lyrics</span>
            </label>

            <label className="control-field">
              <span className="control-label">Style</span>
              <select
                value={settings.style}
                data-testid="lyrics-style-select"
                onChange={(event) =>
                  onSettingChange("style", event.currentTarget.value)
                }
              >
                {lyricStyles.map((style) => (
                  <option key={style} value={style}>
                    {formatStyle(style)}
                  </option>
                ))}
              </select>
            </label>

            <label className="control-field">
              <span className="control-label">Position</span>
              <select
                value={settings.position}
                data-testid="lyrics-position-select"
                onChange={(event) =>
                  onSettingChange("position", event.currentTarget.value)
                }
              >
                {lyricPositions.map((position) => (
                  <option key={position} value={position}>
                    {formatStyle(position)}
                  </option>
                ))}
              </select>
            </label>

            <label className="control-field">
              <span className="control-row">
                <span className="control-label">Size</span>
                <span className="control-value">{settings.fontSize}px</span>
              </span>
              <input
                type="range"
                min={20}
                max={76}
                step={1}
                value={settings.fontSize}
                data-testid="lyrics-font-size"
                onChange={(event) =>
                  onSettingChange(
                    "fontSize",
                    Number(event.currentTarget.value),
                  )
                }
              />
            </label>

            <label className="control-field inline">
              <span className="control-label">Color</span>
              <input
                type="color"
                value={settings.color}
                data-testid="lyrics-color"
                onChange={(event) =>
                  onSettingChange("color", event.currentTarget.value)
                }
              />
            </label>

            <label className="control-field checkbox">
              <input
                type="checkbox"
                checked={settings.background}
                data-testid="lyrics-background"
                onChange={(event) =>
                  onSettingChange("background", event.currentTarget.checked)
                }
              />
              <span className="control-label">Background</span>
            </label>

            <label className="control-field checkbox">
              <input
                type="checkbox"
                checked={settings.shadow}
                data-testid="lyrics-shadow"
                onChange={(event) =>
                  onSettingChange("shadow", event.currentTarget.checked)
                }
              />
              <span className="control-label">Shadow</span>
            </label>

            <label className="control-field checkbox">
              <input
                type="checkbox"
                checked={settings.showNextLine}
                data-testid="lyrics-show-next"
                onChange={(event) =>
                  onSettingChange("showNextLine", event.currentTarget.checked)
                }
              />
              <span className="control-label">Show next line</span>
            </label>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatStyle(value: string) {
  return value
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
