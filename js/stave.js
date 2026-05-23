/* js/stave.js */
import { NOTE_STAVE_POS } from './constants.js';

/* =========================================================
   STAVE RENDERING
   The stave is a compact SVG: 5 lines, treble-implied position.
   We place a crotchet (quarter note) at the right vertical position.
   Lines y: 8, 18, 28, 38, 48 (spacing 10px)
   Positions from bottom line (E4=0) upward, each step = 5px
   ========================================================= */
export function renderStave(noteName) {
  const svg = document.getElementById('stave-svg');
  const W = 300, H = 52;

  /* Staff lines spaced 10px, bottom at y=44, top at y=4 */
  const lineY = [44, 34, 24, 14, 4]; // lines 0 (bottom, E4) to 4 (top, F5)
  const STEP = 5; // half-step vertically per stave position

  /* Stave position for this note (0 = bottom line E4, 1=F4 space, etc.) */
  const info = NOTE_STAVE_POS[noteName] || NOTE_STAVE_POS['C'];
  const pos = info.pos; // relative to bottom line

  /* Y position of note head (pos=0 -> lineY[0] = 44) */
  const noteY = lineY[0] - pos * STEP;

  /* Determine if accidental needed */
  const isSharp = noteName.includes('#');
  const isFlat = noteName.includes('b') && noteName.length > 1;

  /* Build SVG content */
  let html = '';

  /* Ledger lines below staff (pos < 0) */
  if (pos <= -2) {
    const ly = lineY[0] + Math.abs(pos % 2 === 0 ? 0 : STEP);
    for (let lp = -2; lp >= pos; lp -= 2) {
      const ly2 = lineY[0] + Math.abs(lp) * STEP;
      html += `<line x1="128" y1="${ly2}" x2="172" y2="${ly2}" style="stroke:var(--text-muted)" stroke-width="1.5"/>`;
    }
  }

  /* Staff lines */
  for (let i = 0; i < 5; i++) {
    html += `<line x1="40" y1="${lineY[i]}" x2="260" y2="${lineY[i]}" style="stroke:var(--border)" stroke-width="1.5"/>`;
  }

  /* Ledger lines above staff (pos > 8: lines are at positions 0,2,4,6,8) */
  if (pos >= 10) {
    for (let lp = 10; lp <= pos; lp += 2) {
      const ly2 = lineY[4] - (lp - 8) * STEP;
      html += `<line x1="128" y1="${ly2}" x2="172" y2="${ly2}" style="stroke:var(--text-muted)" stroke-width="1.5"/>`;
    }
  }

  /* Accidental symbol */
  if (isSharp) {
    html += `<text x="122" y="${noteY + 5}" font-size="15" style="fill:var(--accent-amber)" font-family="Georgia, serif" text-anchor="end">♯</text>`;
  } else if (isFlat) {
    html += `<text x="122" y="${noteY + 4}" font-size="15" style="fill:var(--accent-amber)" font-family="Georgia, serif" text-anchor="end">♭</text>`;
  }

  /* Note head (filled ellipse) */
  html += `<ellipse cx="150" cy="${noteY}" rx="9" ry="7" style="fill:var(--text-primary)" transform="rotate(-12, 150, ${noteY})"/>`;

  /* Note stem (up if pos < 4, down if pos >= 4) */
  if (pos < 4) {
    html += `<line x1="158.5" y1="${noteY}" x2="158.5" y2="${noteY - 32}" style="stroke:var(--text-primary)" stroke-width="1.8"/>`;
  } else {
    html += `<line x1="141.5" y1="${noteY}" x2="141.5" y2="${noteY + 32}" style="stroke:var(--text-primary)" stroke-width="1.8"/>`;
  }

  svg.innerHTML = html;
}

/* Update stave SVG */
export function updateStave(noteName) {
  if (noteName) renderStave(noteName);
}
