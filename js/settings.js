/* js/settings.js */
import { state, SETTINGS_KEY } from './state.js';

/* =========================================================
   SETTINGS PERSISTENCE
   ========================================================= */
export function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (!s) return;
    if (s.bpm) state.bpm = s.bpm;
    if (s.tolerance) state.tolerance = s.tolerance;
    if (s.noiseGate !== undefined) state.noiseGate = s.noiseGate;
    if (s.difficulty) state.difficulty = s.difficulty;
    if (s.autoProg !== undefined) state.autoProg = s.autoProg;
    if (s.cyclesRequired) state.cyclesRequired = s.cyclesRequired;
    if (s.bpmStep) state.bpmStep = s.bpmStep;
    if (s.theme) state.theme = s.theme;
    if (s.scalePositionCycles) state.scalePositionCycles = s.scalePositionCycles;
  } catch(e) {}
}

export function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    bpm: state.bpm,
    tolerance: state.tolerance,
    noiseGate: state.noiseGate,
    difficulty: state.difficulty,
    autoProg: state.autoProg,
    cyclesRequired: state.cyclesRequired,
    bpmStep: state.bpmStep,
    theme: state.theme,
    scalePositionCycles: state.scalePositionCycles
  }));
}

export function syncSettingsUI() {
  document.getElementById('set-bpm').value = state.bpm;
  document.getElementById('val-bpm').textContent = state.bpm;
  document.getElementById('set-tolerance').value = state.tolerance;
  document.getElementById('val-tolerance').innerHTML = state.tolerance + '<small style="font-size:10px;color:var(--text-muted)">ms</small>';
  document.getElementById('set-noise').value = state.noiseGate;
  const noiseLabels = ['Off','Very Low','Low','Low-Mid','Mid-Low','Mid','Mid-High','High-Mid','High','Very High','Extra High','Ultra High','Max'];
  document.getElementById('val-noise').textContent = noiseLabels[state.noiseGate] || state.noiseGate;
  document.getElementById('set-autoprog').checked = state.autoProg;
  document.getElementById('set-cycles').value = state.cyclesRequired;
  document.getElementById('val-cycles').textContent = state.cyclesRequired;
  document.getElementById('set-step').value = state.bpmStep;
  document.getElementById('val-step').textContent = state.bpmStep;
  document.getElementById('set-scale-cycles').value = state.scalePositionCycles;
  document.getElementById('val-scale-cycles').textContent = state.scalePositionCycles;

  /* Difficulty */
  document.querySelectorAll('#difficulty-control .seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.val === state.difficulty);
  });

  /* Theme */
  document.querySelectorAll('#theme-control .seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.val === state.theme);
  });
}

/* Apply a named theme by setting data-theme on the root element */
export function applyTheme(name) {
  document.documentElement.setAttribute('data-theme', name);
}
