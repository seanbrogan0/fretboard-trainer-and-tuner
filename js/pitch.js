/* js/pitch.js */
import { state } from './state.js';
import { CANONICAL } from './constants.js';

/* Noise gate threshold mapping: scale 1-10 -> RMS threshold */
export function getNoiseGateThreshold() {
  const scale = state.noiseGate; // 1-10
  // Map 1->0.005 (very open), 10->0.08 (tight)
  return Math.max(0.001, 0.005 + (scale - 1) * (0.075 / 9));
}

/* Compute RMS amplitude of buffer */
export function computeRms(buf) {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

/* Autocorrelation pitch detection.
   Returns frequency in Hz, or -1 if not confident. */
export function detectPitch(buf, sampleRate) {
  const SIZE = buf.length;
  const rms = computeRms(buf);

  /* Noise gate */
  if (rms < getNoiseGateThreshold()) return -1;

  /* Autocorrelation */
  const corr = new Float32Array(SIZE);
  for (let lag = 0; lag < SIZE; lag++) {
    let sum = 0;
    for (let i = 0; i < SIZE - lag; i++) sum += buf[i] * buf[i + lag];
    corr[lag] = sum;
  }

  /* Find first significant drop then rise (fundamental period) */
  let d = 0;
  while (d < SIZE - 1 && corr[d] > corr[d + 1]) d++;

  /* Find peak after the initial drop */
  let maxVal = -1, maxPos = -1;
  for (let i = d; i < SIZE; i++) {
    if (corr[i] > maxVal) { maxVal = corr[i]; maxPos = i; }
  }

  /* Confidence check: peak must be >= 0.5 * corr[0] */
  if (maxVal < 0.5 * corr[0]) return -1;

  /* Parabolic interpolation for sub-sample accuracy */
  const x1 = corr[maxPos - 1] || 0;
  const x2 = corr[maxPos];
  const x3 = corr[maxPos + 1] || 0;
  const shift = (x3 - x1) / (2 * (2 * x2 - x1 - x3));
  const period = maxPos + shift;

  return sampleRate / period;
}

/* Convert Hz to note name (octave-agnostic) */
export function freqToNoteName(freq) {
  if (freq <= 0) return null;
  const noteNum = 12 * (Math.log2(freq / 440)) + 69;
  const noteIndex = Math.round(noteNum) % 12;
  return CANONICAL[(noteIndex + 12) % 12];
}

/* Convert Hz to cents offset from nearest note */
export function freqToCents(freq) {
  if (freq <= 0) return 0;
  const noteNum = 12 * (Math.log2(freq / 440)) + 69;
  const nearest = Math.round(noteNum);
  return (noteNum - nearest) * 100;
}
