import type {
  AudioTrackAsset,
  BackgroundImageAsset,
  LoadStatus,
} from "../types/assets";
import { formatBytes, formatDuration } from "../utils/formatters";

type UploadPanelProps = {
  backgroundImage: BackgroundImageAsset | null;
  audioTrack: AudioTrackAsset | null;
  backgroundStatus: LoadStatus;
  audioStatus: LoadStatus;
  backgroundError: string | null;
  audioError: string | null;
  onBackgroundSelected: (file: File | null) => void;
  onAudioSelected: (file: File | null) => void;
  onClearBackground: () => void;
  onClearAudio: () => void;
};

export function UploadPanel({
  backgroundImage,
  audioTrack,
  backgroundStatus,
  audioStatus,
  backgroundError,
  audioError,
  onBackgroundSelected,
  onAudioSelected,
  onClearBackground,
  onClearAudio,
}: UploadPanelProps) {
  return (
    <section className="upload-panel" aria-label="Project files">
      <div className="brand-block">
        <p className="eyebrow">Audio Visualizer</p>
        <h1>Build a music visual</h1>
      </div>

      <FileDrop
        title="Background image"
        description="Choose the image for the preview."
        inputLabel="Choose image"
        accept="image/*"
        testId="background-input"
        onFileSelected={onBackgroundSelected}
      />

      {backgroundImage ? (
        <FileSummary
          name={backgroundImage.name}
          details={[
            formatBytes(backgroundImage.size),
            backgroundImage.width && backgroundImage.height
              ? `${backgroundImage.width} x ${backgroundImage.height}px`
              : backgroundStatus === "loading"
                ? "Reading image..."
                : "Image size unavailable",
          ]}
          onClear={onClearBackground}
          clearLabel="Remove image"
        />
      ) : null}

      {backgroundError ? (
        <p className="status-message error" role="alert">
          {backgroundError}
        </p>
      ) : null}

      <FileDrop
        title="Audio file"
        description="Choose the track to play."
        inputLabel="Choose audio"
        accept="audio/*"
        testId="audio-input"
        onFileSelected={onAudioSelected}
      />

      {audioTrack ? (
        <FileSummary
          name={audioTrack.name}
          details={[
            formatBytes(audioTrack.size),
            audioTrack.duration
              ? formatDuration(audioTrack.duration)
              : audioStatus === "loading"
                ? "Reading audio..."
                : "Duration unavailable",
          ]}
          onClear={onClearAudio}
          clearLabel="Remove audio"
        />
      ) : null}

      {audioError ? (
        <p className="status-message error" role="alert">
          {audioError}
        </p>
      ) : null}
    </section>
  );
}

type FileDropProps = {
  title: string;
  description: string;
  inputLabel: string;
  accept: string;
  testId: string;
  onFileSelected: (file: File | null) => void;
};

function FileDrop({
  title,
  description,
  inputLabel,
  accept,
  testId,
  onFileSelected,
}: FileDropProps) {
  return (
    <label className="file-drop">
      <span className="file-drop-title">{title}</span>
      <span className="file-drop-description">{description}</span>
      <span className="file-drop-action">{inputLabel}</span>
      <input
        data-testid={testId}
        type="file"
        accept={accept}
        onChange={(event) => {
          onFileSelected(event.currentTarget.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

type FileSummaryProps = {
  name: string;
  details: string[];
  clearLabel: string;
  onClear: () => void;
};

function FileSummary({ name, details, clearLabel, onClear }: FileSummaryProps) {
  return (
    <div className="file-summary">
      <div>
        <p className="file-name">{name}</p>
        <p className="file-details">{details.join(" · ")}</p>
      </div>
      <button type="button" className="text-button" onClick={onClear}>
        {clearLabel}
      </button>
    </div>
  );
}
