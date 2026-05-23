import type {
  BackgroundMotionSettings,
  BackgroundMotionValue,
} from "../types/backgroundMotion";
import { backgroundMotionDirections } from "../types/backgroundMotion";
import type {
  AnyVisualizationDefinition,
  ControlValue,
  VisualizationSettings,
} from "../types/visualization";
import type { VideoFormatId } from "../types/videoFormat";
import { videoFormats } from "../types/videoFormat";

type VisualizationPickerProps = {
  visualizations: readonly AnyVisualizationDefinition[];
  selectedId: string;
  settings: VisualizationSettings;
  videoFormatId: VideoFormatId;
  backgroundMotion: BackgroundMotionSettings;
  onSelect: (id: string) => void;
  onVideoFormatChange: (videoFormatId: VideoFormatId) => void;
  onSettingChange: (settingId: string, value: ControlValue) => void;
  onResetSettings: () => void;
  onResetPosition: () => void;
  onBackgroundMotionChange: (
    settingId: keyof BackgroundMotionSettings,
    value: BackgroundMotionValue,
  ) => void;
  onResetBackgroundMotion: () => void;
};

export function VisualizationPicker({
  visualizations,
  selectedId,
  settings,
  videoFormatId,
  backgroundMotion,
  onSelect,
  onVideoFormatChange,
  onSettingChange,
  onResetSettings,
  onResetPosition,
  onBackgroundMotionChange,
  onResetBackgroundMotion,
}: VisualizationPickerProps) {
  const selectedVisualization =
    visualizations.find((visualization) => visualization.id === selectedId) ??
    visualizations[0];

  return (
    <section className="visualization-card" aria-label="Visualizations">
      <div>
        <p className="eyebrow">Visual</p>
        <h2>Reactive style</h2>
      </div>

      <label className="control-field">
        <span className="control-label">Style</span>
        <select
          value={selectedId}
          onChange={(event) => onSelect(event.currentTarget.value)}
          data-testid="visualization-select"
        >
          {visualizations.map((visualization) => (
            <option key={visualization.id} value={visualization.id}>
              {visualization.name}
            </option>
          ))}
        </select>
      </label>

      <p className="visualization-description">
        {selectedVisualization.description}
      </p>

      <div className="settings-actions" aria-label="Effect actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onResetSettings}
          data-testid="reset-settings"
        >
          Reset settings
        </button>
        {selectedVisualization.supportsPositioning ? (
          <button
            type="button"
            className="secondary-button"
            onClick={onResetPosition}
            data-testid="center-position"
          >
            Center position
          </button>
        ) : null}
      </div>

      <div className="settings-panel" aria-label="Effect settings">
        <p className="settings-title">Effect settings</p>
        {selectedVisualization.controls.map((control) => {
          const value =
            settings[control.id] ??
            selectedVisualization.defaultSettings[control.id];

          if (control.type === "color") {
            return (
              <label className="control-field inline" key={control.id}>
                <span className="control-label">{control.label}</span>
                <input
                  type="color"
                  value={String(value)}
                  data-testid={`control-${control.id}`}
                  onChange={(event) =>
                    onSettingChange(control.id, event.currentTarget.value)
                  }
                />
              </label>
            );
          }

          if (control.type === "toggle") {
            return (
              <label className="control-field checkbox" key={control.id}>
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  data-testid={`control-${control.id}`}
                  onChange={(event) =>
                    onSettingChange(control.id, event.currentTarget.checked)
                  }
                />
                <span className="control-label">{control.label}</span>
              </label>
            );
          }

          if (control.type === "select") {
            return (
              <label className="control-field" key={control.id}>
                <span className="control-label">{control.label}</span>
                <select
                  value={String(value)}
                  data-testid={`control-${control.id}`}
                  onChange={(event) =>
                    onSettingChange(control.id, event.currentTarget.value)
                  }
                >
                  {control.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            );
          }

          return (
            <label className="control-field" key={control.id}>
              <span className="control-row">
                <span className="control-label">{control.label}</span>
                <span className="control-value">
                  {formatControlValue(value)}
                </span>
              </span>
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={control.step ?? 1}
                value={Number(value)}
                data-testid={`control-${control.id}`}
                onChange={(event) =>
                  onSettingChange(control.id, Number(event.currentTarget.value))
                }
              />
            </label>
          );
        })}
      </div>

      <div className="settings-panel" aria-label="Image motion settings">
        <div className="settings-header">
          <p className="settings-title">Image motion</p>
          <button
            type="button"
            className="secondary-button"
            onClick={onResetBackgroundMotion}
            data-testid="reset-background-motion"
          >
            Reset motion
          </button>
        </div>

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
          <span className="control-label">Direction</span>
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
