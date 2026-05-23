/* js/state.js */

/* Settings keys in localStorage */
export const SETTINGS_KEY = 'ft_settings';
export const STATS_KEY = 'ft_stats';

export const state = {
  /* Settings */
  bpm: 60,
  tolerance: 250,   // ms
  noiseGate: 5,     // 1-10 scale
  difficulty: 'easy',
  autoProg: true,
  cyclesRequired: 8,
  bpmStep: 5,
  theme: 'amber',
  scalePositionCycles: 3,
  currentMode: 'practice',  // 'practice' | 'scale'

  /* Session */
  sessionActive: false,
  paused: false,
  currentBeat: 0,       // 1-indexed, 1-8
  currentNote: null,    // display name
  nextNote: null,       // pre-picked for beat 8
  lastNote: null,       // to avoid repeat

  /* Per-cycle accuracy tracking */
  cycleResults: [],     // array of {hit, wrong, missed, offset} per beat (6 per cycle)
  cleanStreak: 0,
  sessionStartBpm: 60,

  /* Per-session accumulators (not yet saved to localStorage) */
  sessionData: {},      // canonical -> {attempts, correct, wrongNote, missed, beatOffsets}

  /* Beat detection window */
  detectionActive: false,
  detectionBeat: 0,     // which string beat we're detecting for (1-6)
  detectionOpenTime: 0, // AudioContext time when window opened

  /* UI beat tracking */
  beatStartTime: 0,
};
