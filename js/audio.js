/* js/audio.js */

export let audioCtx = null;
export let micStream = null;
export let analyserNode = null;
export let micBuffer = null; // Float32Array for autocorrelation

/* Initialise AudioContext on first user gesture */
export function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

/* Request mic, connect to AnalyserNode */
export async function startMic() {
  if (!audioCtx) initAudio();
  if (micStream) return true; // already running

  /* Resume context first — Android Chrome suspends even after creation */
  try { await audioCtx.resume(); } catch(e) {}

  try {
    /* Disable Android's aggressive audio processing which fights pitch detection */
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        latency: 0
      },
      video: false
    });
    const source = audioCtx.createMediaStreamSource(micStream);

    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 4096;
    analyserNode.smoothingTimeConstant = 0;

    source.connect(analyserNode);
    micBuffer = new Float32Array(analyserNode.fftSize);
    return true;
  } catch (e) {
    console.error('Mic error:', e);
    return false;
  }
}

/* Stop mic stream */
export function stopMic() {
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
    analyserNode = null;
    micBuffer = null;
  }
}

/* Synthesize a click sound at a given AudioContext time.
   accent: true for beat-1 click (higher pitch), false for normal.
   highPitch: optional override for auto-progression trigger click. */
export function scheduleClick(time, accent = false, highPitch = false) {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  /* Frequency: accent=1800Hz, normal=900Hz, highPitch=2400Hz */
  osc.frequency.value = highPitch ? 2400 : (accent ? 1800 : 900);
  osc.type = 'square';

  gain.gain.setValueAtTime(0.4, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

  osc.start(time);
  osc.stop(time + 0.05);
}
