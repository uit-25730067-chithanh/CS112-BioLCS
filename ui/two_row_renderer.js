/**
 * Two-Row Space-Optimized DP Renderer Module
 * Renders ping-pong buffer visualization demonstrating O(min(m, n)) space complexity.
 */

export class TwoRowRenderer {
  constructor(containerElement) {
    this.container = containerElement;
    this.seqA = '';
    this.seqB = '';
    this.lang = 'vi';
  }

  setLanguage(lang) {
    this.lang = lang || 'vi';
    if (this.seqA || this.seqB) {
      this.init(this.seqA, this.seqB);
    }
  }

  init(seqA, seqB) {
    this.seqA = seqA;
    this.seqB = seqB;
    if (!this.container) return;
    const isEn = this.lang === 'en';
    const pctSavings = Math.round((1 - 2 / (seqA.length + 1)) * 100);
    this.container.innerHTML = `
      <div class="two-row-wrap">
        <div class="two-row-meta">
          <span class="two-row-badge">${isEn ? '2-ROW BUFFER (PING-PONG BUFFER)' : 'BỘ ĐỆM 2 DÒNG (PING-PONG BUFFER)'}</span>
          <span class="two-row-ram">${isEn ? `RAM Savings: <strong>${pctSavings}%</strong> vs Full 2D Matrix` : `Bộ nhớ RAM tiết kiệm: <strong>${pctSavings}%</strong> so với ma trận 2D`}</span>
        </div>
        <div class="two-row-table-wrap" id="two-row-grid"></div>
      </div>
    `;
  }

  applySnapshot(snapshot) {
    const gridEl = this.container ? this.container.querySelector('#two-row-grid') : null;
    if (!gridEl || !snapshot || !snapshot.twoRowSnapshot) return;

    const { prevRow = [], currRow = [], activeCol = -1 } = snapshot.twoRowSnapshot;
    const n = prevRow.length;
    const isEn = this.lang === 'en';

    let html = `<table class="two-row-table"><thead><tr><th>${isEn ? 'Buffer Row' : 'Dòng Buffer'}</th>`;
    for (let j = 0; j < n; j++) {
      const char = j > 0 && this.seqB ? this.seqB[j - 1] : 'ε';
      html += `<th>${char}<br><small>${j}</small></th>`;
    }
    html += '</tr></thead><tbody>';

    // Previous Row
    html += '<tr class="buffer-row buffer-prev"><td class="row-label">prevRow (L_prev)</td>';
    for (let j = 0; j < n; j++) {
      const isRef = activeCol >= 0 && (j === activeCol || j === activeCol - 1);
      const cls = isRef ? 'cell-ref' : '';
      html += `<td class="${cls}">${prevRow[j] ?? 0}</td>`;
    }
    html += '</tr>';

    // Current Row
    html += '<tr class="buffer-row buffer-curr"><td class="row-label">currRow (L_curr)</td>';
    for (let j = 0; j < n; j++) {
      const isActive = j === activeCol;
      const cls = isActive ? 'cell-active' : '';
      html += `<td class="${cls}">${currRow[j] ?? 0}</td>`;
    }
    html += '</tr></tbody></table>';

    gridEl.innerHTML = html;
  }
}
