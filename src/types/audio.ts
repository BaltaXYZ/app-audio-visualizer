export type AudioAnalyzerStatus = "idle" | "waiting" | "active" | "error";

export type AudioFrame = {
  time: number;
  volume: number;
  slowEnergy: number;
  energyDelta: number;
  bass: number;
  mids: number;
  treble: number;
  transient: boolean;
  transientStrength: number;
  beatPulse: boolean;
  beatConfidence: number;
  waveform: Float32Array;
  frequencyData: Uint8Array;
  frequencyBands: {
    bass: number;
    lowMid: number;
    mid: number;
    highMid: number;
    treble: number;
  };
};

const silentWaveform = new Float32Array(1024);
const silentFrequencyData = new Uint8Array(1024);

export function createSilentAudioFrame(time = 0): AudioFrame {
  return {
    time,
    volume: 0,
    slowEnergy: 0,
    energyDelta: 0,
    bass: 0,
    mids: 0,
    treble: 0,
    transient: false,
    transientStrength: 0,
    beatPulse: false,
    beatConfidence: 0,
    waveform: silentWaveform,
    frequencyData: silentFrequencyData,
    frequencyBands: {
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      treble: 0,
    },
  };
}
