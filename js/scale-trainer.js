// js/scale-trainer.js

import { state } from './state.js';
import { initAudio, startMic, scheduleClick, audioCtx, micStream } from './audio.js';
import { startMetronome, stopMetronome, resumeMetronome } from './metronome.js';
import { openDetectionWindow, finaliseDetection } from './detection.js';
import { triggerBeatPulse, showCountin, flashProgBar } from './ui.js';
import { updateStave } from './stave.js';
import { renderFretboardDiagram } from './fretboard-diagram.js';
import { SCALE_DATA, getScaleIds, getAscendingSequence, getDescendingSequence } from './scale-data.js';
import { loadScaleStats, saveScaleStats } from './scale-stats.js';
import { showScreen } from './main.js';

/* =========================================================
   SCALE SESSION STATE
   ========================================================= */
export const scaleState = {
  active: false,
  paused: false,
  currentBeat: 0,       // position within current cycle (1..cycleLen)
  currentScaleId: null,
  currentPosition: 1,   // 1-5
  completedPositions: [],
  noteSequence: [],      // full ascending+descending array for one cycle
  noteIndex: 0,          // index into noteSequence for current active beat
  direction: 'ascending',
  cyclesOnPosition: 0,
  cycleResults: [],      // mirrors state.cycleResults (reset each cycle)
  cleanStreak: 0,
  sessionStartBpm: 60,
  inLeadin: false,
  leadinBeatsLeft: 0,
  sessionData: {},       // 'scaleId_posN' -> {attempts,correct,wrongNote,missed}
  // Precomputed degree-ladder mapping for current position
  ascending: [],         // ascending note sequence
  noteToLadderIdx: {},   // note name -> degree ladder index
};

/* =========================================================
   LEAD-IN
   ========================================================= */
function startScaleLeadin() {
  scaleState.inLeadin = true;
  scaleState.leadinBeatsLeft = 4;
  scaleState.currentBeat = 0;
}

function handleScaleLeadinBeat() {
  scaleState.leadinBeatsLeft--;
  switch (scaleState.leadinBeatsLeft) {
    case 3: /* beat 1: metronome only */ break;
    case 2: /* beat 2: metronome only */ break;
    case 1: {
      /* Beat 3: show first note, render fretboard highlighted */
      const firstNote = scaleState.noteSequence[0];
      state.currentNote = firstNote;
      updateStave(firstNote);
      renderFretboardDiagram(
        scaleState.currentScaleId,
        scaleState.currentPosition,
        'scale-fretboard-svg',
        firstNote
      );
      showCountin('3');
      break;
    }
    case 0: {
      /* Beat 4: animate degree dots in */
      _resetAllDegreeDots();
      showCountin('4');
      break;
    }
  }

  if (scaleState.leadinBeatsLeft <= 0) {
    scaleState.inLeadin = false;
    scaleState.currentBeat = 0;
    state.currentBeat = 1; // keep metronome in sync
  }
}

/* =========================================================
   BEAT HANDLER
   ========================================================= */
export function handleScaleBeat(beatNum, time) {
  triggerBeatPulse();

  if (scaleState.inLeadin || beatNum === -1) {
    handleScaleLeadinBeat();
    return;
  }

  const cycleLen = scaleState.noteSequence.length + 2;
  const restBeat = cycleLen - 1;
  const prepBeat = cycleLen;

  scaleState.currentBeat++;
  if (scaleState.currentBeat > cycleLen) scaleState.currentBeat = 1;
  const beat = scaleState.currentBeat;

  if (beat >= 1 && beat <= scaleState.noteSequence.length) {
    /* Active note beat: detect + update UI */
    if (state.detectionActive) finaliseDetection(true);

    const note = scaleState.noteSequence[scaleState.noteIndex];
    state.currentNote = note;

    updateStave(note);
    _updateDirection();
    renderFretboardDiagram(
      scaleState.currentScaleId,
      scaleState.currentPosition,
      'scale-fretboard-svg',
      note
    );

    /* Set the active degree dot */
    const ladderIdx = scaleState.noteToLadderIdx[note];
    if (ladderIdx !== undefined) updateScaleDegreeDot(ladderIdx, 'active');

    /* Open detection window; watch result to update degree dot */
    const prevLen = state.cycleResults.length;
    openDetectionWindow(scaleState.noteIndex, time);
    _watchDetectionResult(ladderIdx, prevLen);

    scaleState.noteIndex++;

  } else if (beat === restBeat) {
    /* Rest beat: close any lingering detection, clear active dot */
    if (state.detectionActive) finaliseDetection(true);
    _clearActiveDot();
    _updateDirectionEl('ascending'); // ready for next cycle

  } else if (beat === prepBeat) {
    /* Prep beat: evaluate cycle, decide advance or repeat */
    if (state.detectionActive) finaliseDetection(true);

    evaluateScaleCycle();
    scaleState.cyclesOnPosition++;
    _updateCyclesCounter();

    if (scaleState.cyclesOnPosition >= state.scalePositionCycles) {
      advancePosition();
    } else {
      /* Stay on same position — rebuild for next cycle */
      _buildNoteSequence();
      scaleState.noteIndex = 0;
      _resetAllDegreeDots();
      renderFretboardDiagram(
        scaleState.currentScaleId,
        scaleState.currentPosition,
        'scale-fretboard-svg'
      );
    }
  }
}

/* =========================================================
   CYCLE EVALUATION
   ========================================================= */
export function evaluateScaleCycle() {
  const results = state.cycleResults;
  if (!results.length) return;

  /* Clean = every active beat was a hit within tolerance */
  const isClean = results.every(r => r.type === 'hit') &&
    results.every(r => r.offset === null || r.offset <= state.tolerance);

  if (isClean) scaleState.cleanStreak++;
  else scaleState.cleanStreak = 0;

  /* Update scale progression bar */
  const pct = Math.min(100, (scaleState.cleanStreak / state.cyclesRequired) * 100);
  _updateScaleProgBar(pct);

  /* Persist per-position accuracy */
  const posKey = `${scaleState.currentScaleId}_pos${scaleState.currentPosition}`;
  if (!scaleState.sessionData[posKey]) {
    scaleState.sessionData[posKey] = { attempts: 0, correct: 0, wrongNote: 0, missed: 0 };
  }
  const pd = scaleState.sessionData[posKey];
  results.forEach(r => {
    pd.attempts++;
    if (r.type === 'hit') pd.correct++;
    else if (r.type === 'wrong') pd.wrongNote++;
    else pd.missed++;
  });

  /* Auto-progression: BPM increase after sustained clean streak */
  if (state.autoProg && scaleState.cleanStreak >= state.cyclesRequired) {
    _triggerScaleBpmIncrease();
    scaleState.cleanStreak = 0;
  }

  state.cycleResults = [];
}

function _triggerScaleBpmIncrease() {
  const newBpm = Math.min(160, state.bpm + state.bpmStep);
  if (newBpm === state.bpm) return;
  state.bpm = newBpm;
  state._nextBeatHighPitch = true;
  const scaleBpmEl = document.getElementById('scale-bpm-display');
  if (scaleBpmEl) {
    scaleBpmEl.classList.remove('bump');
    void scaleBpmEl.offsetWidth;
    scaleBpmEl.textContent = newBpm;
    scaleBpmEl.classList.add('bump');
    setTimeout(() => scaleBpmEl.classList.remove('bump'), 300);
  }
  document.getElementById('scale-bpm-arrow')?.classList.add('visible');
  _flashScaleProgBar();
  _updateScaleProgBar(0);
}

/* =========================================================
   POSITION ADVANCEMENT
   ========================================================= */
export function advancePosition() {
  scaleState.completedPositions.push(scaleState.currentPosition);

  const positionCount = SCALE_DATA[scaleState.currentScaleId].positions.length;

  if (scaleState.currentPosition >= positionCount) {
    /* All positions done — pick a new random scale */
    const ids = getScaleIds().filter(id => id !== scaleState.currentScaleId);
    scaleState.currentScaleId = ids.length
      ? ids[Math.floor(Math.random() * ids.length)]
      : getScaleIds()[0];
    scaleState.completedPositions = [];
    scaleState.currentPosition = 1;
  } else {
    scaleState.currentPosition++;
  }

  scaleState.cyclesOnPosition = 0;
  scaleState.cleanStreak = 0;

  _buildNoteSequence();
  scaleState.noteIndex = 0;

  _showPositionOverlay();

  /* Slight delay before rebuilding UI so overlay is readable */
  setTimeout(() => {
    renderFretboardDiagram(
      scaleState.currentScaleId,
      scaleState.currentPosition,
      'scale-fretboard-svg'
    );
    buildScaleDegreeLadder(scaleState.currentScaleId, scaleState.currentPosition);
    updateScalePositionDots();
    _updateKeyDisplay();
    _updateCyclesCounter();
    _updateScaleProgBar(0);
    _resetAllDegreeDots();
  }, 100);
}

/* =========================================================
   SESSION START / STOP / PAUSE
   ========================================================= */
export function startScaleSession() {
  initAudio();

  /* Pick a random scale */
  const ids = getScaleIds();
  scaleState.currentScaleId = ids[Math.floor(Math.random() * ids.length)];
  scaleState.currentPosition = 1;
  scaleState.completedPositions = [];
  scaleState.cyclesOnPosition = 0;
  scaleState.cleanStreak = 0;
  scaleState.sessionStartBpm = state.bpm;
  scaleState.sessionData = {};
  scaleState.active = true;
  scaleState.paused = false;
  scaleState.currentBeat = 0;
  state.cycleResults = [];
  state.currentMode = 'scale';
  state._nextBeatHighPitch = false;

  /* Build note sequence and precompute degree mapping */
  _buildNoteSequence();
  scaleState.noteIndex = 0;

  /* Switch to active view */
  document.getElementById('scale-start-view').style.display = 'none';
  document.getElementById('scale-active-view').style.display = 'flex';

  /* Populate UI */
  document.getElementById('scale-bpm-display').textContent = state.bpm;
  document.getElementById('scale-bpm-arrow').classList.toggle('visible', state.autoProg);
  _updateKeyDisplay();
  _updateCyclesCounter();
  _updateScaleProgBar(0);
  updateScalePositionDots();
  buildScaleDegreeLadder(scaleState.currentScaleId, scaleState.currentPosition);
  renderFretboardDiagram(
    scaleState.currentScaleId,
    scaleState.currentPosition,
    'scale-fretboard-svg'
  );

  /* Request mic permission if needed */
  const prompt = document.getElementById('mic-prompt');
  if (!micStream) {
    prompt.classList.add('active');
    document.getElementById('mic-prompt-btn').onclick = async () => {
      prompt.classList.remove('active');
      await startMic();
      beginScaleMetronome();
    };
  } else {
    beginScaleMetronome();
  }
}

function beginScaleMetronome() {
  startScaleLeadin();
  startMetronome(handleScaleBeat, () => scaleState.inLeadin);
}

export function pauseScaleSession() {
  state.paused = true;
  scaleState.paused = true;
  stopMetronome();
  document.getElementById('pause-overlay').classList.add('active');
  document.getElementById('screen-scale').style.filter = 'brightness(0.4)';
}

export function resumeScaleSession() {
  document.getElementById('pause-overlay').classList.remove('active');
  document.getElementById('screen-scale').style.filter = '';

  state.paused = false;
  scaleState.paused = false;
  const secPerBeat = 60.0 / state.bpm;

  if (!audioCtx) initAudio();
  const startTime = audioCtx.currentTime + 0.05;
  scheduleClick(startTime, false);
  scheduleClick(startTime + secPerBeat, false);
  showCountin('1');
  setTimeout(() => showCountin('2'), secPerBeat * 1000);

  setTimeout(() => resumeMetronome(), (secPerBeat * 2) * 1000 + 50);
}

export function endScaleSession() {
  stopMetronome();
  if (state.detectionActive) finaliseDetection(true);
  scaleState.active = false;
  scaleState.paused = false;
  state.paused = false;
  document.getElementById('pause-overlay').classList.remove('active');
  document.getElementById('screen-scale').style.filter = '';
  showScaleSummary();
}

/* =========================================================
   SUMMARY
   ========================================================= */
function showScaleSummary() {
  showScreen('summary');

  const sd = scaleState.sessionData;
  const posKeys = Object.keys(sd);

  let totalAtt = 0, totalHit = 0;
  posKeys.forEach(k => { totalAtt += sd[k].attempts; totalHit += sd[k].correct; });
  const hitRate = totalAtt ? Math.round((totalHit / totalAtt) * 100) : 0;

  /* Find strongest/weakest position */
  let strongPos = '–', weakPos = '–', strongRate = -1, weakRate = 2;
  posKeys.forEach(k => {
    const r = sd[k].attempts ? sd[k].correct / sd[k].attempts : 0;
    const label = k.replace('_pos', ' Pos ');
    if (r > strongRate) { strongRate = r; strongPos = label; }
    if (r < weakRate)   { weakRate   = r; weakPos   = label; }
  });

  const totalCycles = posKeys.reduce((acc, k) => {
    return acc + Math.floor(sd[k].attempts / (scaleState.noteSequence.length || 1));
  }, 0);

  const html = `
    <div class="summary-stat"><span class="summary-stat-label">Mode</span><span class="summary-stat-value" style="font-size:14px">Scale Trainer</span></div>
    <div class="summary-stat"><span class="summary-stat-label">Cycles Completed</span><span class="summary-stat-value">${totalCycles}</span></div>
    <div class="summary-stat"><span class="summary-stat-label">Note Accuracy</span><span class="summary-stat-value">${hitRate}%</span></div>
    <div class="summary-stat"><span class="summary-stat-label">Strongest Position</span><span class="summary-stat-value" style="font-size:14px">${strongPos}</span></div>
    <div class="summary-stat"><span class="summary-stat-label">Weakest Position</span><span class="summary-stat-value" style="font-size:14px">${weakPos}</span></div>
    <div class="summary-stat"><span class="summary-stat-label">BPM Journey</span><span class="summary-stat-value" style="font-size:15px">${scaleState.sessionStartBpm} → ${state.bpm}</span></div>
  `;
  document.getElementById('summary-content').innerHTML = html;

  document.getElementById('summary-save-btn').onclick = () => {
    _saveScaleSessionToStats();
    _returnToScale();
  };
  document.getElementById('summary-discard-btn').onclick = _returnToScale;
}

function _saveScaleSessionToStats() {
  const stored = loadScaleStats();
  const sd = scaleState.sessionData;
  Object.keys(sd).forEach(key => {
    if (!stored[key]) stored[key] = { attempts: 0, correct: 0, wrongNote: 0, missed: 0 };
    stored[key].attempts  += sd[key].attempts;
    stored[key].correct   += sd[key].correct;
    stored[key].wrongNote += sd[key].wrongNote;
    stored[key].missed    += sd[key].missed;
  });
  saveScaleStats(stored);
}

function _returnToScale() {
  document.getElementById('scale-active-view').style.display = 'none';
  document.getElementById('scale-start-view').style.display = 'flex';
  scaleState.active = false;
  state.currentMode = 'practice';
  showScreen('scale');
}

/* =========================================================
   DEGREE LADDER UI
   ========================================================= */
export function buildScaleDegreeLadder(scaleId, positionNum) {
  const row = document.getElementById('scale-degrees-row');
  if (!row) return;
  row.innerHTML = '';

  const position = SCALE_DATA[scaleId].positions.find(p => p.positionNum === positionNum);
  if (!position) return;

  /* Build note→degreeLabel map from position data */
  const noteToDegree = {};
  Object.values(position.strings).forEach(notes => {
    notes.forEach(n => { noteToDegree[n.note] = n.degreeLabel; });
  });

  /* One dot per note in ascending sequence */
  const ascending = getAscendingSequence(scaleId, positionNum);
  ascending.forEach((note, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'scale-degree-dot';

    const circle = document.createElement('div');
    circle.className = 'scale-degree-circle pending';
    circle.id = `scale-deg-${i}`;
    circle.textContent = note;

    const label = document.createElement('div');
    label.className = 'scale-degree-label';
    label.textContent = noteToDegree[note] || '';

    wrap.appendChild(circle);
    wrap.appendChild(label);
    row.appendChild(wrap);
  });
}

export function updateScaleDegreeDot(index, dotState) {
  const el = document.getElementById(`scale-deg-${index}`);
  if (!el) return;
  el.className = `scale-degree-circle ${dotState}`;
}

/* =========================================================
   POSITION DOTS
   ========================================================= */
export function updateScalePositionDots() {
  const container = document.getElementById('scale-position-dots');
  if (!container) return;
  const dots = container.querySelectorAll('.scale-pos-dot');
  dots.forEach((dot, i) => {
    const posNum = i + 1;
    dot.classList.remove('completed', 'current');
    if (scaleState.completedPositions.includes(posNum)) dot.classList.add('completed');
    else if (posNum === scaleState.currentPosition)      dot.classList.add('current');
  });
}

/* =========================================================
   INTERNAL HELPERS
   ========================================================= */

/* Build ascending+descending note sequence for current position */
function _buildNoteSequence() {
  const asc  = getAscendingSequence(scaleState.currentScaleId, scaleState.currentPosition);
  const desc = getDescendingSequence(scaleState.currentScaleId, scaleState.currentPosition);
  scaleState.noteSequence = [...asc, ...desc];
  scaleState.ascending = asc;

  /* Precompute note → ladder index for fast lookup */
  scaleState.noteToLadderIdx = {};
  asc.forEach((n, i) => { scaleState.noteToLadderIdx[n] = i; });
}

/* Watch for the detection window to close, then update degree dot */
function _watchDetectionResult(ladderIdx, prevLen) {
  function check() {
    if (!state.detectionActive && state.cycleResults.length > prevLen) {
      const result = state.cycleResults[prevLen];
      if (result && ladderIdx !== undefined) {
        updateScaleDegreeDot(ladderIdx, result.type);
      }
      return;
    }
    if (state.detectionActive) requestAnimationFrame(check);
  }
  requestAnimationFrame(check);
}

/* Remove 'active' class from whichever degree dot is currently active */
function _clearActiveDot() {
  const circles = document.querySelectorAll('.scale-degree-circle.active');
  circles.forEach(c => c.classList.replace('active', 'pending'));
}

/* Set all degree dots to pending */
function _resetAllDegreeDots() {
  const circles = document.querySelectorAll('.scale-degree-circle');
  circles.forEach(c => {
    c.classList.remove('active', 'hit', 'missed', 'wrong');
    c.classList.add('pending');
  });
}

/* Update direction indicator based on current note index */
function _updateDirection() {
  const dir = scaleState.noteIndex < scaleState.ascending.length
    ? 'ascending' : 'descending';
  _updateDirectionEl(dir);
}

function _updateDirectionEl(dir) {
  const el = document.getElementById('scale-direction');
  if (!el) return;
  el.classList.toggle('descending', dir === 'descending');
}

/* Update the key/scale label in the top bar */
function _updateKeyDisplay() {
  const el = document.getElementById('scale-key-display');
  if (!el) return;
  const scale = SCALE_DATA[scaleState.currentScaleId];
  const totalPos = scale ? scale.positions.length : 5;
  el.textContent = `${scale ? scale.name : scaleState.currentScaleId} — Shape ${scaleState.currentPosition} / ${totalPos}`;
}

/* Update "Cycle N / M" counter */
function _updateCyclesCounter() {
  const el = document.getElementById('scale-cycles-counter');
  if (!el) return;
  el.textContent = `Cycle ${scaleState.cyclesOnPosition} / ${state.scalePositionCycles}`;
}

/* Update the vertical progression bar on the scale screen */
function _updateScaleProgBar(pct) {
  const fill = document.getElementById('scale-prog-bar-fill');
  if (!fill) return;
  fill.style.height = pct + '%';
  fill.className = 'prog-bar-fill' + (pct > 60 ? ' green' : '');
}

function _flashScaleProgBar() {
  const fill = document.getElementById('scale-prog-bar-fill');
  if (!fill) return;
  fill.classList.add('flash-anim');
  setTimeout(() => fill.classList.remove('flash-anim'), 700);
}

/* Show the position announcement overlay for 1500ms */
function _showPositionOverlay() {
  const overlay = document.getElementById('scale-position-overlay');
  if (!overlay) return;
  const numEl  = overlay.querySelector('.scale-pos-overlay-number');
  const nameEl = overlay.querySelector('.scale-pos-overlay-name');
  if (numEl)  numEl.textContent  = String(scaleState.currentPosition);
  if (nameEl) nameEl.textContent = SCALE_DATA[scaleState.currentScaleId]?.name ?? scaleState.currentScaleId;
  overlay.classList.add('active');
  setTimeout(() => overlay.classList.remove('active'), 1500);
}
