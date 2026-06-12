/* js/detection.js */
import { state } from './state.js';
import { analyserNode, micBuffer, audioCtx } from './audio.js';
import { detectPitch, freqToNoteName } from './pitch.js';
import { TO_CANONICAL } from './constants.js';
import { updateStringIndicator } from './ui.js';

/* =========================================================
   DETECTION WINDOW MANAGEMENT
   ========================================================= */
let detectionRaf = null;

export function openDetectionWindow(stringIndex, beatTime) {
  state.detectionActive = true;
  state.detectionBeat = stringIndex;
  state.detectionOpenTime = beatTime;
  state.detectionResult = null;

  /* Poll for pitch until tolerance window closes */
  const windowMs = state.tolerance;
  const startMs = performance.now();

  function poll() {
    if (!state.detectionActive) return;
    if (!analyserNode || !micBuffer) {
      /* No mic: skip detection, mark missed */
      if (performance.now() - startMs > windowMs) {
        finaliseDetection(false);
      } else {
        detectionRaf = requestAnimationFrame(poll);
      }
      return;
    }

    analyserNode.getFloatTimeDomainData(micBuffer);
    const freq = detectPitch(micBuffer, audioCtx.sampleRate);
    const elapsed = performance.now() - startMs;

    if (freq > 0) {
      /* Got a reading */
      const detected = freqToNoteName(freq);
      const target = TO_CANONICAL[state.currentNote];

      /* Compute beat offset in ms */
      const beatOffset = Math.abs((audioCtx.currentTime - state.detectionOpenTime) * 1000);

      if (detected === target) {
        state.detectionResult = { type: 'hit', offset: beatOffset };
        finaliseDetection(false);
        return;
      } else if (!state.detectionResult) {
        /* Record first wrong reading but keep polling — a later correct note can still win */
        state.detectionResult = { type: 'wrong', offset: beatOffset };
      }
    }

    /* Window expired without clean detection */
    if (elapsed > windowMs) {
      finaliseDetection(false);
      return;
    }

    detectionRaf = requestAnimationFrame(poll);
  }

  detectionRaf = requestAnimationFrame(poll);
}

export function finaliseDetection(timedOut) {
  if (!state.detectionActive) return;
  state.detectionActive = false;
  cancelAnimationFrame(detectionRaf);

  const stringIndex = state.detectionBeat;
  let result;

  if (timedOut || !state.detectionResult) {
    result = { type: 'missed', offset: null };
  } else {
    result = state.detectionResult;
  }

  /* Update string indicator UI */
  updateStringIndicator(stringIndex, result.type);

  /* Record result */
  state.cycleResults.push({
    stringIndex,
    type: result.type,
    offset: result.offset
  });

  /* Update session data — skip in scale mode to avoid polluting note-trainer stats */
  if (state.currentMode !== 'scale') {
    const canonical = TO_CANONICAL[state.currentNote] || state.currentNote;
    if (!state.sessionData[canonical]) {
      state.sessionData[canonical] = { attempts: 0, correct: 0, wrongNote: 0, missed: 0, beatOffsets: [] };
    }
    const sd = state.sessionData[canonical];
    sd.attempts++;
    if (result.type === 'hit') {
      sd.correct++;
      if (result.offset !== null) sd.beatOffsets.push(result.offset);
    } else if (result.type === 'wrong') {
      sd.wrongNote++;
    } else {
      sd.missed++;
    }
  }
}
