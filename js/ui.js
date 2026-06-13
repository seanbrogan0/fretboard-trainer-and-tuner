/* js/ui.js */

/* =========================================================
   UI HELPERS
   ========================================================= */

/* Whole-screen beat pulse — remove/re-add class to retrigger keyframe */
export function triggerBeatPulse() {
  const el = document.getElementById('beat-flash');
  el.classList.remove('pulse');
  void el.offsetWidth; // force reflow so animation restarts
  el.classList.add('pulse');
}

/* Display note name in centre */
export function displayNote(name) {
  const el = document.getElementById('note-name');
  el.textContent = name || '–';
  el.classList.remove('dim', 'flash');
  void el.offsetWidth;
  el.classList.add('flash');
  shuffleStringLabels();
}

export function setNoteNameDim(dim) {
  const el = document.getElementById('note-name');
  if (dim) { el.classList.add('dim'); el.textContent = '–'; }
  else el.classList.remove('dim');
}

/* String indicator management */
let _stringDots = []; // cached after buildStringIndicators

export function buildStringIndicators() {
  const row = document.getElementById('strings-row');
  const html = [];
  for (let i = 0; i < 6; i++) {
    html.push(`
      <div class="string-ind">
        <div class="string-dot pending" id="str-dot-${i}"></div>
        <div class="string-label">${i + 1}</div>
      </div>`);
  }
  row.innerHTML = html.join('');
  _stringDots = [];
  for (let i = 0; i < 6; i++) _stringDots.push(document.getElementById(`str-dot-${i}`));
}

function shuffleStringLabels() {
  const nums = [1, 2, 3, 4, 5, 6];
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  const labels = document.querySelectorAll('#strings-row .string-label');
  labels.forEach((el, i) => { el.textContent = nums[i]; });
}

export function resetStringIndicators() {
  for (let i = 0; i < 6; i++) {
    const dot = _stringDots[i];
    if (dot) dot.className = 'string-dot pending';
  }
}

export function setStringsPending() {
  resetStringIndicators();
}

export function setActiveString(index) {
  for (let i = 0; i < 6; i++) {
    const dot = _stringDots[i];
    if (dot && dot.classList.contains('active')) dot.classList.remove('active');
  }
  const dot = _stringDots[index];
  if (dot && dot.classList.contains('pending')) dot.className = 'string-dot active';
}

export function clearActiveString() {
  for (let i = 0; i < 6; i++) {
    const dot = _stringDots[i];
    if (dot && dot.classList.contains('active')) dot.classList.remove('active');
  }
}

export function updateStringIndicator(index, type) {
  const dot = _stringDots[index];
  if (!dot) return;
  dot.className = `string-dot ${type}`;
}

/* Progression bar — fillId defaults to the practice screen's bar */
export function updateProgBar(pct, isClean, fillId = 'prog-bar-fill') {
  const fill = document.getElementById(fillId);
  if (!fill) return;
  fill.style.height = pct + '%';
  fill.className = 'prog-bar-fill' + (pct > 60 ? ' green' : '');
}

export function flashProgBar(fillId = 'prog-bar-fill') {
  const fill = document.getElementById(fillId);
  if (!fill) return;
  fill.classList.add('flash-anim');
  setTimeout(() => fill.classList.remove('flash-anim'), 700);
}

/* BPM display bump animation */
export function animateBpmBump(newBpm) {
  const el = document.getElementById('bpm-display');
  el.classList.remove('bump');
  void el.offsetWidth;
  el.textContent = newBpm;
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 300);
  document.getElementById('bpm-arrow').classList.add('visible');
}

/* Count-in number flash */
export function showCountin(num) {
  const overlay = document.getElementById('countin-overlay');
  const numEl = document.getElementById('countin-num');
  numEl.textContent = num;
  overlay.classList.add('active');
  numEl.style.animation = 'none';
  void numEl.offsetWidth;
  numEl.style.animation = 'countin-pop 0.5s ease-out forwards';
  setTimeout(() => overlay.classList.remove('active'), 500);
}
