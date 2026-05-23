/* js/metronome.js */
import { scheduleClick, audioCtx } from './audio.js';
import { state } from './state.js';

let nextBeatTime = 0.0;
let beatSchedulerTimer = null;
const LOOKAHEAD_MS = 25.0;     // scheduler interval
const SCHEDULE_AHEAD = 0.1;    // seconds to schedule ahead
let scheduledBeats = []; // {beatNum, time} queued for JS-side handling

/* Callbacks set by startMetronome — breaks the session.js circular dependency */
let _onBeat = null;
let _getInLeadin = null;

export function startMetronome(onBeat, getInLeadin) {
  _onBeat = onBeat;
  _getInLeadin = getInLeadin;
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  nextBeatTime = audioCtx.currentTime + 0.05;
  scheduledBeats = [];
  beatSchedulerTimer = setInterval(schedulerTick, LOOKAHEAD_MS);
}

export function stopMetronome() {
  clearInterval(beatSchedulerTimer);
  beatSchedulerTimer = null;
  scheduledBeats = [];
}

/* Resume metronome from current beat position (used after pause count-in) */
export function resumeMetronome() {
  nextBeatTime = audioCtx.currentTime + 0.05;
  beatSchedulerTimer = setInterval(schedulerTick, LOOKAHEAD_MS);
}

/* Runs frequently, schedules beats slightly ahead of now */
function schedulerTick() {
  if (!audioCtx || state.paused) return;
  const inLeadin = _getInLeadin ? _getInLeadin() : false;

  while (nextBeatTime < audioCtx.currentTime + SCHEDULE_AHEAD) {
    const beatInCycle = ((state.currentBeat - 1) % 8) + 1; // 1-8
    const isAccent = (beatInCycle === 1);

    /* Check if this beat should use high-pitch click (auto-prog trigger) */
    const isProgTrigger = state._nextBeatHighPitch || false;
    state._nextBeatHighPitch = false;

    scheduleClick(nextBeatTime, isAccent, isProgTrigger);

    /* Queue this beat for JS-side processing.
       During lead-in use sentinel -1 so handleBeat routes to handleLeadinBeat
       regardless of the stale state.currentBeat value. */
    scheduledBeats.push({ beatNum: inLeadin ? -1 : state.currentBeat, time: nextBeatTime });

    /* Advance beat counter only outside lead-in.
       During lead-in, handleLeadinBeat() manages its own counter
       and resets state.currentBeat to 1 when it completes. */
    if (!inLeadin) {
      state.currentBeat = (state.currentBeat % 8) + 1;
    }

    const secPerBeat = 60.0 / state.bpm;
    nextBeatTime += secPerBeat;
  }

  /* Process any beats whose scheduled time has passed */
  const now = audioCtx.currentTime;
  while (scheduledBeats.length && scheduledBeats[0].time <= now + 0.01) {
    const { beatNum, time } = scheduledBeats.shift();
    _onBeat(beatNum, time);
  }
}
