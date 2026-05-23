/* js/tuner.js */
import { audioCtx, analyserNode, micBuffer, initAudio, startMic, stopMic } from './audio.js';
import { detectPitch, freqToNoteName, freqToCents } from './pitch.js';
import { state } from './state.js';

/* =========================================================
   TUNER
   ========================================================= */
export let tunerRaf = null;
export let tunerActive = false;

export async function startTuner() {
  if (!audioCtx) initAudio();
  tunerActive = true;
  const ok = await startMic();
  if (!ok) {
    document.getElementById('tuner-status').textContent = 'Mic unavailable';
    return;
  }
  document.getElementById('tuner-status').textContent = 'Listening...';
  tunerLoop();
}

export function stopTuner() {
  tunerActive = false;
  cancelAnimationFrame(tunerRaf);
  /* Only stop mic if not in a session */
  if (!state.sessionActive) stopMic();
  /* Reset dial */
  setNeedle(0);
}

export function tunerLoop() {
  if (!tunerActive || !analyserNode || !micBuffer) return;

  analyserNode.getFloatTimeDomainData(micBuffer);
  const freq = detectPitch(micBuffer, audioCtx.sampleRate);

  const noteEl = document.getElementById('tuner-note');
  const centsEl = document.getElementById('tuner-cents');
  const statusEl = document.getElementById('tuner-status');

  if (freq > 0) {
    const noteName = freqToNoteName(freq);
    const cents = freqToCents(freq);
    const inTune = Math.abs(cents) < 10;

    noteEl.textContent = noteName || '–';
    noteEl.className = 'tuner-note-name ' + (inTune ? 'in-tune' : 'out-tune');
    centsEl.textContent = cents >= 0 ? `+${Math.round(cents)}¢` : `${Math.round(cents)}¢`;
    statusEl.textContent = inTune ? 'In Tune' : (cents > 0 ? 'Sharp' : 'Flat');
    statusEl.className = 'tuner-status' + (inTune ? ' in-tune' : '');

    /* Needle: map cents -50..+50 to rotation -85..+85 degrees */
    const rotation = Math.max(-85, Math.min(85, cents * 1.7));
    setNeedle(rotation);

    /* Glow when in tune */
    document.getElementById('tuner-glow').style.opacity = inTune ? '0.8' : '0';
  } else {
    noteEl.textContent = '–';
    noteEl.className = 'tuner-note-name no-signal';
    centsEl.textContent = '';
    statusEl.textContent = 'Listening...';
    statusEl.className = 'tuner-status';
    setNeedle(0);
    document.getElementById('tuner-glow').style.opacity = '0';
  }

  tunerRaf = requestAnimationFrame(tunerLoop);
}

export function setNeedle(degrees) {
  const needle = document.getElementById('tuner-needle-g');
  if (needle) {
    needle.setAttribute('transform', `rotate(${degrees}, 160, 150)`);
  }
}
