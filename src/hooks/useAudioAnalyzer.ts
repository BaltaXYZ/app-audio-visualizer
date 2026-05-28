import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserAudioAnalyzer } from "../audio/audioAnalyzer";
import type { AudioAnalyzerStatus } from "../types/audio";
import { createSilentAudioFrame } from "../types/audio";

export function useAudioAnalyzer(audioElement: HTMLAudioElement | null) {
  const analyzerRef = useRef<BrowserAudioAnalyzer | null>(null);
  const [status, setStatus] = useState<AudioAnalyzerStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!audioElement) {
      analyzerRef.current?.destroy();
      analyzerRef.current = null;
      setStatus("idle");
      setError(null);
      return;
    }

    const analyzer = new BrowserAudioAnalyzer(audioElement);
    analyzerRef.current = analyzer;
    setStatus("waiting");
    setError(null);

    const startAnalyzer = async () => {
      try {
        await analyzer.start();
        setStatus(analyzer.getStatus());
        setError(null);
      } catch {
        setStatus("error");
        setError("Audio analysis could not start in this browser.");
      }
    };

    const pause = () => {
      if (analyzerRef.current === analyzer) {
        setStatus("waiting");
      }
    };

    audioElement.addEventListener("play", startAnalyzer);
    audioElement.addEventListener("pause", pause);
    audioElement.addEventListener("ended", pause);

    return () => {
      audioElement.removeEventListener("play", startAnalyzer);
      audioElement.removeEventListener("pause", pause);
      audioElement.removeEventListener("ended", pause);
      analyzer.destroy();
      if (analyzerRef.current === analyzer) {
        analyzerRef.current = null;
      }
    };
  }, [audioElement]);

  const getAudioFrame = useCallback((time: number) => {
    return analyzerRef.current?.getFrame(time) ?? createSilentAudioFrame(time);
  }, []);

  const start = useCallback(async () => {
    if (!analyzerRef.current) {
      return;
    }

    await analyzerRef.current.start();
    setStatus(analyzerRef.current.getStatus());
    setError(null);
  }, []);

  const setMonitorMuted = useCallback((muted: boolean) => {
    analyzerRef.current?.setMonitorMuted(muted);
  }, []);

  const getRecordingStream = useCallback(() => {
    return analyzerRef.current?.getRecordingStream() ?? null;
  }, []);

  return {
    status,
    error,
    getAudioFrame,
    start,
    setMonitorMuted,
    getRecordingStream,
  };
}
