# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A PWA guitar fretboard trainer with an integrated chromatic tuner. No build step, no dependencies, no package manager. The app runs entirely in the browser using the Web Audio API for pitch detection.

## File Structure

```
index.html          — HTML structure only; loads css/styles.css and js/main.js
css/
  styles.css        — All styles: 5 themes, layout, screens, animations
js/
  main.js           — Entry point; screen navigation (showScreen); all event listeners; init
  state.js          — Single global `state` object + localStorage key constants
  constants.js      — Static data: note pool, enharmonic map, stave positions, string names
  audio.js          — AudioContext, mic management (startMic/stopMic), scheduleClick
  pitch.js          — detectPitch (autocorrelation), freqToNoteName, freqToCents, noise gate
  detection.js      — Per-beat detection window: openDetectionWindow, finaliseDetection
  metronome.js      — Lookahead scheduler: startMetronome, stopMetronome, resumeMetronome
  session.js        — Session lifecycle, beat handler, cycle evaluation, auto-progression, summary
  notes.js          — pickNote — difficulty-weighted random note selection
  settings.js       — loadSettings, saveSettings, syncSettingsUI, applyTheme
  stats.js          — loadStats, saveStats, renderStats
  stave.js          — SVG treble clef stave rendering: renderStave, updateStave
  tuner.js          — Chromatic tuner loop, SVG needle animation
  ui.js             — DOM helpers: beat pulse, note display, string indicators, progress bar
  pwa.js            — initPwa: manifest blob injection + service worker registration
  scale-data.js     — SCALE_DATA (A Major, 5 positions), getScaleIds, getAscending/DescendingSequence
  scale-trainer.js  — Scale trainer session: scaleState, lead-in, beat handler, auto-progression
  fretboard-diagram.js — SVG fretboard diagram renderer with active-note highlight
  scale-stats.js    — loadScaleStats, saveScaleStats, renderScaleStats (appends to stats screen)
sw.js               — Service worker: cache-first strategy, app shell pre-caching
```

All JS files are native ES modules. `index.html` loads `js/main.js` via `<script type="module">`. No bundler, no transpiler.

## Running Locally

ES modules and the service worker both require HTTP (not `file://`). Serve with any static file server:

```
python -m http.server 8000
npx http-server
```

Then open `http://localhost:8000`.

## Screens

Five `<div class="screen">` elements toggled by `showScreen(name)` in `main.js`:

- `practice` — main training interface: start view (idle) and active view (session running)
- `summary` — post-session results with save/discard; nav bar hidden while shown
- `stats` — historical per-note accuracy tables from localStorage
- `settings` — BPM, tolerance, noise gate, difficulty, auto-progression, theme, tuner access
- `tuner` — standalone chromatic tuner; nav bar hidden while shown

`showScreen` also starts/stops the tuner and triggers `renderStats` on entry.

## CSS / Theming

`css/styles.css` uses CSS custom properties for theming. Five themes are defined on `:root[data-theme="..."]`: `amber` (default), `phosphor`, `slate`, `ember`, `bone`. Theme is applied by setting `data-theme` on `<html>` via `applyTheme(name)` in `settings.js`. The active theme name is persisted in `localStorage` via `state.theme`.

## State Management

`js/state.js` exports a single mutable `state` object that all modules import directly. It holds both persisted settings (bpm, tolerance, noiseGate, difficulty, autoProg, etc.) and transient session state (sessionActive, currentNote, cycleResults, detectionActive, etc.). There is no reactive layer — modules read and mutate `state` directly.

Persistence uses `localStorage` keys:
- `SETTINGS_KEY = 'ft_settings'` (from `state.js`) — user preferences, loaded on startup via `loadSettings()`
- `STATS_KEY = 'ft_stats'` (from `state.js`) — cumulative per-note accuracy data, keyed by canonical note name
- `SCALE_STATS_KEY = 'ft_scale_stats'` (from `scale-stats.js`) — scale trainer accuracy keyed by `'scaleId_posN'`

## Key Architectural Patterns

### Metronome Scheduler (`js/metronome.js`)

Lookahead scheduler: a `setInterval` fires every 25ms and schedules Web Audio API clicks up to 100ms (`SCHEDULE_AHEAD`) into the future, then dispatches any scheduled beats whose time has arrived. This decouples the imprecise JS timer from the precise audio clock. The `onBeat(beatNum, time)` callback is passed in by `session.js` to break a circular dependency.

### Pitch Detection (`js/pitch.js`)

`detectPitch(buf, sampleRate)` uses autocorrelation on a 4096-sample `Float32Array` from an `AnalyserNode`. Steps: noise gate check (RMS threshold), full autocorrelation array, locate the peak after the initial drop, parabolic interpolation for sub-sample accuracy. Returns Hz or `-1` if not confident. The noise gate is a 0–12 slider mapped to an RMS threshold (0 = off, 12 = max).

### Detection Window (`js/detection.js`)

On each active beat (1–6), `openDetectionWindow(stringIndex, beatTime)` starts a `requestAnimationFrame` polling loop that reads the analyser and calls `detectPitch` repeatedly until a note is detected or the tolerance window (ms) expires. The first confident reading wins and the result (`hit`/`wrong`/`missed`) is recorded via `finaliseDetection`.

### Session Cycle (`js/session.js`)

Each cycle is 8 beats:
- **Beats 1–6**: one string indicator goes active; detection window opens for each
- **Beat 7**: rest; close any lingering detection window
- **Beat 8**: advance to next note; call `evaluateCycle()` which checks clean streak and may trigger BPM increase

**Lead-in** (4 beats before beat 1): beat 1–2 are metronome only; beat 3 shows the first note; beat 4 resets string indicators. The sentinel value `-1` is pushed to the beat queue during lead-in so `handleBeat` routes to `handleLeadinBeat` without relying on `state.currentBeat`.

**Auto-progression**: after `state.cyclesRequired` consecutive clean cycles, `triggerBpmIncrease()` adds `state.bpmStep` BPM and resets the clean streak. The next beat plays a high-pitch click as an audio cue.

### Note Selection (`js/notes.js`)

`pickNote()` uses `NOTE_POOL` (naturals and accidentals arrays from `constants.js`). Difficulty controls the probability of drawing from each pool: Easy = 80% naturals, Medium = 50/50, Hard = 20% naturals. Avoids immediate repeat by canonical name. For accidentals, randomly picks either the sharp or flat enharmonic display name.

### String Indicators (`js/ui.js`)

The six dots shown during a session correspond to beats 1–6 in the current 8-beat cycle — they are not labelled by actual guitar string name. The numeric labels (1–6) under the dots are **randomly shuffled** every time a new note is displayed, preventing the player from associating a dot position with a specific string.

### SVG Stave (`js/stave.js`)

`renderStave(noteName)` builds the treble-clef staff as inline SVG. Staff lines are at y = 4, 14, 24, 34, 44 (10px spacing). `NOTE_STAVE_POS` in `constants.js` maps each note name to a stave position integer (0 = bottom line E4). The note head is an ellipse; the stem direction depends on whether the note sits above or below the middle line.

### PWA (`js/pwa.js`)

The web app manifest has no static `.json` file — it is generated as a JavaScript object and injected as a `Blob` URL at runtime. This keeps the project to a small number of files while still supporting "Add to Home Screen". The service worker is registered at `/fretboard-trainer-and-tuner/sw.js` targeting the GitHub Pages URL.

## Service Worker Cache

Current cache version in `sw.js`:

```js
const CACHE = 'fretboard-v5';
```

Bump this string whenever you deploy a change so users' browsers replace the old cached app shell. The `SHELL` array lists every file that must be pre-cached on install — add new JS or CSS files to it when you create them.

## Scale Trainer (`js/scale-trainer.js`, `js/scale-data.js`, `js/fretboard-diagram.js`, `js/scale-stats.js`)

The scale trainer is a separate session mode from the note-recognition trainer. It uses its own `scaleState` object (exported from `scale-trainer.js`) rather than `state`, mirroring the same metronome/detection infrastructure.

**Session flow**: same lead-in and 8-beat cycle structure as the note trainer. Beats 1–6 map to notes in the ascending or descending scale sequence. After each cycle the direction may flip; after enough clean cycles the BPM auto-increments. `cycleResults` is local to `scaleState` and doesn't touch the global `state`.

**`SCALE_DATA`** is keyed by scale ID string; each entry has `notes` (degree-ordered), `positions` (array of 5 CAGED-style position objects), and per-string note arrays with `{ fret, note, degree, isRoot, degreeLabel }`. Adding a new scale means adding one entry — no structural changes needed. Helper exports: `getScaleIds()`, `getAscendingSequence(scaleId, positionNum)`, `getDescendingSequence(scaleId, positionNum)`.

**`renderFretboardDiagram(scaleId, positionNum, svgElementId, activeNote)`** in `fretboard-diagram.js` renders an SVG fretboard grid into an existing `<svg>` element. The optional `activeNote` argument adds a glow highlight to the matching dot. Called on each beat during a scale session to track the player's position.

**Scale stats** (`scale-stats.js`) are stored separately from note stats under `ft_scale_stats` and appended to the stats screen by `renderScaleStats()`.

## Notes for Developers

- **Circular import**: `session.js` imports `showScreen` from `main.js`, and `main.js` imports session functions from `session.js`. ES module live bindings make this work, but be cautious adding further cross-imports between these two files.
- **No manifest.json**: The PWA manifest is a runtime blob — don't add a `manifest.json` file unless you also remove the blob injection in `pwa.js`.
- **`sw.js` SHELL array**: if you add a new file that should be available offline, add its path to the `SHELL` array in `sw.js` and bump `CACHE`.
- **Audio context**: must be created on a user gesture (iOS/Android requirement). `initAudio()` in `audio.js` is a no-op on repeat calls — safe to call defensively.
- **Detection noise gate slider**: range is 0–12 in the UI (`set-noise`), not 1–10 as the old architecture described. Label mapping is in `main.js` and `settings.js`.
