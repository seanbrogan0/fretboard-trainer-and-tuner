/* js/session.js */
import { state } from './state.js';
import { initAudio, startMic, scheduleClick, audioCtx, micStream } from './audio.js';
import { startMetronome, stopMetronome, resumeMetronome } from './metronome.js';
import { pickNote } from './notes.js';
import { openDetectionWindow, finaliseDetection } from './detection.js';
import {
  triggerBeatPulse, displayNote, setNoteNameDim,
  buildStringIndicators, resetStringIndicators, setStringsPending,
  setActiveString, clearActiveString, updateProgBar, flashProgBar,
  animateBpmBump, showCountin
} from './ui.js';
import { updateStave } from './stave.js';
import { loadStats, saveStats } from './stats.js';
import { showScreen } from './main.js';

/* =========================================================
   SESSION LEAD-IN
   -3, -2 = metronome only; -1 = note appears; 0 = strings animate; then beat 1
   ========================================================= */
export let leadinBeatsLeft = 0;
export let inLeadin = false;

export function startLeadin() {
  inLeadin = true;
  leadinBeatsLeft = 4; // beats: 1(metr only), 2(metr only), 3(note appears), 4(strings animate)
  state.currentNote = null;
  setNoteNameDim(true);
}

export function handleLeadinBeat() {
  leadinBeatsLeft--;
  switch (leadinBeatsLeft) {
    case 3: /* beat 1 of leadin: metronome only */ break;
    case 2: /* beat 2: metronome only */ break;
    case 1: /* beat 3: show target note */ {
      state.currentNote = pickNote();
      state.nextNote = pickNote();
      displayNote(state.currentNote);
      updateStave(state.currentNote);
      showCountin('3');
      break;
    }
    case 0: /* beat 4: strings animate in */ {
      resetStringIndicators();
      setStringsPending();
      showCountin('4');
      break;
    }
  }

  /* Lead-in complete: next beat from scheduler must be cycle beat 1 */
  if (leadinBeatsLeft <= 0) {
    inLeadin = false;
    state.currentBeat = 1; // reset so cycle starts cleanly at E string
  }
}

/* =========================================================
   BEAT HANDLER
   Called when a beat fires (via scheduler loop).
   beatNum: 1-8 within the cycle.
   ========================================================= */
export function handleBeat(beatNum, time) {
  /* Flash the whole screen */
  triggerBeatPulse();

  /* beatNum -1 is the lead-in sentinel, always routes to lead-in handler */
  if (inLeadin || beatNum === -1) {
    handleLeadinBeat();
    return;
  }

  /* ---- Normal cycle beat handling ---- */
  const beat = beatNum; // 1-8

  if (beat >= 1 && beat <= 6) {
    /* Active string beat: close previous detection window if open, open new one */
    if (state.detectionActive) finaliseDetection(true); // missed if still open

    const stringIndex = beat - 1; // 0-5
    openDetectionWindow(stringIndex, time);
    setActiveString(stringIndex);

  } else if (beat === 7) {
    /* Rest beat: close detection if somehow open */
    if (state.detectionActive) finaliseDetection(true);
    clearActiveString();

  } else if (beat === 8) {
    /* Prep beat: pick next note, display it */
    if (state.detectionActive) finaliseDetection(true);
    clearActiveString();

    /* Evaluate this cycle before moving to next */
    evaluateCycle();

    /* Display the pre-picked next note */
    if (state.nextNote) {
      state.currentNote = state.nextNote;
      state.nextNote = null;
    } else {
      state.currentNote = pickNote();
    }
    displayNote(state.currentNote);

    /* Pre-pick note for the cycle after next */
    state.nextNote = pickNote();
    updateStave(state.currentNote);
    resetStringIndicators();
  }
}

/* =========================================================
   CYCLE EVALUATION & AUTO PROGRESSION
   ========================================================= */
export function evaluateCycle() {
  const results = state.cycleResults;
  if (!results.length) return;

  /* Clean cycle: all 6 beats hit, all offsets within tolerance */
  const isClean = results.every(r => r.type === 'hit') &&
    results.every(r => r.offset === null || r.offset <= state.tolerance);

  if (isClean) {
    state.cleanStreak++;
  } else {
    state.cleanStreak = 0;
  }

  /* Update progression bar */
  if (state.autoProg) {
    const pct = Math.min(100, (state.cleanStreak / state.cyclesRequired) * 100);
    updateProgBar(pct, isClean);
  }

  /* Check auto-progression trigger */
  if (state.autoProg && state.cleanStreak >= state.cyclesRequired) {
    triggerBpmIncrease();
    state.cleanStreak = 0;
  }

  /* Reset for next cycle */
  state.cycleResults = [];
}

export function triggerBpmIncrease() {
  const newBpm = Math.min(160, state.bpm + state.bpmStep);
  if (newBpm === state.bpm) return; // already at max

  state.bpm = newBpm;
  state._nextBeatHighPitch = true; // flag for scheduler

  /* Animate BPM display */
  animateBpmBump(newBpm);
  flashProgBar();
  updateProgBar(0, false);
}

/* =========================================================
   SESSION MANAGEMENT
   ========================================================= */
export function startSession() {
  initAudio();
  state.sessionActive = true;
  state.paused = false;
  state.currentBeat = 1;
  state.cycleResults = [];
  state.cleanStreak = 0;
  state.sessionStartBpm = state.bpm;
  state.sessionData = {};
  state.lastNote = null;
  state._nextBeatHighPitch = false;

  /* Reset UI */
  buildStringIndicators();
  updateProgBar(0, false);
  document.getElementById('bpm-display').textContent = state.bpm;
  document.getElementById('bpm-arrow').classList.toggle('visible', state.autoProg);

  /* Switch view */
  document.getElementById('start-view').style.display = 'none';
  document.getElementById('active-view').style.display = 'flex';

  /* Request mic */
  const prompt = document.getElementById('mic-prompt');
  if (!micStream) {
    prompt.classList.add('active');
    /* Mic prompt button triggers startMic then begins */
    document.getElementById('mic-prompt-btn').onclick = async () => {
      prompt.classList.remove('active');
      await startMic();
      beginMetronome();
    };
  } else {
    beginMetronome();
  }
}

export function beginMetronome() {
  startLeadin();
  startMetronome(handleBeat, () => inLeadin);
}

export function pauseSession() {
  state.paused = true;
  stopMetronome();
  document.getElementById('pause-overlay').classList.add('active');
  document.getElementById('screen-practice').style.filter = 'brightness(0.4)';
}

export function resumeSession() {
  document.getElementById('pause-overlay').classList.remove('active');
  document.getElementById('screen-practice').style.filter = '';

  /* 2-beat count-in before resume */
  state.paused = false;
  const secPerBeat = 60.0 / state.bpm;

  if (!audioCtx) initAudio();
  const startTime = audioCtx.currentTime + 0.05;
  scheduleClick(startTime, false);
  scheduleClick(startTime + secPerBeat, false);
  showCountin('1');
  setTimeout(() => showCountin('2'), secPerBeat * 1000);

  setTimeout(() => {
    resumeMetronome();
  }, (secPerBeat * 2) * 1000 + 50);
}

export function endSession() {
  stopMetronome();
  if (state.detectionActive) finaliseDetection(true);
  state.sessionActive = false;
  state.paused = false;
  document.getElementById('pause-overlay').classList.remove('active');
  document.getElementById('screen-practice').style.filter = '';
  showSummary();
}

/* =========================================================
   SESSION SUMMARY
   ========================================================= */
export function showSummary() {
  showScreen('summary');

  const sd = state.sessionData;
  const notes = Object.keys(sd);

  let totalAttempts = 0, totalCorrect = 0, allOffsets = [];
  notes.forEach(n => {
    totalAttempts += sd[n].attempts;
    totalCorrect += sd[n].correct;
    allOffsets = allOffsets.concat(sd[n].beatOffsets);
  });

  const hitRate = totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const avgOffset = allOffsets.length ? Math.round(allOffsets.reduce((a,b)=>a+b,0)/allOffsets.length) : null;

  /* Weakest/strongest note */
  let weakNote = '–', strongNote = '–', weakRate = 1, strongRate = -1;
  notes.forEach(n => {
    const r = sd[n].attempts ? sd[n].correct / sd[n].attempts : 0;
    if (r < weakRate) { weakRate = r; weakNote = n; }
    if (r > strongRate) { strongRate = r; strongNote = n; }
  });

  const cyclesCompleted = Math.floor(totalAttempts / 6);

  const html = `
    <div class="summary-stat"><span class="summary-stat-label">Cycles Completed</span><span class="summary-stat-value">${cyclesCompleted}</span></div>
    <div class="summary-stat"><span class="summary-stat-label">Note Accuracy</span><span class="summary-stat-value">${hitRate}%</span></div>
    <div class="summary-stat"><span class="summary-stat-label">Beat Accuracy</span><span class="summary-stat-value">${avgOffset !== null ? avgOffset + 'ms' : '–'}</span></div>
    <div class="summary-stat"><span class="summary-stat-label">Strongest Note</span><span class="summary-stat-value">${strongNote}</span></div>
    <div class="summary-stat"><span class="summary-stat-label">Weakest Note</span><span class="summary-stat-value">${weakNote}</span></div>
    <div class="summary-stat"><span class="summary-stat-label">BPM Journey</span><span class="summary-stat-value" style="font-size:15px">${state.sessionStartBpm} → ${state.bpm}</span></div>
  `;

  document.getElementById('summary-content').innerHTML = html;

  /* Wire up buttons */
  document.getElementById('summary-save-btn').onclick = () => {
    saveSessionToStats();
    returnToPractice();
  };
  document.getElementById('summary-discard-btn').onclick = returnToPractice;
}

export function saveSessionToStats() {
  const stored = loadStats();
  const sd = state.sessionData;
  Object.keys(sd).forEach(canonical => {
    if (!stored[canonical]) {
      stored[canonical] = { attempts: 0, correct: 0, wrongNote: 0, missed: 0, beatOffsets: [] };
    }
    stored[canonical].attempts += sd[canonical].attempts;
    stored[canonical].correct += sd[canonical].correct;
    stored[canonical].wrongNote += sd[canonical].wrongNote;
    stored[canonical].missed += sd[canonical].missed;
    stored[canonical].beatOffsets = stored[canonical].beatOffsets.concat(sd[canonical].beatOffsets).slice(-500);
  });
  saveStats(stored);
}

export function returnToPractice() {
  /* Reset practice screen to start state */
  document.getElementById('active-view').style.display = 'none';
  document.getElementById('start-view').style.display = 'flex';
  setNoteNameDim(true);
  resetStringIndicators();
  state.sessionActive = false;
  showScreen('practice');
}
