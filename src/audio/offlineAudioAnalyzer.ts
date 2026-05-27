import type { AudioFrame } from "../types/audio";

export type AudioBufferLike = {
  duration: number;
  length: number;
  numberOfChannels: number;
  sampleRate: number;
  getChannelData: (channel: number) => Float32Array;
};

export type OfflineAudioTimeline = {
  durationSeconds: number;
  frameRate: number;
  frames: AudioFrame[];
};

export type BuildOfflineAudioTimelineOptions = {
  frameRate?: number;
  signal?: AbortSignal;
};

const fftSize = 2048;
const halfFftSize = fftSize / 2;
const defaultFrameRate = 30;
const hannWindow = createHannWindow(fftSize);
const bitReversal = createBitReversal(fftSize);

export function buildOfflineAudioTimeline(
  audioBuffer: AudioBufferLike,
  { frameRate = defaultFrameRate, signal }: BuildOfflineAudioTimelineOptions = {},
): OfflineAudioTimeline {
  if (!Number.isFinite(frameRate) || frameRate <= 0) {
    throw new Error("Offline audio timeline frame rate must be positive.");
  }

  const durationSeconds = Math.max(0, audioBuffer.duration);
  const frameCount = Math.max(1, Math.ceil(durationSeconds * frameRate));
  const channelData = readChannelData(audioBuffer);
  const real = new Float32Array(fftSize);
  const imag = new Float32Array(fftSize);
  const frames: AudioFrame[] = [];
  let fastEnergy = 0;
  let slowEnergy = 0;
  let lastBeatTime = -Infinity;

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    throwIfAborted(signal);

    const timeSeconds = frameIndex / frameRate;
    const timeMs = timeSeconds * 1000;
    const centerSample = Math.round(timeSeconds * audioBuffer.sampleRate);
    const waveform = new Float32Array(fftSize);
    let squareTotal = 0;

    for (let index = 0; index < fftSize; index += 1) {
      const sampleIndex = centerSample - halfFftSize + index;
      const sample = readMonoSample(channelData, sampleIndex);
      waveform[index] = sample;
      squareTotal += sample * sample;
      real[index] = sample * hannWindow[index];
      imag[index] = 0;
    }

    fft(real, imag);

    const frequencyData = new Uint8Array(halfFftSize);
    for (let index = 0; index < halfFftSize; index += 1) {
      const magnitude = Math.hypot(real[index], imag[index]);
      const normalized = clamp(magnitude / (fftSize * 0.25), 0, 1);
      frequencyData[index] = Math.round(normalized * 255);
    }

    const bass = bandAverage(frequencyData, audioBuffer.sampleRate, 20, 250);
    const lowMid = bandAverage(frequencyData, audioBuffer.sampleRate, 250, 500);
    const mid = bandAverage(frequencyData, audioBuffer.sampleRate, 500, 2000);
    const highMid = bandAverage(frequencyData, audioBuffer.sampleRate, 2000, 6000);
    const treble = bandAverage(frequencyData, audioBuffer.sampleRate, 6000, 12000);
    const mids = (lowMid + mid + highMid) / 3;
    const rms = Math.sqrt(squareTotal / fftSize);
    const volume = Math.min(
      1,
      bass * 0.3 + mids * 0.36 + treble * 0.18 + rms * 0.42,
    );

    fastEnergy = smooth(fastEnergy, volume, 0.34);
    slowEnergy = smooth(slowEnergy, volume, 0.045);

    const energyDelta = Math.max(0, fastEnergy - slowEnergy);
    const transientStrength = Math.min(1, energyDelta * 5.5);
    const transient = transientStrength > 0.32 && volume > 0.12;
    const beatPulse = transient && timeMs - lastBeatTime > 180;

    if (beatPulse) {
      lastBeatTime = timeMs;
    }

    frames.push({
      time: timeMs,
      volume,
      slowEnergy,
      energyDelta,
      bass,
      mids,
      treble,
      transient,
      transientStrength,
      beatPulse,
      beatConfidence: beatPulse ? transientStrength : 0,
      waveform,
      frequencyData,
      frequencyBands: {
        bass,
        lowMid,
        mid,
        highMid,
        treble,
      },
    });
  }

  return {
    durationSeconds,
    frameRate,
    frames,
  };
}

export function getOfflineAudioFrameAtTime(
  timeline: OfflineAudioTimeline,
  timeSeconds: number,
) {
  const index = clamp(
    Math.floor(timeSeconds * timeline.frameRate),
    0,
    timeline.frames.length - 1,
  );

  return timeline.frames[index];
}

function readChannelData(audioBuffer: AudioBufferLike) {
  return Array.from({ length: audioBuffer.numberOfChannels }, (_, channel) =>
    audioBuffer.getChannelData(channel),
  );
}

function readMonoSample(channelData: Float32Array[], sampleIndex: number) {
  if (sampleIndex < 0) {
    return 0;
  }

  let total = 0;
  let channelsRead = 0;

  for (const channel of channelData) {
    if (sampleIndex >= channel.length) {
      continue;
    }

    total += channel[sampleIndex] ?? 0;
    channelsRead += 1;
  }

  return channelsRead ? total / channelsRead : 0;
}

function bandAverage(
  frequencyData: Uint8Array,
  sampleRate: number,
  minFrequency: number,
  maxFrequency: number,
) {
  const nyquist = sampleRate / 2;
  const start = Math.max(
    0,
    Math.floor((minFrequency / nyquist) * frequencyData.length),
  );
  const end = Math.min(
    frequencyData.length - 1,
    Math.ceil((maxFrequency / nyquist) * frequencyData.length),
  );

  if (end <= start) {
    return 0;
  }

  let total = 0;
  let peak = 0;
  for (let index = start; index <= end; index += 1) {
    const value = frequencyData[index];
    total += value;
    peak = Math.max(peak, value);
  }

  const average = total / ((end - start + 1) * 255);
  return Math.min(1, average * 0.72 + (peak / 255) * 0.28);
}

function fft(real: Float32Array, imag: Float32Array) {
  for (let index = 0; index < fftSize; index += 1) {
    const reversedIndex = bitReversal[index];

    if (reversedIndex > index) {
      const realValue = real[index];
      const imagValue = imag[index];
      real[index] = real[reversedIndex];
      imag[index] = imag[reversedIndex];
      real[reversedIndex] = realValue;
      imag[reversedIndex] = imagValue;
    }
  }

  for (let size = 2; size <= fftSize; size *= 2) {
    const halfSize = size / 2;
    const angleStep = (-2 * Math.PI) / size;

    for (let start = 0; start < fftSize; start += size) {
      for (let offset = 0; offset < halfSize; offset += 1) {
        const angle = angleStep * offset;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const evenIndex = start + offset;
        const oddIndex = evenIndex + halfSize;
        const oddReal = real[oddIndex];
        const oddImag = imag[oddIndex];
        const rotatedReal = oddReal * cos - oddImag * sin;
        const rotatedImag = oddReal * sin + oddImag * cos;

        real[oddIndex] = real[evenIndex] - rotatedReal;
        imag[oddIndex] = imag[evenIndex] - rotatedImag;
        real[evenIndex] += rotatedReal;
        imag[evenIndex] += rotatedImag;
      }
    }
  }
}

function createBitReversal(size: number) {
  const bits = Math.log2(size);
  const result = new Uint16Array(size);

  for (let index = 0; index < size; index += 1) {
    let reversed = 0;
    for (let bit = 0; bit < bits; bit += 1) {
      reversed = (reversed << 1) | ((index >> bit) & 1);
    }
    result[index] = reversed;
  }

  return result;
}

function createHannWindow(size: number) {
  return Float32Array.from({ length: size }, (_, index) => {
    return 0.5 * (1 - Math.cos((2 * Math.PI * index) / (size - 1)));
  });
}

function smooth(previous: number, next: number, amount: number) {
  return previous + (next - previous) * amount;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) {
    throw new DOMException("Export cancelled.", "AbortError");
  }
}
