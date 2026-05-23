// js/scale-data.js

// All guitar scale position data, keyed by scale ID string
export const SCALE_DATA = {

  aMajor: {
    id: 'aMajor',
    name: 'A Major',
    noteCount: 7,
    // Notes in ascending scale degree order (index 0 = degree 1)
    notes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],

    positions: [

      // Shape 1 — root (A) on string 6 fret 5
      {
        positionNum: 1,
        label: '4th fret',
        lowestFret: 4,
        fretSpan: 4,
        strings: {
          6: [
            { fret: 4, note: 'G#', degree: 7, isRoot: false, degreeLabel: '7' },
            { fret: 5, note: 'A',  degree: 1, isRoot: true,  degreeLabel: '1' },
            { fret: 7, note: 'B',  degree: 2, isRoot: false, degreeLabel: '2' },
          ],
          5: [
            { fret: 4, note: 'C#', degree: 3, isRoot: false, degreeLabel: '3' },
            { fret: 5, note: 'D',  degree: 4, isRoot: false, degreeLabel: '4' },
            { fret: 7, note: 'E',  degree: 5, isRoot: false, degreeLabel: '5' },
          ],
          4: [
            { fret: 4, note: 'F#', degree: 6, isRoot: false, degreeLabel: '6' },
            { fret: 6, note: 'G#', degree: 7, isRoot: false, degreeLabel: '7' },
            { fret: 7, note: 'A',  degree: 1, isRoot: true,  degreeLabel: '1' },
          ],
          3: [
            { fret: 4, note: 'B',  degree: 2, isRoot: false, degreeLabel: '2' },
            { fret: 6, note: 'C#', degree: 3, isRoot: false, degreeLabel: '3' },
            { fret: 7, note: 'D',  degree: 4, isRoot: false, degreeLabel: '4' },
          ],
          2: [
            { fret: 5, note: 'E',  degree: 5, isRoot: false, degreeLabel: '5' },
            { fret: 7, note: 'F#', degree: 6, isRoot: false, degreeLabel: '6' },
          ],
          1: [
            { fret: 4, note: 'G#', degree: 7, isRoot: false, degreeLabel: '7' },
            { fret: 5, note: 'A',  degree: 1, isRoot: true,  degreeLabel: '1' },
            { fret: 7, note: 'B',  degree: 2, isRoot: false, degreeLabel: '2' },
          ],
        },
      },

      // Shape 2 — root (A) on string 4 fret 7
      {
        positionNum: 2,
        label: '7th fret',
        lowestFret: 7,
        fretSpan: 4,
        strings: {
          6: [
            { fret: 7,  note: 'B',  degree: 2, isRoot: false, degreeLabel: '2' },
            { fret: 9,  note: 'C#', degree: 3, isRoot: false, degreeLabel: '3' },
            { fret: 10, note: 'D',  degree: 4, isRoot: false, degreeLabel: '4' },
          ],
          5: [
            { fret: 7,  note: 'E',  degree: 5, isRoot: false, degreeLabel: '5' },
            { fret: 9,  note: 'F#', degree: 6, isRoot: false, degreeLabel: '6' },
            { fret: 11, note: 'G#', degree: 7, isRoot: false, degreeLabel: '7' },
          ],
          4: [
            { fret: 7,  note: 'A',  degree: 1, isRoot: true,  degreeLabel: '1' },
            { fret: 9,  note: 'B',  degree: 2, isRoot: false, degreeLabel: '2' },
            { fret: 11, note: 'C#', degree: 3, isRoot: false, degreeLabel: '3' },
          ],
          3: [
            { fret: 7,  note: 'D',  degree: 4, isRoot: false, degreeLabel: '4' },
            { fret: 9,  note: 'E',  degree: 5, isRoot: false, degreeLabel: '5' },
            { fret: 11, note: 'F#', degree: 6, isRoot: false, degreeLabel: '6' },
          ],
          2: [
            { fret: 7,  note: 'F#', degree: 6, isRoot: false, degreeLabel: '6' },
            { fret: 9,  note: 'G#', degree: 7, isRoot: false, degreeLabel: '7' },
            { fret: 10, note: 'A',  degree: 1, isRoot: true,  degreeLabel: '1' },
          ],
          1: [
            { fret: 7,  note: 'B',  degree: 2, isRoot: false, degreeLabel: '2' },
            { fret: 9,  note: 'C#', degree: 3, isRoot: false, degreeLabel: '3' },
            { fret: 10, note: 'D',  degree: 4, isRoot: false, degreeLabel: '4' },
          ],
        },
      },

      // Shape 3 — root (A) on string 5 fret 12
      {
        positionNum: 3,
        label: '9th fret',
        lowestFret: 9,
        fretSpan: 4,
        strings: {
          6: [
            { fret: 9,  note: 'C#', degree: 3, isRoot: false, degreeLabel: '3' },
            { fret: 10, note: 'D',  degree: 4, isRoot: false, degreeLabel: '4' },
            { fret: 12, note: 'E',  degree: 5, isRoot: false, degreeLabel: '5' },
          ],
          5: [
            { fret: 9,  note: 'F#', degree: 6, isRoot: false, degreeLabel: '6' },
            { fret: 11, note: 'G#', degree: 7, isRoot: false, degreeLabel: '7' },
            { fret: 12, note: 'A',  degree: 1, isRoot: true,  degreeLabel: '1' },
          ],
          4: [
            { fret: 9,  note: 'B',  degree: 2, isRoot: false, degreeLabel: '2' },
            { fret: 11, note: 'C#', degree: 3, isRoot: false, degreeLabel: '3' },
            { fret: 12, note: 'D',  degree: 4, isRoot: false, degreeLabel: '4' },
          ],
          3: [
            { fret: 9,  note: 'E',  degree: 5, isRoot: false, degreeLabel: '5' },
            { fret: 11, note: 'F#', degree: 6, isRoot: false, degreeLabel: '6' },
            { fret: 13, note: 'G#', degree: 7, isRoot: false, degreeLabel: '7' },
          ],
          2: [
            { fret: 9,  note: 'G#', degree: 7, isRoot: false, degreeLabel: '7' },
            { fret: 10, note: 'A',  degree: 1, isRoot: true,  degreeLabel: '1' },
            { fret: 12, note: 'B',  degree: 2, isRoot: false, degreeLabel: '2' },
          ],
          1: [
            { fret: 9,  note: 'C#', degree: 3, isRoot: false, degreeLabel: '3' },
            { fret: 10, note: 'D',  degree: 4, isRoot: false, degreeLabel: '4' },
            { fret: 12, note: 'E',  degree: 5, isRoot: false, degreeLabel: '5' },
          ],
        },
      },

      // Shape 4 — root (A) on string 3 fret 14 and string 5 fret 12
      {
        positionNum: 4,
        label: '11th fret',
        lowestFret: 11,
        fretSpan: 4,
        strings: {
          6: [
            { fret: 12, note: 'E',  degree: 5, isRoot: false, degreeLabel: '5' },
            { fret: 14, note: 'F#', degree: 6, isRoot: false, degreeLabel: '6' },
          ],
          5: [
            { fret: 11, note: 'G#', degree: 7, isRoot: false, degreeLabel: '7' },
            { fret: 12, note: 'A',  degree: 1, isRoot: true,  degreeLabel: '1' },
            { fret: 14, note: 'B',  degree: 2, isRoot: false, degreeLabel: '2' },
          ],
          4: [
            { fret: 11, note: 'C#', degree: 3, isRoot: false, degreeLabel: '3' },
            { fret: 12, note: 'D',  degree: 4, isRoot: false, degreeLabel: '4' },
            { fret: 14, note: 'E',  degree: 5, isRoot: false, degreeLabel: '5' },
          ],
          3: [
            { fret: 11, note: 'F#', degree: 6, isRoot: false, degreeLabel: '6' },
            { fret: 13, note: 'G#', degree: 7, isRoot: false, degreeLabel: '7' },
            { fret: 14, note: 'A',  degree: 1, isRoot: true,  degreeLabel: '1' },
          ],
          2: [
            { fret: 12, note: 'B',  degree: 2, isRoot: false, degreeLabel: '2' },
            { fret: 14, note: 'C#', degree: 3, isRoot: false, degreeLabel: '3' },
            { fret: 15, note: 'D',  degree: 4, isRoot: false, degreeLabel: '4' },
          ],
          1: [
            { fret: 12, note: 'E',  degree: 5, isRoot: false, degreeLabel: '5' },
            { fret: 14, note: 'F#', degree: 6, isRoot: false, degreeLabel: '6' },
          ],
        },
      },

      // Shape 5 — open/first position, root (A) on string 3 fret 2
      {
        positionNum: 5,
        label: '1st fret',
        lowestFret: 1,
        fretSpan: 4,
        strings: {
          6: [
            { fret: 2, note: 'F#', degree: 6, isRoot: false, degreeLabel: '6' },
            { fret: 4, note: 'G#', degree: 7, isRoot: false, degreeLabel: '7' },
            { fret: 5, note: 'A',  degree: 1, isRoot: true,  degreeLabel: '1' },
          ],
          5: [
            { fret: 2, note: 'B',  degree: 2, isRoot: false, degreeLabel: '2' },
            { fret: 4, note: 'C#', degree: 3, isRoot: false, degreeLabel: '3' },
            { fret: 5, note: 'D',  degree: 4, isRoot: false, degreeLabel: '4' },
          ],
          4: [
            { fret: 2, note: 'E',  degree: 5, isRoot: false, degreeLabel: '5' },
            { fret: 4, note: 'F#', degree: 6, isRoot: false, degreeLabel: '6' },
          ],
          3: [
            { fret: 1, note: 'G#', degree: 7, isRoot: false, degreeLabel: '7' },
            { fret: 2, note: 'A',  degree: 1, isRoot: true,  degreeLabel: '1' },
            { fret: 4, note: 'B',  degree: 2, isRoot: false, degreeLabel: '2' },
          ],
          2: [
            { fret: 2, note: 'C#', degree: 3, isRoot: false, degreeLabel: '3' },
            { fret: 3, note: 'D',  degree: 4, isRoot: false, degreeLabel: '4' },
            { fret: 5, note: 'E',  degree: 5, isRoot: false, degreeLabel: '5' },
          ],
          1: [
            { fret: 2, note: 'F#', degree: 6, isRoot: false, degreeLabel: '6' },
            { fret: 4, note: 'G#', degree: 7, isRoot: false, degreeLabel: '7' },
            { fret: 5, note: 'A',  degree: 1, isRoot: true,  degreeLabel: '1' },
          ],
        },
      },

    ],
  },

};

// Returns all scale IDs currently registered in SCALE_DATA
export function getScaleIds() {
  return Object.keys(SCALE_DATA);
}

// Returns unique notes present in the position, ordered by ascending scale degree
export function getAscendingSequence(scaleId, positionNum) {
  const scale = SCALE_DATA[scaleId];
  const position = scale.positions.find(p => p.positionNum === positionNum);

  // Collect unique note names across all strings
  const noteSet = new Set();
  for (const stringNotes of Object.values(position.strings)) {
    for (const n of stringNotes) noteSet.add(n.note);
  }

  // Filter scale.notes (already in degree order) to only present notes
  return scale.notes.filter(n => noteSet.has(n));
}

// Returns descending sequence — ascending reversed, top note removed to avoid repetition
export function getDescendingSequence(scaleId, positionNum) {
  const asc = getAscendingSequence(scaleId, positionNum);
  return asc.slice().reverse().slice(1);
}
