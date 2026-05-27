import type {
  AnyVisualizationDefinition,
  ControlValue,
  VisualizationSettings,
} from "../types/visualization";

type VisualizationPickerProps = {
  visualizations: readonly AnyVisualizationDefinition[];
  selectedId: string;
  settings: VisualizationSettings;
  onSelect: (id: string) => void;
  onSettingChange: (settingId: string, value: ControlValue) => void;
  onResetSettings: () => void;
  onResetPosition: () => void;
};

export function VisualizationPicker({
  visualizations,
  selectedId,
  settings,
  onSelect,
  onSettingChange,
  onResetSettings,
  onResetPosition,
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
                      {formatSelectOption(option)}
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

    </section>
  );
}

function formatControlValue(value: ControlValue) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  return String(value);
}

function formatSelectOption(option: string) {
  return option
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
