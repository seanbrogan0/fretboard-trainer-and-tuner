// js/scale-stats.js

const SCALE_STATS_KEY = 'ft_scale_stats';

// Load scale stats from localStorage, return {} on miss
export function loadScaleStats() {
  try { return JSON.parse(localStorage.getItem(SCALE_STATS_KEY)) || {}; }
  catch(e) { return {}; }
}

// Persist scale stats to localStorage
export function saveScaleStats(data) {
  localStorage.setItem(SCALE_STATS_KEY, JSON.stringify(data));
}

// Append a Scale Trainer section to the Stats screen
export function renderScaleStats() {
  const container = document.querySelector('#screen-stats .scroll-area');
  if (!container) return;

  // Remove previous scale stats section if re-rendering
  const prev = document.getElementById('scale-stats-section');
  if (prev) prev.remove();

  const stats = loadScaleStats();
  const posKeys = Object.keys(stats);

  const section = document.createElement('div');
  section.id = 'scale-stats-section';

  // Section heading
  const title = document.createElement('div');
  title.className = 'stats-section-title';
  title.textContent = 'Scale Trainer';
  section.appendChild(title);

  if (!posKeys.length) {
    const empty = document.createElement('p');
    empty.style.cssText = 'color:var(--text-muted);font-size:13px;padding:12px 0 20px';
    empty.textContent = 'No data yet';
    section.appendChild(empty);
    container.appendChild(section);
    return;
  }

  // Group by scale name for separate tables
  const byScale = {};
  posKeys.forEach(key => {
    // key format: 'aMajor_pos1'
    const [scaleId, posTag] = key.split('_');
    if (!byScale[scaleId]) byScale[scaleId] = [];
    byScale[scaleId].push({ key, posTag, data: stats[key] });
  });

  Object.entries(byScale).forEach(([scaleId, entries]) => {
    // Scale sub-heading (use scaleId as display for now)
    const scaleName = document.createElement('div');
    scaleName.style.cssText = 'font-size:11px;color:var(--text-secondary);letter-spacing:0.08em;margin:12px 0 6px';
    scaleName.textContent = scaleId;
    section.appendChild(scaleName);

    // Table per scale
    const table = document.createElement('table');
    table.className = 'note-table';
    table.innerHTML = `
      <thead><tr>
        <th>Position</th>
        <th>Attempts</th>
        <th>Hit Rate %</th>
      </tr></thead>`;

    const tbody = document.createElement('tbody');
    entries
      .sort((a, b) => a.posTag.localeCompare(b.posTag))
      .forEach(({ posTag, data }) => {
        const rate = data.attempts ? Math.round((data.correct / data.attempts) * 100) : 0;
        const posNum = posTag.replace('pos', '');
        tbody.innerHTML += `<tr>
          <td>Shape ${posNum}</td>
          <td>${data.attempts}</td>
          <td><span class="hit-rate-bar" style="--pct:${rate}%"></span>${rate}%</td>
        </tr>`;
      });

    table.appendChild(tbody);
    section.appendChild(table);
  });

  container.appendChild(section);
}
