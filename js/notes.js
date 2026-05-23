/* js/notes.js */
import { NOTE_POOL, TO_CANONICAL, ENHARMONIC } from './constants.js';
import { state } from './state.js';

/* =========================================================
   NOTE SELECTION
   ========================================================= */
export function pickNote() {
  const pools = NOTE_POOL;
  let pool;

  const r = Math.random();
  if (state.difficulty === 'easy')        pool = r < 0.8 ? pools.naturals : pools.accidentals;
  else if (state.difficulty === 'medium') pool = r < 0.5 ? pools.naturals : pools.accidentals;
  else                                    pool = r < 0.2 ? pools.naturals : pools.accidentals;

  /* Avoid repeat of last note (by canonical) */
  let attempts = 0;
  let chosen;
  do {
    chosen = pool[Math.floor(Math.random() * pool.length)];
    attempts++;
  } while (attempts < 10 && TO_CANONICAL[chosen] === TO_CANONICAL[state.lastNote]);

  state.lastNote = chosen;

  /* For accidentals, randomly choose enharmonic display name */
  const canonical = TO_CANONICAL[chosen];
  if (ENHARMONIC[canonical]) {
    const pair = ENHARMONIC[canonical];
    chosen = pair[Math.floor(Math.random() * pair.length)];
  }

  return chosen;
}
