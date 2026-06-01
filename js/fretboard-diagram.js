// js/fretboard-diagram.js

import { SCALE_DATA } from './scale-data.js';

// Renders an SVG fretboard scale diagram into the element with the given ID.
// activeNote (optional): note name string — matching dots receive a glow halo.
export function renderFretboardDiagram(scaleId, positionNum, svgElementId, activeNote) {
  const svg = document.getElementById(svgElementId);
  if (!svg) return;

  // Full clear and viewBox reset on every call
  svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 0 280 150');

  const scale = SCALE_DATA[scaleId];
  if (!scale) return;
  const position = scale.positions.find(p => p.positionNum === positionNum);
  if (!position) return;

  const { lowestFret, fretSpan, strings } = position;

  // Layout: left 30 (fret label), right 10, top 15, bottom 15
  const LEFT = 30, TOP = 15;
  const W = 240;   // 280 - 30 - 10
  const H = 120;   // 150 - 15 - 15

  const fretW  = W / fretSpan;   // horizontal gap between fret lines
  const strGap = H / 5;          // vertical gap between string lines (5 gaps, 6 strings)

  // Create an SVG element with the given attributes
  function el(tag, attrs) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }

  // x pixel position for a given fret number
  function xFret(fret) {
    return LEFT + (fret - lowestFret) * fretW;
  }

  // y pixel position for a given string number (6=top/low-E, 1=bottom/high-e)
  function yString(s) {
    return TOP + (6 - s) * strGap;
  }

  // Draw 6 horizontal string lines
  for (let s = 1; s <= 6; s++) {
    const y = yString(s);
    svg.appendChild(el('line', {
      x1: LEFT, y1: y, x2: LEFT + W, y2: y,
      stroke: 'var(--text-secondary)', 'stroke-width': '1'
    }));
  }

  // Draw fretSpan+1 vertical fret lines; first line is thick nut when lowestFret is 0
  for (let f = 0; f <= fretSpan; f++) {
    const x = LEFT + f * fretW;
    const isNut = f === 0 && lowestFret === 0;
    svg.appendChild(el('line', {
      x1: x, y1: TOP, x2: x, y2: TOP + H,
      stroke: 'var(--text-secondary)',
      'stroke-width': isNut ? '4' : '1'
    }));
  }

  // Fret position label to the left when not at the nut
  if (lowestFret !== 0) {
    const t = el('text', {
      x: LEFT - 5,
      y: TOP + H / 2,
      'text-anchor': 'end',
      'dominant-baseline': 'middle',
      'font-size': '10',
      'font-family': 'var(--font-display)',
      fill: 'var(--text-secondary)'
    });
    t.textContent = String(lowestFret);
    svg.appendChild(t);
  }

  // Draw note dots for every string/fret entry in the position
  for (let s = 1; s <= 6; s++) {
    const stringNotes = strings[s] || [];
    for (const n of stringNotes) {
      const cx = xFret(n.fret);
      const cy = yString(s);
      const isActive = !!activeNote && n.note === activeNote;

      // Glow halo for active beat highlight — rendered first so it sits behind the dot
      if (isActive) {
        svg.appendChild(el('circle', {
          cx, cy, r: '13',
          fill: 'var(--accent-amber)',
          opacity: '0.30'
        }));
      }

      // Filled dot — roots use accent colour, others use surface with secondary stroke
      if (n.isRoot) {
        svg.appendChild(el('circle', {
          cx, cy, r: '9',
          fill: 'var(--accent-amber)'
        }));
      } else {
        svg.appendChild(el('circle', {
          cx, cy, r: '8',
          fill: 'var(--surface)',
          stroke: 'var(--text-secondary)',
          'stroke-width': '1.5'
        }));
      }

      // Note name centred inside the dot (single label — degree shown in ladder below)
      const noteFill = n.isRoot ? 'var(--bg)' : 'var(--text-primary)';
      const noteLbl = el('text', {
        x: cx,
        y: cy,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-size': '8',
        'font-family': 'var(--font-display)',
        'font-weight': '600',
        fill: noteFill,
        'pointer-events': 'none'
      });
      noteLbl.textContent = n.note;
      svg.appendChild(noteLbl);
    }
  }
}
