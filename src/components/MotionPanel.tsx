import type {
  BackgroundMotionSettings,
  BackgroundMotionValue,
} from "../types/backgroundMotion";
import { backgroundMotionDirections } from "../types/backgroundMotion";
import type { VideoFormatId } from "../types/videoFormat";
import { videoFormats } from "../types/videoFormat";
import type { ControlValue } from "../types/visualization";

type MotionPanelProps = {
  videoFormatId: VideoFormatId;
  backgroundMotion: BackgroundMotionSettings;
  onVideoFormatChange: (videoFormatId: VideoFormatId) => void;
  onBackgroundMotionChange: (
    settingId: keyof BackgroundMotionSettings,
    value: BackgroundMotionValue,
  ) => void;
  onResetBackgroundMotion: () => void;
};

export function MotionPanel({
  videoFormatId,
  backgroundMotion,
  onVideoFormatChange,
  onBackgroundMotionChange,
  onResetBackgroundMotion,
}: MotionPanelProps) {
  return (
    <section className="visualization-card" aria-label="Ken Burns motion">
      <div className="settings-header">
        <div>
          <p className="eyebrow">Motion</p>
          <h2>Ken Burns</h2>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={onResetBackgroundMotion}
          data-testid="reset-background-motion"
        >
          Reset motion
        </button>
      </div>

      <div className="settings-panel" aria-label="Image motion settings">
        <label className="control-field">
          <span className="control-label">Video format</span>
          <select
            value={videoFormatId}
            data-testid="video-format-select"
            onChange={(event) =>
              onVideoFormatChange(event.currentTarget.value as VideoFormatId)
            }
          >
            {videoFormats.map((format) => (
              <option key={format.id} value={format.id}>
                {format.label}
              </option>
            ))}
          </select>
        </label>

        <label className="control-field checkbox">
          <input
            type="checkbox"
            checked={backgroundMotion.enabled}
            data-testid="background-motion-enabled"
            onChange={(event) =>
              onBackgroundMotionChange("enabled", event.currentTarget.checked)
            }
          />
          <span className="control-label">Motion enabled</span>
        </label>

        <label className="control-field">
          <span className="control-label">Motion style</span>
          <select
            value={backgroundMotion.direction}
            data-testid="background-motion-direction"
            onChange={(event) =>
              onBackgroundMotionChange(
                "direction",
                event.currentTarget.value as BackgroundMotionSettings["direction"],
              )
            }
          >
            {backgroundMotionDirections.map((direction) => (
              <option key={direction} value={direction}>
                {formatDirection(direction)}
              </option>
            ))}
          </select>
        </label>

        <label className="control-field">
          <span className="control-row">
            <span className="control-label">Speed</span>
            <span className="control-value">
              {formatControlValue(backgroundMotion.speed)}
            </span>
          </span>
          <input
            type="range"
            min={0.2}
            max={1.6}
            step={0.05}
            value={backgroundMotion.speed}
            data-testid="background-motion-speed"
            onChange={(event) =>
              onBackgroundMotionChange(
                "speed",
                Number(event.currentTarget.value),
              )
            }
          />
        </label>

        <label className="control-field">
          <span className="control-row">
            <span className="control-label">Zoom room</span>
            <span className="control-value">{backgroundMotion.zoom}%</span>
          </span>
          <input
            type="range"
            min={4}
            max={28}
            step={1}
            value={backgroundMotion.zoom}
            data-testid="background-motion-zoom"
            onChange={(event) =>
              onBackgroundMotionChange(
                "zoom",
                Number(event.currentTarget.value),
              )
            }
          />
        </label>
      </div>
    </section>
  );
}

function formatControlValue(value: ControlValue) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  return String(value);
}

function formatDirection(direction: BackgroundMotionSettings["direction"]) {
  return direction
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
