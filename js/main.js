/* js/main.js */
import { loadSettings, syncSettingsUI, saveSettings, applyTheme } from './settings.js';
import { buildStringIndicators } from './ui.js';
import { renderStave } from './stave.js';
import { state, STATS_KEY } from './state.js';
import { startSession, pauseSession, resumeSession, endSession } from './session.js';
import { startScaleSession, pauseScaleSession, resumeScaleSession, endScaleSession, scaleState } from './scale-trainer.js';
import { startTuner, stopTuner } from './tuner.js';
import { renderStats } from './stats.js';
import { initPwa } from './pwa.js';

/* =========================================================
   SCREEN NAVIGATION
   ========================================================= */
export function showScreen(name) {
  /* Hide all screens */
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  /* Show target */
  const target = document.getElementById('screen-' + name);
  if (target) target.classList.add('active');

  /* Nav bar: hide for tuner and summary, highlight correct tab */
  const nav = document.getElementById('main-nav');
  if (name === 'tuner' || name === 'summary') {
    nav.style.display = 'none';
  } else if (name === 'scale') {
    nav.style.display = 'flex';
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.screen === 'scale');
    });
  } else {
    nav.style.display = 'flex';
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.screen === name);
    });
  }

  /* Screen-specific entry actions */
  if (name === 'tuner') startTuner();
  if (name === 'stats') renderStats();
  if (name !== 'tuner') stopTuner();
}

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

/* Nav bar navigation */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const screen = btn.dataset.screen;
    if (screen === 'scale' && scaleState.active) {
      showScreen('scale');
    } else if (screen === 'practice' && state.sessionActive) {
      showScreen('practice');
    } else {
      showScreen(screen);
    }
  });
});

/* Start session */
document.getElementById('start-session-btn').addEventListener('click', () => {
  startSession();
});

/* Start scale session */
document.getElementById('start-scale-btn').addEventListener('click', () => {
  startScaleSession();
});

/* Pause — practice mode */
document.getElementById('pause-btn').addEventListener('click', pauseSession);

/* Pause — scale mode */
document.getElementById('scale-pause-btn').addEventListener('click', pauseScaleSession);

/* Resume — routes to active mode */
document.getElementById('resume-btn').addEventListener('click', () => {
  if (state.currentMode === 'scale') resumeScaleSession();
  else resumeSession();
});

/* End session — routes to active mode */
document.getElementById('end-session-btn').addEventListener('click', () => {
  if (state.currentMode === 'scale') endScaleSession();
  else endSession();
});

/* Settings sliders */
document.getElementById('set-bpm').addEventListener('input', e => {
  state.bpm = parseInt(e.target.value);
  document.getElementById('val-bpm').textContent = state.bpm;
  document.getElementById('bpm-display').textContent = state.bpm;
  saveSettings();
});

document.getElementById('set-tolerance').addEventListener('input', e => {
  state.tolerance = parseInt(e.target.value);
  document.getElementById('val-tolerance').innerHTML = state.tolerance + '<small style="font-size:10px;color:var(--text-muted)">ms</small>';
  saveSettings();
});

document.getElementById('set-noise').addEventListener('input', e => {
  state.noiseGate = parseInt(e.target.value);
  const labels = ['Off','Very Low','Low','Low-Mid','Mid-Low','Mid','Mid-High','High-Mid','High','Very High','Extra High','Ultra High','Max'];
  document.getElementById('val-noise').textContent = labels[state.noiseGate] || state.noiseGate;
  saveSettings();
});

/* Theme segmented control */
document.querySelectorAll('#theme-control .seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.theme = btn.dataset.val;
    applyTheme(state.theme);
    document.querySelectorAll('#theme-control .seg-btn').forEach(b => b.classList.toggle('active', b === btn));
    saveSettings();
  });
});

/* Difficulty segmented control */
document.querySelectorAll('#difficulty-control .seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#difficulty-control .seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.difficulty = btn.dataset.val;
    saveSettings();
  });
});

/* Auto-progression toggle */
document.getElementById('set-autoprog').addEventListener('change', e => {
  state.autoProg = e.target.checked;
  document.getElementById('bpm-arrow').classList.toggle('visible', state.autoProg && state.sessionActive);
  saveSettings();
});

document.getElementById('set-cycles').addEventListener('input', e => {
  state.cyclesRequired = parseInt(e.target.value);
  document.getElementById('val-cycles').textContent = state.cyclesRequired;
  saveSettings();
});

document.getElementById('set-step').addEventListener('input', e => {
  state.bpmStep = parseInt(e.target.value);
  document.getElementById('val-step').textContent = state.bpmStep;
  saveSettings();
});

document.getElementById('set-scale-cycles').addEventListener('input', e => {
  state.scalePositionCycles = parseInt(e.target.value);
  document.getElementById('val-scale-cycles').textContent = state.scalePositionCycles;
  saveSettings();
});

/* Open tuner from settings */
document.getElementById('open-tuner-btn').addEventListener('click', () => {
  showScreen('tuner');
});

/* Tuner back button */
document.getElementById('tuner-back-btn').addEventListener('click', () => {
  showScreen('settings');
});

/* Reset stats */
document.getElementById('reset-stats-btn').addEventListener('click', () => {
  if (confirm('Reset all statistics? This cannot be undone.')) {
    localStorage.removeItem(STATS_KEY);
    renderStats();
  }
});

/* =========================================================
   INITIALISATION
   ========================================================= */
loadSettings();
applyTheme(state.theme); /* apply saved theme before first paint */
syncSettingsUI();
buildStringIndicators();
/* Render a placeholder stave */
renderStave('E');
showScreen('practice');
initPwa();
