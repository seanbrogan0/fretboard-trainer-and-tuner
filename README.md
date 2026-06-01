# Fretboard Trainer

A progressive web app for guitarists to build fretboard note recognition and scale fluency. Uses the Web Audio API to listen to your guitar in real time and score your accuracy against a metronome.

**Live app:** https://seanbrogan.github.io/fretboard-trainer-and-tuner/

## Features

**Note Trainer** — A random note is displayed on the stave and as text. Six beats play; play the note on any string during each beat to score a hit. Clean streaks auto-advance the BPM.

**Scale Trainer** — Work through all 5 CAGED positions of A Major. The fretboard diagram highlights each note as the metronome counts it off, ascending then descending. Positions advance automatically after enough clean cycles.

**Chromatic Tuner** — Real-time pitch detection with a needle display. Accessible from any screen via Settings.

**Works offline** — Cached as a PWA after the first load. Installable on iOS and Android via "Add to Home Screen".

## Settings

| Setting | Description |
|---|---|
| BPM | Starting tempo (40–200) |
| Tolerance | Detection window in ms per beat |
| Noise Gate | Mic sensitivity (0 = off, 12 = max) |
| Difficulty | Easy (80% natural notes), Medium (50/50), Hard (20% naturals) |
| Auto-progression | Clean cycles required before BPM bumps |
| BPM Step | How much BPM increases per auto-progression |
| Cycles Per Position | Scale trainer cycles before advancing to the next shape |
| Theme | Amber, Phosphor, Slate, Ember, Bone |

## Running Locally

ES modules and the service worker require HTTP — `file://` won't work.

```
python -m http.server 8000
# or
npx http-server
```

Open `http://localhost:8000`.

## Tech

No build step, no dependencies, no package manager. Plain ES modules loaded directly by the browser. Pitch detection uses autocorrelation on a 4096-sample buffer from the Web Audio API `AnalyserNode`.
