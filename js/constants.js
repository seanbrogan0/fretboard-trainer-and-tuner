/* js/constants.js */

/* All 12 canonical pitch classes (stored as sharp names internally) */
export const CANONICAL = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

/* Enharmonic display pairs: canonical sharp -> possible display names */
export const ENHARMONIC = {
  'C#': ['C#','Db'], 'D#': ['D#','Eb'], 'F#': ['F#','Gb'],
  'G#': ['G#','Ab'], 'A#': ['A#','Bb']
};

/* The 17-note training pool and natural/accidental classification */
export const NOTE_POOL = {
  naturals: ['A','B','C','D','E','F','G'],
  accidentals: ['A#','C#','D#','F#','G#','Bb','Eb','Ab','Db','Gb']
};

/* Canonical name for any display name (flats -> sharp) */
export const TO_CANONICAL = {
  'C':'C','C#':'C#','Db':'C#','D':'D','D#':'D#','Eb':'D#',
  'E':'E','F':'F','F#':'F#','Gb':'F#','G':'G','G#':'G#',
  'Ab':'G#','A':'A','A#':'A#','Bb':'A#','B':'B'
};

/* Stave layout: treble clef line/space positions for each note
   pos: 0 = bottom line (E4), 1 = first space (F4), etc.
   using pos from 0 (E4 bottom) to 12 (F6). */
export const NOTE_STAVE_POS = {
  'C': {oct:4, pos:-2}, 'C#': {oct:4, pos:-2}, 'Db': {oct:4, pos:-2},
  'D': {oct:4, pos:-1}, 'D#': {oct:4, pos:-1}, 'Eb': {oct:4, pos:-1},
  'E': {oct:4, pos:0},
  'F': {oct:4, pos:1},  'F#': {oct:4, pos:1}, 'Gb': {oct:4, pos:1},
  'G': {oct:4, pos:2},  'G#': {oct:4, pos:2}, 'Ab': {oct:4, pos:2},
  'A': {oct:4, pos:3},  'A#': {oct:4, pos:3}, 'Bb': {oct:4, pos:3},
  'B': {oct:4, pos:4},
};

/* String names for display */
export const STRING_NAMES = ['E','A','D','G','B','e'];
