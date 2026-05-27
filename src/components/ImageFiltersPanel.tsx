import type {
  ImageEffectPresetId,
  ImageEffectSettings,
  ImageEffectSettingValue,
} from "../types/imageEffects";
import { imageEffectPresetOptions } from "../types/imageEffects";

type ImageFiltersPanelProps = {
  hasBackgroundImage: boolean;
  imageEffects: ImageEffectSettings;
  onPresetSelect: (presetId: ImageEffectPresetId) => void;
  onSettingChange: (
    settingId: keyof ImageEffectSettings,
    value: ImageEffectSettingValue,
  ) => void;
  onResetFilters: () => void;
};

export function ImageFiltersPanel({
  hasBackgroundImage,
  imageEffects,
  onPresetSelect,
  onSettingChange,
  onResetFilters,
}: ImageFiltersPanelProps) {
  return (
    <section className="visualization-card" aria-label="Image filters">
      <div className="settings-header">
        <div>
          <p className="eyebrow">Filters</p>
          <h2>Image filters</h2>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={onResetFilters}
          data-testid="reset-image-filters"
        >
          Reset filters
        </button>
      </div>

      {!hasBackgroundImage ? (
        <p className="status-message info" role="status">
          Choose a background image to see filters in the preview.
        </p>
      ) : null}

      <div className="settings-panel" aria-label="Image filter settings">
        <label className="control-field checkbox">
          <input
            type="checkbox"
            checked={imageEffects.enabled}
            data-testid="image-filters-enabled"
            onChange={(event) =>
              onSettingChange("enabled", event.currentTarget.checked)
            }
          />
          <span className="control-label">Filters enabled</span>
        </label>

        <label className="control-field">
          <span className="control-label">Preset</span>
          <select
            value={imageEffects.presetId}
            data-testid="image-filter-preset"
            onChange={(event) =>
              onPresetSelect(event.currentTarget.value as ImageEffectPresetId)
            }
          >
            {imageEffectPresetOptions.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <RangeControl
          id="amount"
          label="Amount"
          value={imageEffects.amount}
          onChange={onSettingChange}
        />
        <RangeControl
          id="bassPunch"
          label="Bass punch"
          value={imageEffects.bassPunch}
          onChange={onSettingChange}
        />
        <RangeControl
          id="colorMovement"
          label="Color movement"
          value={imageEffects.colorMovement}
          onChange={onSettingChange}
        />
        <RangeControl
          id="glow"
          label="Glow"
          value={imageEffects.glow}
          onChange={onSettingChange}
        />
        <RangeControl
          id="vignette"
          label="Vignette"
          value={imageEffects.vignette}
          onChange={onSettingChange}
        />
        <RangeControl
          id="grain"
          label="Grain"
          value={imageEffects.grain}
          onChange={onSettingChange}
        />
      </div>
    </section>
  );
}

type RangeControlProps = {
  id: keyof Pick<
    ImageEffectSettings,
    "amount" | "bassPunch" | "colorMovement" | "glow" | "vignette" | "grain"
  >;
  label: string;
  value: number;
  onChange: (
    settingId: keyof ImageEffectSettings,
    value: ImageEffectSettingValue,
  ) => void;
};

function RangeControl({ id, label, value, onChange }: RangeControlProps) {
  return (
    <label className="control-field">
      <span className="control-row">
        <span className="control-label">{label}</span>
        <span className="control-value">{value}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        data-testid={`image-filter-${id}`}
        onChange={(event) => onChange(id, Number(event.currentTarget.value))}
      />
    </label>
  );
}
