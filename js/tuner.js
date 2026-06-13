/* js/tuner.js */
import { audioCtx, analyserNode, micBuffer, initAudio, startMic, stopMic } from './audio.js';
import { detectPitch, freqToNoteName, freqToCents } from './pitch.js';
import { state } from './state.js';

/* =========================================================
   TUNER
   ========================================================= */
export let tunerRaf = null;
export let tunerActive = false;
let _els = null; // cached DOM refs, set once per startTuner call

export async function startTuner() {
  if (!audioCtx) initAudio();
  tunerActive = true;
  _els = {
    note:   document.getElementById('tuner-note'),
    cents:  document.getElementById('tuner-cents'),
    status: document.getElementById('tuner-status'),
    glow:   document.getElementById('tuner-glow'),
    needle: document.getElementById('tuner-needle-g'),
  };
  const ok = await startMic();
  if (!ok) {
    _els.status.textContent = 'Mic unavailable';
    return;
  }
  _els.status.textContent = 'Listening...';
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

  if (freq > 0) {
    const noteName = freqToNoteName(freq);
    const cents = freqToCents(freq);
    const inTune = Math.abs(cents) < 10;

    _els.note.textContent = noteName || '–';
    _els.note.className = 'tuner-note-name ' + (inTune ? 'in-tune' : 'out-tune');
    _els.cents.textContent = cents >= 0 ? `+${Math.round(cents)}¢` : `${Math.round(cents)}¢`;
    _els.status.textContent = inTune ? 'In Tune' : (cents > 0 ? 'Sharp' : 'Flat');
    _els.status.className = 'tuner-status' + (inTune ? ' in-tune' : '');

    /* Needle: map cents -50..+50 to rotation -85..+85 degrees */
    setNeedle(Math.max(-85, Math.min(85, cents * 1.7)));

    _els.glow.style.opacity = inTune ? '0.8' : '0';
  } else {
    _els.note.textContent = '–';
    _els.note.className = 'tuner-note-name no-signal';
    _els.cents.textContent = '';
    _els.status.textContent = 'Listening...';
    _els.status.className = 'tuner-status';
    setNeedle(0);
    _els.glow.style.opacity = '0';
  }

  tunerRaf = requestAnimationFrame(tunerLoop);
}

export function setNeedle(degrees) {
  const needle = _els?.needle ?? document.getElementById('tuner-needle-g');
  if (needle) needle.setAttribute('transform', `rotate(${degrees}, 160, 150)`);
}
