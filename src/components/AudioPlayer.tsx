import type { AudioAnalyzerStatus } from "../types/audio";
import type { AudioTrackAsset, LoadStatus } from "../types/assets";
import { formatBytes, formatDuration } from "../utils/formatters";

type AudioPlayerProps = {
  audioTrack: AudioTrackAsset | null;
  status: LoadStatus;
  error: string | null;
  analyzerStatus: AudioAnalyzerStatus;
  analyzerError: string | null;
  onAudioElementChange: (element: HTMLAudioElement | null) => void;
  onMetadata: (duration: number) => void;
  onPlaybackError: () => void;
};

export function AudioPlayer({
  audioTrack,
  status,
  error,
  analyzerStatus,
  analyzerError,
  onAudioElementChange,
  onMetadata,
  onPlaybackError,
}: AudioPlayerProps) {
  return (
    <section className="audio-card" aria-label="Audio player">
      <div>
        <p className="eyebrow">Audio</p>
        <h2>{audioTrack ? audioTrack.name : "No audio selected"}</h2>
      </div>

      {audioTrack ? (
        <>
          <audio
            key={audioTrack.objectUrl}
            ref={onAudioElementChange}
            controls
            preload="metadata"
            src={audioTrack.objectUrl}
            onLoadedMetadata={(event) =>
              onMetadata(event.currentTarget.duration)
            }
            onError={onPlaybackError}
            data-testid="audio-player"
          />
          <p className="audio-meta">
            {formatBytes(audioTrack.size)} ·{" "}
            {audioTrack.duration
              ? formatDuration(audioTrack.duration)
              : status === "loading"
                ? "Reading metadata"
                : "Duration unavailable"}
          </p>
          <p className="analysis-status">
            Sound reaction: {formatAnalyzerStatus(analyzerStatus)}
          </p>
        </>
      ) : (
        <p className="audio-empty">
          Choose an audio file to play the track here.
        </p>
      )}

      {analyzerError ? (
        <p className="status-message error" role="alert">
          {analyzerError}
        </p>
      ) : null}

      {error ? (
        <p className="status-message error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function formatAnalyzerStatus(status: AudioAnalyzerStatus) {
  switch (status) {
    case "active":
      return "listening";
    case "waiting":
      return "waiting for playback";
    case "error":
      return "unavailable";
    default:
      return "idle";
  }
}
