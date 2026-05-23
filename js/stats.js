/* js/stats.js */
import { STATS_KEY } from './state.js';

/* =========================================================
   STATS
   ========================================================= */
export function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; }
  catch(e) { return {}; }
}

export function saveStats(data) {
  localStorage.setItem(STATS_KEY, JSON.stringify(data));
}

export function renderStats() {
  const stats = loadStats();
  const notes = Object.keys(stats);

  if (!notes.length) {
    document.getElementById('stats-hit-rate').innerHTML = '–<span class="stat-card-unit">%</span>';
    document.getElementById('stats-beat-acc').innerHTML = '–<span class="stat-card-unit">ms</span>';
    document.getElementById('note-table-body').innerHTML = '<tr><td colspan="6" style="color:var(--text-muted);text-align:center;padding:20px">No data yet</td></tr>';
    document.getElementById('beat-table-body').innerHTML = '';
    return;
  }

  /* Overview */
  let totalAtt = 0, totalHit = 0, allOffsets = [];
  notes.forEach(n => {
    totalAtt += stats[n].attempts;
    totalHit += stats[n].correct;
    allOffsets = allOffsets.concat(stats[n].beatOffsets);
  });
  const hitRate = totalAtt ? Math.round((totalHit/totalAtt)*100) : 0;
  const avgOff = allOffsets.length ? Math.round(allOffsets.reduce((a,b)=>a+b,0)/allOffsets.length) : null;

  document.getElementById('stats-hit-rate').innerHTML = `${hitRate}<span class="stat-card-unit">%</span>`;
  document.getElementById('stats-beat-acc').innerHTML = `${avgOff !== null ? avgOff : '–'}<span class="stat-card-unit">ms</span>`;

  /* Per-note table */
  const noteRows = notes.map(n => {
    const d = stats[n];
    const rate = d.attempts ? Math.round((d.correct/d.attempts)*100) : 0;
    return `<tr>
      <td>${n}</td>
      <td>${d.attempts}</td>
      <td>${d.correct}</td>
      <td>${d.wrongNote}</td>
      <td>${d.missed}</td>
      <td><span class="hit-rate-bar" style="--pct:${rate}%"></span>${rate}%</td>
    </tr>`;
  }).join('');
  document.getElementById('note-table-body').innerHTML = noteRows || '<tr><td colspan="6" style="color:var(--text-muted)">No data</td></tr>';

  /* Beat accuracy table */
  const beatRows = notes.filter(n => stats[n].beatOffsets.length).map(n => {
    const offs = stats[n].beatOffsets;
    const avg = Math.round(offs.reduce((a,b)=>a+b,0)/offs.length);
    return `<tr><td>${n}</td><td>${avg}ms</td><td>${offs.length}</td></tr>`;
  }).join('');
  document.getElementById('beat-table-body').innerHTML = beatRows || '<tr><td colspan="3" style="color:var(--text-muted)">No data</td></tr>';
}
