import type { AudioAnalyzerStatus, AudioFrame } from "../types/audio";
import { createSilentAudioFrame } from "../types/audio";

type WebAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const fftSize = 2048;

export class BrowserAudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private monitorGain: GainNode | null = null;
  private recordingDestination: MediaStreamAudioDestinationNode | null = null;
  private frequencyData = new Uint8Array(fftSize / 2);
  private waveform = new Float32Array(fftSize);
  private fastEnergy = 0;
  private slowEnergy = 0;
  private lastBeatTime = 0;
  private status: AudioAnalyzerStatus = "waiting";

  constructor(private readonly mediaElement: HTMLAudioElement) {}

  getStatus() {
    return this.status;
  }

  async start() {
    this.ensureGraph();

    if (!this.audioContext) {
      return;
    }

    await this.audioContext.resume();
    this.status = "active";
  }

  setMonitorMuted(muted: boolean) {
    this.ensureGraph();

    if (!this.audioContext || !this.monitorGain) {
      return;
    }

    this.monitorGain.gain.setValueAtTime(
      muted ? 0 : 1,
      this.audioContext.currentTime,
    );
  }

  getRecordingStream() {
    this.ensureGraph();
    return this.recordingDestination?.stream ?? null;
  }

  getFrame(time: number): AudioFrame {
    if (
      !this.analyser ||
      this.mediaElement.paused ||
      this.mediaElement.ended ||
      this.mediaElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      return createSilentAudioFrame(time);
    }

    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getFloatTimeDomainData(this.waveform);

    const bass = this.bandAverage(20, 250);
    const lowMid = this.bandAverage(250, 500);
    const mid = this.bandAverage(500, 2000);
    const highMid = this.bandAverage(2000, 6000);
    const treble = this.bandAverage(6000, 12000);
    const mids = (lowMid + mid + highMid) / 3;
    const volume = Math.min(1, bass * 0.32 + mids * 0.44 + treble * 0.24);

    this.fastEnergy = smooth(this.fastEnergy, volume, 0.34);
    this.slowEnergy = smooth(this.slowEnergy, volume, 0.045);

    const energyDelta = Math.max(0, this.fastEnergy - this.slowEnergy);
    const transientStrength = Math.min(1, energyDelta * 5.5);
    const transient = transientStrength > 0.32 && volume > 0.12;
    const beatPulse = transient && time - this.lastBeatTime > 180;

    if (beatPulse) {
      this.lastBeatTime = time;
    }

    return {
      time,
      volume,
      slowEnergy: this.slowEnergy,
      energyDelta,
      bass,
      mids,
      treble,
      transient,
      transientStrength,
      beatPulse,
      beatConfidence: beatPulse ? transientStrength : 0,
      waveform: this.waveform,
      frequencyData: this.frequencyData,
      frequencyBands: {
        bass,
        lowMid,
        mid,
        highMid,
        treble,
      },
    };
  }

  destroy() {
    this.status = "idle";
    this.source?.disconnect();
    this.analyser?.disconnect();
    this.monitorGain?.disconnect();
    this.recordingDestination?.disconnect();
    void this.audioContext?.close();
    this.source = null;
    this.analyser = null;
    this.monitorGain = null;
    this.recordingDestination = null;
    this.audioContext = null;
  }

  private ensureGraph() {
    if (
      this.audioContext &&
      this.analyser &&
      this.source &&
      this.monitorGain &&
      this.recordingDestination
    ) {
      return;
    }

    const AudioContextConstructor =
      window.AudioContext || (window as WebAudioWindow).webkitAudioContext;

    if (!AudioContextConstructor) {
      this.status = "error";
      throw new Error("Web Audio API is not available in this browser.");
    }

    this.audioContext = new AudioContextConstructor();
    this.analyser = this.audioContext.createAnalyser();
    this.monitorGain = this.audioContext.createGain();
    this.recordingDestination =
      this.audioContext.createMediaStreamDestination();
    this.analyser.fftSize = fftSize;
    this.analyser.smoothingTimeConstant = 0.74;
    this.monitorGain.gain.value = 1;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.waveform = new Float32Array(this.analyser.fftSize);
    this.source = this.audioContext.createMediaElementSource(this.mediaElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.monitorGain);
    this.monitorGain.connect(this.audioContext.destination);
    this.analyser.connect(this.recordingDestination);
  }

  private bandAverage(minFrequency: number, maxFrequency: number) {
    if (!this.audioContext || !this.analyser) {
      return 0;
    }

    const nyquist = this.audioContext.sampleRate / 2;
    const start = Math.max(
      0,
      Math.floor((minFrequency / nyquist) * this.frequencyData.length),
    );
    const end = Math.min(
      this.frequencyData.length - 1,
      Math.ceil((maxFrequency / nyquist) * this.frequencyData.length),
    );

    if (end <= start) {
      return 0;
    }

    let total = 0;
    for (let index = start; index <= end; index += 1) {
      total += this.frequencyData[index];
    }

    return total / ((end - start + 1) * 255);
  }
}

function smooth(previous: number, next: number, amount: number) {
  return previous + (next - previous) * amount;
}
