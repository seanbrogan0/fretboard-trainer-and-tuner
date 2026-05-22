# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-file PWA guitar fretboard trainer with an integrated chromatic tuner. Two files total: `index.html` (all HTML/CSS/JS) and `sw.js` (service worker). No build step, no dependencies, no package manager.

## Running Locally

Open `index.html` directly in a browser, or serve with any static file server:

```
python -m http.server 8000
npx http-server
```

Service worker caching requires HTTP (not `file://`) to work correctly. The current cache version is `'fretboard-v3'` in `sw.js`.

## Architecture

Everything lives in `index.html` (~2590 lines), structured in three sections:

**HTML** — Five `<section>` screens with `id="screen-{name}"`:
- `practice` — main training interface (note display, string indicators, SVG staff)
- `summary` — post-session accuracy results
- `stats` — historical per-note statistics
- `settings` — BPM, tolerance, difficulty, auto-progression config
- `tuner` — standalone chromatic tuner with SVG needle dial

Navigation between screens uses `showScreen(name)` which toggles CSS classes and wires the bottom nav bar.

**CSS** — Embedded in `<style>`, dark theme with 18 CSS custom properties (`--clr-*`, `--radius`, etc.), amber/green/red accent colors. No external stylesheets.

**JavaScript** — Single `<script>` block at the bottom. Key architectural pieces:

- **State**: One global `state` object holds all session state (active, paused, current note, cycle results, timing data)
- **Persistence**: `localStorage['ft_settings']` and `localStorage['ft_stats']` via `loadSettings()`/`saveSettings()` and `loadStats()`/`saveStats()`
- **Audio**: Web Audio API — `initAudio()` creates context on first user gesture, `startMic()` connects the microphone through an `AnalyserNode`
- **Pitch detection**: `detectPitch(buf, sampleRate)` uses autocorrelation (not FFT) for stable sustained-note detection; `freqToNoteName()` and `freqToCents()` convert to musical values
- **Metronome**: Lookahead scheduler pattern — 25ms `setInterval` with 100ms lookahead for timing precision; `handleBeat(beatNum)` drives game logic each beat
- **Session flow**: `startSession()` → `startLeadin()` → `startMetronome()` → per-beat `handleBeat()` → `finaliseDetection()` → after 6 clean cycles → `triggerBpmIncrease()` → `endSession()`
- **SVG rendering**: `renderStave(noteName)` draws the treble clef staff with note head; tuner needle is a live SVG `<line>` rotated by cents deviation

## Key Constants

- Note pool, stave Y-positions, string names, and difficulty mappings are defined as module-level constants just above the `state` object
- Difficulty levels (Easy/Medium/Hard) control which subset of the 12-note chromatic pool is active
- Beat detection window: configurable tolerance in ms (stored in settings as `tolerance`, default 250ms)
- Noise gate: 1–10 scale mapped to internal threshold in `detectPitch()`

## Updating the Service Worker Cache

When making changes that should invalidate cached files, bump the cache version string in `sw.js`:
```js
const CACHE = 'fretboard-v4'; // was v3
```
